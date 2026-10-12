import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { WhatsAppChannelLink } from "@/components/player/WhatsAppFollow";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/hooks/useChat";
import type { RoomPin } from "@/hooks/useRoom";

type ChatPanelShellProps = {
  signedUp: boolean;
  messages: ChatMessage[];
  pin: RoomPin | null;
  onSend: (body: string) => Promise<void>;
  onClose: () => void;
  onJoinToChat: () => void;
};

export function ChatPanelShell({
  signedUp,
  messages,
  pin,
  onSend,
  onClose,
  onJoinToChat,
}: ChatPanelShellProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const [showJump, setShowJump] = useState(false);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);

  function updateStick() {
    const el = listRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const stuck = distance <= 80;
    stickToBottomRef.current = stuck;
    setShowJump(!stuck);
  }

  function scrollToBottom() {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    stickToBottomRef.current = true;
    setShowJump(false);
  }

  useEffect(() => {
    if (stickToBottomRef.current) {
      scrollToBottom();
    } else {
      setShowJump(true);
    }
  }, [messages]);

  async function submit() {
    const trimmed = draft.trim();
    if (!trimmed || cooldown) return;
    setSendError(null);
    try {
      await onSend(trimmed);
      setDraft("");
      setCooldown(true);
      window.setTimeout(() => setCooldown(false), 2_000);
      stickToBottomRef.current = true;
    } catch (error) {
      setSendError(
        error instanceof Error && error.message === "rate-limit"
          ? "Slow down a sec"
          : "Message didn't send",
      );
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  const counterVisible = draft.length >= 240;

  return (
    <aside id="chat-panel" className="chat-shell" aria-label="Chat">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <span className="font-label text-[12px] font-bold uppercase tracking-[0.15em] text-muted">
          Chat
        </span>
        <WhatsAppChannelLink compact />
        <button
          type="button"
          className="chat-close font-label text-[11px] font-bold uppercase tracking-[0.15em] text-muted"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      {pin ? (
        <div className="chat-pin">
          {pin.body}
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">
        <div
          ref={listRef}
          className="chat-list"
          onScroll={updateStick}
        >
          {messages.length === 0 ? (
            <p className="px-1 py-6 text-center text-[15px] leading-relaxed text-muted">
              No messages yet. Say hi!
            </p>
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className={message.isHost ? "chat-message chat-message-host" : "chat-message"}
              >
                <div className="flex items-center gap-2">
                  <span className="font-label text-[12px] font-bold uppercase tracking-[0.15em] text-muted">
                    {message.displayName}
                  </span>
                  {message.isHost ? <span className="chat-host-pill">HOST</span> : null}
                </div>
                <p className={message.isHost ? "chat-body chat-body-host" : "chat-body"}>
                  {message.body}
                </p>
              </article>
            ))
          )}
        </div>

        {showJump ? (
          <button type="button" className="chat-jump" onClick={scrollToBottom}>
            NEW MESSAGES ↓
          </button>
        ) : null}
      </div>

      <div className="border-t border-border p-3">
        {signedUp ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="flex items-end gap-2">
              <textarea
                className="chat-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={280}
                rows={2}
                enterKeyHint="send"
                aria-label="Message"
              />
              <Button type="submit" size="sm" disabled={cooldown || draft.trim().length === 0}>
                Send →
              </Button>
            </div>
            {counterVisible ? (
              <p className="text-right font-label text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
                {draft.length}/280
              </p>
            ) : null}
            {sendError ? (
              <p className="text-[15px] leading-relaxed text-pink" role="alert">
                {sendError}
              </p>
            ) : null}
          </form>
        ) : (
          <Button type="button" className="w-full" onClick={onJoinToChat}>
            JOIN THE GAME TO CHAT →
          </Button>
        )}
      </div>
    </aside>
  );
}
