import { WhatsAppChannelLink } from "@/components/player/WhatsAppFollow";

type ChatPanelShellProps = {
  onClose: () => void;
};

export function ChatPanelShell({ onClose }: ChatPanelShellProps) {
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
    </aside>
  );
}
