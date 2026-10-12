import { onAuthStateChanged } from "firebase/auth";
import { onDisconnect, ref, remove, serverTimestamp, set } from "firebase/database";
import { useEffect } from "react";
import { auth, rtdb } from "@/lib/firebase";

export function usePresence(roomId = "ikt") {
  useEffect(() => {
    let cancelled = false;
    let presencePath: ReturnType<typeof ref> | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;

      if (presencePath) {
        try {
          await onDisconnect(presencePath).cancel();
          await remove(presencePath);
        } catch {
          // Presence cleanup is best-effort if the connection already dropped.
        }
        presencePath = null;
      }

      if (!user) return;

      const entry = ref(rtdb, `presence/${roomId}/${user.uid}`);
      presencePath = entry;
      try {
        await onDisconnect(entry).remove();
        if (cancelled) return;
        await set(entry, { at: serverTimestamp() });
      } catch {
        // Presence is optional for chat; a failed write should not break the page.
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
      if (presencePath) {
        void onDisconnect(presencePath).cancel();
        void remove(presencePath);
      }
    };
  }, [roomId]);
}
