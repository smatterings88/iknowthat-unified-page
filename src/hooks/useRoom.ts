import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";

export type RoomPin = {
  body: string;
  setAt: Date | null;
};

export type RoomAlert = {
  id: string;
  body: string;
  sentAt: Date | null;
};

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate();
  }
  return null;
}

function readPin(value: unknown): RoomPin | null {
  if (!value || typeof value !== "object") return null;
  const pin = value as { body?: unknown; setAt?: unknown };
  if (typeof pin.body !== "string" || pin.body.length === 0) return null;
  return { body: pin.body, setAt: toDate(pin.setAt) };
}

function readAlert(value: unknown): RoomAlert | null {
  if (!value || typeof value !== "object") return null;
  const alert = value as { id?: unknown; body?: unknown; sentAt?: unknown };
  if (typeof alert.id !== "string" || alert.id.length === 0) return null;
  if (typeof alert.body !== "string") return null;
  return { id: alert.id, body: alert.body, sentAt: toDate(alert.sentAt) };
}

export function useRoom(roomId = "ikt") {
  const [pin, setPin] = useState<RoomPin | null>(null);
  const [alert, setAlert] = useState<RoomAlert | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "rooms", roomId), (snapshot) => {
      const data = snapshot.data();
      setPin(readPin(data?.pin));
      setAlert(readAlert(data?.alert));
      setReady(true);
    });

    return unsubscribe;
  }, [roomId]);

  return { pin, alert, ready };
}
