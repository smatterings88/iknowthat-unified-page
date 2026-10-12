import { useEffect, useMemo, useRef, useState } from "react";
import { AlertBanner } from "@/components/chat/AlertBanner";
import { ChatPanelShell } from "@/components/chat/ChatPanelShell";
import { SignUpScreen } from "@/components/player/SignUpScreen";
import { WhatsAppFollow } from "@/components/player/WhatsAppFollow";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";
import { usePresence } from "@/hooks/usePresence";
import { useProfile } from "@/hooks/useProfile";
import { useRoom } from "@/hooks/useRoom";
import { buildCrowdpurrUrl } from "@/lib/crowdpurr";
import { cn } from "@/lib/utils";

export function PlayerPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const { status, profile, createProfile, retry } = useProfile();
  const { messages, ready: chatReady, send } = useChat("ikt", profile?.nickname ?? null);
  const { pin, alert, ready: roomReady } = useRoom("ikt");
  usePresence("ikt");

  const iframeSrc = useMemo(() => {
    if (status !== "ready" || !profile) return null;
    return buildCrowdpurrUrl(profile.nickname, profile.email);
  }, [status, profile]);

  const frozenSrcRef = useRef<string | null>(null);
  if (iframeSrc && !frozenSrcRef.current) {
    frozenSrcRef.current = iframeSrc;
  }

  const primedUnreadRef = useRef(false);
  const knownIdsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!chatReady) return;

    const ids = new Set(messages.map((message) => message.id));
    if (!primedUnreadRef.current) {
      knownIdsRef.current = ids;
      primedUnreadRef.current = true;
      return;
    }

    let added = 0;
    for (const message of messages) {
      if (!knownIdsRef.current.has(message.id)) added += 1;
    }
    knownIdsRef.current = ids;

    if (!drawerOpen && added > 0) {
      setUnread((count) => count + added);
    }
  }, [chatReady, drawerOpen, messages]);

  useEffect(() => {
    if (drawerOpen) setUnread(0);
  }, [drawerOpen]);

  function handleJoinToChat() {
    setDrawerOpen(false);
    window.setTimeout(() => {
      document.getElementById("signup-nickname")?.focus();
    }, 0);
  }

  return (
    <div className={cn("player-layout", drawerOpen && "drawer-open")}>
      <AlertBanner alert={alert} ready={roomReady} />

      <header className="player-header">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <img
            src="/brand/iknowthat-logo-dark.png"
            alt="I KNOW THAT!"
            width={1671}
            height={941}
            className="h-16 w-auto object-contain object-left"
          />
          <WhatsAppFollow />
        </div>
        <div className="h-[2px] w-full bg-rainbow" aria-hidden="true" />
      </header>

      {status === "loading" ? (
        <div className="player-stage player-stage-message" aria-busy="true" aria-live="polite">
          <p className="font-label text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
            Loading
          </p>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="player-stage player-stage-message" role="alert">
          <p className="max-w-md text-[16px] leading-relaxed text-foreground">
            We couldn't connect. Check your connection and try again.
          </p>
          <Button type="button" onClick={retry}>
            TRY AGAIN →
          </Button>
        </div>
      ) : null}

      {status === "needs-signup" ? <SignUpScreen onSubmit={createProfile} /> : null}

      {status === "ready" && frozenSrcRef.current ? (
        <iframe
          className="player-iframe"
          src={frozenSrcRef.current}
          title="I KNOW THAT! live play"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      ) : null}

      <ChatPanelShell
        signedUp={status === "ready"}
        messages={messages}
        pin={pin}
        onSend={send}
        onClose={() => setDrawerOpen(false)}
        onJoinToChat={handleJoinToChat}
      />

      <Button
        variant="secondary"
        className="chat-fab"
        aria-expanded={drawerOpen}
        aria-controls="chat-panel"
        onClick={() => setDrawerOpen(true)}
      >
        Chat →
        {unread > 0 ? <span className="chat-unread">{unread}</span> : null}
      </Button>
    </div>
  );
}
