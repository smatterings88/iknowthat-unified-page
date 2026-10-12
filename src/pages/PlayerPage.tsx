import { useMemo, useRef, useState } from "react";
import { ChatPanelShell } from "@/components/chat/ChatPanelShell";
import { SignUpScreen } from "@/components/player/SignUpScreen";
import { WhatsAppFollow } from "@/components/player/WhatsAppFollow";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { buildCrowdpurrUrl } from "@/lib/crowdpurr";
import { cn } from "@/lib/utils";

export function PlayerPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { status, profile, createProfile, retry } = useProfile();

  const iframeSrc = useMemo(() => {
    if (status !== "ready" || !profile) return null;
    return buildCrowdpurrUrl(profile.nickname, profile.email);
  }, [status, profile]);

  const frozenSrcRef = useRef<string | null>(null);
  if (iframeSrc && !frozenSrcRef.current) {
    frozenSrcRef.current = iframeSrc;
  }

  function handleJoinToChat() {
    setDrawerOpen(false);
    window.setTimeout(() => {
      document.getElementById("signup-nickname")?.focus();
    }, 0);
  }

  return (
    <div className={cn("player-layout", drawerOpen && "drawer-open")}>
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
      </Button>
    </div>
  );
}
