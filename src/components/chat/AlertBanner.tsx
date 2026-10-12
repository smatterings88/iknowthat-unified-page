import { useEffect, useRef, useState } from "react";
import type { RoomAlert } from "@/hooks/useRoom";

const SEEN_KEY = "ikt-seen-alert-ids";
const SEEN_LIMIT = 20;
const ALERT_MS = 8_000;
const STALE_MS = 60_000;

function loadSeen(): Set<string> {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? new Set(parsed.filter((id): id is string => typeof id === "string").slice(-SEEN_LIMIT))
      : new Set();
  } catch {
    return new Set();
  }
}

function rememberSeen(ids: Set<string>) {
  const trimmed = [...ids].slice(-SEEN_LIMIT);
  ids.clear();
  for (const id of trimmed) ids.add(id);
  window.localStorage.setItem(SEEN_KEY, JSON.stringify(trimmed));
}

type AlertBannerProps = {
  alert: RoomAlert | null;
  ready: boolean;
};

export function AlertBanner({ alert, ready }: AlertBannerProps) {
  const [visible, setVisible] = useState<RoomAlert | null>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const primedRef = useRef(false);
  const alertRef = useRef(alert);
  const alertId = alert?.id ?? null;
  alertRef.current = alert;

  useEffect(() => {
    seenRef.current = loadSeen();
  }, []);

  useEffect(() => {
    if (!ready) return;

    const current = alertRef.current;
    if (!alertId || !current) {
      primedRef.current = true;
      return;
    }

    if (seenRef.current.has(alertId)) {
      primedRef.current = true;
      return;
    }

    if (!primedRef.current) {
      primedRef.current = true;
      const sentAt = current.sentAt?.getTime();
      if (sentAt && Date.now() - sentAt > STALE_MS) {
        seenRef.current.add(alertId);
        rememberSeen(seenRef.current);
        return;
      }
    }

    seenRef.current.add(alertId);
    rememberSeen(seenRef.current);
    setVisible(current);

    const timeoutId = window.setTimeout(() => {
      setVisible((shown) => (shown?.id === alertId ? null : shown));
    }, ALERT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [alertId, ready]);

  if (!visible) return null;

  return (
    <div className="alert-banner" role="status">
      <p className="min-w-0 flex-1 text-[16px] leading-relaxed">{visible.body}</p>
      <button
        type="button"
        className="shrink-0 px-2 font-label text-[16px] font-bold leading-none tracking-[0.15em]"
        aria-label="Dismiss alert"
        onClick={() => setVisible(null)}
      >
        ✕
      </button>
    </div>
  );
}
