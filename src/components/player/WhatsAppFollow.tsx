import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const WHATSAPP_CHANNEL_URL = import.meta.env.VITE_WHATSAPP_CHANNEL_URL;

export function WhatsAppFollow() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="outline"
        className="shrink-0"
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => setOpen((value) => !value)}
      >
        Follow on WhatsApp →
      </Button>
      {open ? (
        <div
          id={popoverId}
          role="dialog"
          aria-label="Follow on WhatsApp"
          className="absolute right-0 top-full z-40 mt-2 w-64 border-[1.5px] border-border bg-surface-2 p-4"
        >
          {/* TODO: Replace public/brand/whatsapp-qr.png with the Channel QR, not the group QR. */}
          <img
            src="/brand/whatsapp-qr.png"
            alt="WhatsApp channel QR code"
            width={284}
            height={282}
            className="w-full"
          />
          <a
            href={WHATSAPP_CHANNEL_URL || undefined}
            target={WHATSAPP_CHANNEL_URL ? "_blank" : undefined}
            rel={WHATSAPP_CHANNEL_URL ? "noopener noreferrer" : undefined}
            className="mt-3 flex h-10 items-center justify-center rounded-full border border-border px-4 font-label text-[11px] font-bold uppercase tracking-[0.15em] text-foreground"
            onClick={(event) => {
              if (!WHATSAPP_CHANNEL_URL) event.preventDefault();
            }}
          >
            Follow on WhatsApp →
          </a>
        </div>
      ) : null}
    </div>
  );
}

export function WhatsAppChannelLink({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href={WHATSAPP_CHANNEL_URL || undefined}
      target={WHATSAPP_CHANNEL_URL ? "_blank" : undefined}
      rel={WHATSAPP_CHANNEL_URL ? "noopener noreferrer" : undefined}
      className={
        compact
          ? "drawer-whatsapp font-label text-[11px] font-bold uppercase tracking-[0.15em] text-foreground"
          : undefined
      }
      onClick={(event) => {
        if (!WHATSAPP_CHANNEL_URL) event.preventDefault();
      }}
    >
      WhatsApp →
    </a>
  );
}
