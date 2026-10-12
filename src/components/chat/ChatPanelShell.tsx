import { WhatsAppChannelLink } from "@/components/player/WhatsAppFollow";
import { Button } from "@/components/ui/button";

type ChatPanelShellProps = {
  signedUp: boolean;
  onClose: () => void;
  onJoinToChat: () => void;
};

export function ChatPanelShell({
  signedUp,
  onClose,
  onJoinToChat,
}: ChatPanelShellProps) {
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
      <div className="min-h-0 flex-1" />
      <div className="border-t border-border p-3">
        {signedUp ? (
          <p className="px-2 py-3 text-center text-[15px] leading-relaxed text-muted">
            Chat coming soon
          </p>
        ) : (
          <Button type="button" className="w-full" onClick={onJoinToChat}>
            JOIN THE GAME TO CHAT →
          </Button>
        )}
      </div>
    </aside>
  );
}
