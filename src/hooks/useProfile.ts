import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";

export type PlayerProfile = {
  nickname: string;
  email: string;
  consentTerms: boolean;
  consentMarketingEmail: boolean;
  consentedAt: unknown;
  source: string;
};

export type ProfileStatus = "loading" | "needs-signup" | "ready" | "error";

export type CreateProfileInput = {
  nickname: string;
  email: string;
  consentTerms: boolean;
  consentMarketingEmail: boolean;
};

function errorCode(error: unknown): string {
  if (typeof error === "string") return error;
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }
  if (error instanceof Error && error.message) return error.message;
  return "unknown";
}

export function useProfile() {
  const [status, setStatus] = useState<ProfileStatus>("loading");
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setProfile(null);
    setStatus("loading");
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let started = false;
    let finished = false;

    const timeoutId = window.setTimeout(() => {
      if (cancelled || finished) return;
      finished = true;
      console.error("timeout");
      setStatus("error");
    }, 15_000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled || started || finished) return;
      started = true;

      try {
        const signedIn = user ?? (await signInAnonymously(auth)).user;
        if (cancelled || finished) return;

        const snapshot = await getDoc(doc(db, "users", signedIn.uid));
        if (cancelled || finished) return;

        finished = true;
        window.clearTimeout(timeoutId);

        if (snapshot.exists()) {
          setProfile(snapshot.data() as PlayerProfile);
          setStatus("ready");
        } else {
          setProfile(null);
          setStatus("needs-signup");
        }
      } catch (error) {
        console.error(errorCode(error));
        if (!cancelled && !finished) {
          finished = true;
          window.clearTimeout(timeoutId);
          setStatus("error");
        }
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [attempt]);

  const createProfile = useCallback(async (input: CreateProfileInput) => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Sign-in is still finishing. Try again in a moment.");
    }

    await setDoc(doc(db, "users", user.uid), {
      nickname: input.nickname,
      email: input.email,
      consentTerms: input.consentTerms,
      consentMarketingEmail: input.consentMarketingEmail,
      consentedAt: serverTimestamp(),
      source: "play-page-signup",
    });

    setProfile({
      nickname: input.nickname,
      email: input.email,
      consentTerms: input.consentTerms,
      consentMarketingEmail: input.consentMarketingEmail,
      consentedAt: null,
      source: "play-page-signup",
    });
    setStatus("ready");
  }, []);

  return { status, profile, createProfile, retry };
}
