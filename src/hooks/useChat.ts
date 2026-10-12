import { FirebaseError } from "firebase/app";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";

const LAST_SENT_KEY = "ikt-last-message-at";

function rememberLastSend() {
  window.localStorage.setItem(LAST_SENT_KEY, String(Date.now()));
}

function sentRecentlyOnThisDevice() {
  const last = Number(window.localStorage.getItem(LAST_SENT_KEY) ?? 0);
  return Number.isFinite(last) && Date.now() - last < 3_000;
}

export type ChatMessage = {
  id: string;
  uid: string;
  displayName: string;
  body: string;
  isHost: boolean;
  hidden: boolean;
  createdAt: Date | null;
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

export function useChat(roomId = "ikt", nickname: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const messagesQuery = query(
      collection(db, "rooms", roomId, "messages"),
      where("hidden", "==", false),
      orderBy("createdAt", "desc"),
      limit(100),
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const next = snapshot.docs
        .map((item) => {
          const data = item.data({ serverTimestamps: "estimate" });
          return {
            id: item.id,
            uid: typeof data.uid === "string" ? data.uid : "",
            displayName: typeof data.displayName === "string" ? data.displayName : "",
            body: typeof data.body === "string" ? data.body : "",
            isHost: data.isHost === true,
            hidden: data.hidden === true,
            createdAt: toDate(data.createdAt),
          };
        })
        .reverse();
      setMessages(next);
      setReady(true);
    });

    return unsubscribe;
  }, [roomId]);

  const send = useCallback(
    async (body: string) => {
      const trimmed = body.trim();
      if (trimmed.length < 1 || trimmed.length > 280) {
        throw new Error("invalid-body");
      }

      const user = auth.currentUser;
      if (!user || !nickname) {
        throw new Error("not-signed-up");
      }

      const batch = writeBatch(db);
      const messageRef = doc(collection(db, "rooms", roomId, "messages"));
      batch.set(messageRef, {
        uid: user.uid,
        displayName: nickname,
        body: trimmed,
        isHost: false,
        hidden: false,
        createdAt: serverTimestamp(),
      });
      batch.set(
        doc(db, "rateLimits", user.uid),
        { lastMessageAt: serverTimestamp() },
        { merge: true },
      );

      try {
        await batch.commit();
        rememberLastSend();
      } catch (error) {
        if (
          error instanceof FirebaseError &&
          error.code === "permission-denied" &&
          sentRecentlyOnThisDevice()
        ) {
          throw new Error("rate-limit");
        }
        throw error;
      }
    },
    [nickname, roomId],
  );

  return { messages, ready, send };
}
