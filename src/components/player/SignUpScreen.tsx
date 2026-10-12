import { FirebaseError } from "firebase/app";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { CreateProfileInput } from "@/hooks/useProfile";

const RESERVED_NICKNAMES = [
  "ken",
  "host",
  "admin",
  "moderator",
  "crowdpurr",
  "i know that",
  "i know that!",
];

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type SignUpScreenProps = {
  onSubmit: (input: CreateProfileInput) => Promise<void>;
};

function FieldLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href || undefined}
      target="_blank"
      rel="noreferrer"
      className="underline decoration-border underline-offset-2 hover:text-foreground"
    >
      {children}
    </a>
  );
}

function isReservedNickname(nickname: string) {
  return RESERVED_NICKNAMES.includes(nickname.toLowerCase());
}

export function SignUpScreen({ onSubmit }: SignUpScreenProps) {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentMarketingEmail, setConsentMarketingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedNickname = nickname.trim();
    const trimmedEmail = email.trim();

    if (trimmedNickname.length < 2 || trimmedNickname.length > 20) {
      setError("Nickname must be between 2 and 20 characters.");
      return;
    }
    if (isReservedNickname(trimmedNickname)) {
      setError("That nickname is reserved. Please choose another.");
      return;
    }
    if (trimmedEmail.length > 254 || !EMAIL_PATTERN.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!consentTerms) {
      setError("Please agree to the Terms of Use and Privacy Policy.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        nickname: trimmedNickname,
        email: trimmedEmail,
        consentTerms: true,
        consentMarketingEmail,
      });
    } catch (cause) {
      if (cause instanceof FirebaseError && cause.code === "permission-denied") {
        setError(
          "We couldn't save your sign-up. Check the nickname, email, and required checkbox, then try again.",
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="player-stage">
      <form
        className="mx-auto flex w-full max-w-xl flex-col gap-5 px-5 py-8"
        onSubmit={handleSubmit}
        noValidate
      >
        <h1 className="font-display text-[2.5rem] uppercase leading-[0.95] text-foreground">
          JOIN THE GAME.
        </h1>

        <label className="flex flex-col gap-1.5">
          <span className="font-label text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
            Nickname *
          </span>
          <input
            id="signup-nickname"
            name="nickname"
            type="text"
            autoComplete="nickname"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            minLength={2}
            maxLength={20}
            required
            className="signup-input"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-label text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
            Email *
          </span>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={254}
            required
            className="signup-input"
          />
        </label>

        <label className="flex items-start gap-3 text-[15px] leading-relaxed text-foreground">
          <input
            type="checkbox"
            className="signup-checkbox"
            checked={consentTerms}
            onChange={(event) => setConsentTerms(event.target.checked)}
            required
          />
          <span>
            I agree to the{" "}
            <FieldLink href={import.meta.env.VITE_TERMS_URL}>Terms of Use</FieldLink> and
            acknowledge the{" "}
            <FieldLink href={import.meta.env.VITE_PRIVACY_URL}>Privacy Policy</FieldLink>. *
          </span>
        </label>

        <label className="flex items-start gap-3 text-[15px] leading-relaxed text-foreground">
          <input
            type="checkbox"
            className="signup-checkbox"
            checked={consentMarketingEmail}
            onChange={(event) => setConsentMarketingEmail(event.target.checked)}
          />
          <span>
            By signing up, you agree to receive OH THAT! news, launch updates, show
            announcements, and marketing emails. You may unsubscribe at any time. See our{" "}
            <FieldLink href={import.meta.env.VITE_PRIVACY_URL}>Privacy Policy</FieldLink>.
          </span>
        </label>

        {error ? (
          <p className="text-[15px] leading-relaxed text-pink" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          JOIN THE GAME →
        </Button>

        <p className="text-center text-[13px] leading-relaxed text-muted">
          By signing in you accept our{" "}
          <FieldLink href={import.meta.env.VITE_GAME_PRIVACY_URL}>Privacy Policy</FieldLink>,{" "}
          <FieldLink href={import.meta.env.VITE_GAME_TERMS_URL}>Terms &amp; Conditions</FieldLink>
          , &amp;{" "}
          <FieldLink href={import.meta.env.VITE_GAME_GDPR_URL}>GDPR Compliance Policy</FieldLink>.
        </p>
      </form>
    </div>
  );
}
