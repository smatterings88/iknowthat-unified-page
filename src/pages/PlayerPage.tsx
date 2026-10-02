import { useState } from "react";
import { ChatPanelShell } from "@/components/chat/ChatPanelShell";
import { WhatsAppFollow } from "@/components/player/WhatsAppFollow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CROWDPURR_URL = import.meta.env.VITE_CROWDPURR_URL;

export function PlayerPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

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

      <iframe
        className="player-iframe"
        src={CROWDPURR_URL || undefined}
        title="I KNOW THAT! live play"
        allow="camera; microphone; autoplay; fullscreen"
        allowFullScreen
      />

      <ChatPanelShell onClose={() => setDrawerOpen(false)} />

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
