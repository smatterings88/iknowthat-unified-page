# I KNOW THAT! — Live Play Page Prototype (SPEC)

Prototype in Cursor and test it on Vercel. Once Ken approves it, rebuild it on Lovable with **Supabase** as the backend. The prototype uses Lovable's front-end stack so the front end moves over as a copy. The prototype backend is **Firebase**, so keep every backend call in small hooks; those are the only parts that get rewritten for Supabase.

## 1. Goal

Build one page where a player, using only one phone, can:

1. Watch the show and play the game. Both happen inside the Crowdpurr Participant View, which already carries the OBS video and audio.
2. Chat live with other players and with Ken.
3. Follow I KNOW THAT! on WhatsApp and sign up for reminders.

Ken also gets a large-type **host screen** he can read during the show.

## 2. Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- React Router
- **Firebase** (modular v10+ web SDK):
  - **Authentication:** anonymous sign-in for players, email/password for hosts
  - **Cloud Firestore:** chat, announcements, opt-ins
  - **Realtime Database:** presence only (who is on the page)
- **Hosting:** Vercel, for preview and testing. Firebase is used only for Auth and the databases.
- **No Next.js** and no server components. No Supabase in the prototype (the final Lovable version moves to Supabase).
- **No Cloud Functions** in the prototype. All permissions come from Firestore Security Rules, so the project can stay on the free Spark plan.

Env vars:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_APP_ID=
VITE_CROWDPURR_URL=        # the Crowdpurr experience link that accepts ?f= and ?e= (see section 5)
VITE_WHATSAPP_CHANNEL_URL=
VITE_TERMS_URL=
VITE_PRIVACY_URL=
VITE_GAME_PRIVACY_URL=     # the three links on Crowdpurr's own sign-in screen
VITE_GAME_TERMS_URL=
VITE_GAME_GDPR_URL=
```

Put all Firebase setup in one file, `src/lib/firebase.ts`, and keep Firestore reads and writes in small hooks (`useProfile`, `useChat`, `useAnnouncements`, `usePresence`). That keeps the backend easy to swap out later.

## 3. Routes

| Route   | Purpose                                     |
|---------|---------------------------------------------|
| `/`     | Player page: Crowdpurr and chat             |
| `/host` | Ken's host screen (requires host sign-in)   |

## 4. Player page layout

**Desktop (≥ 1024px):** Crowdpurr fills about 75% of the width on the left. The chat panel fills about 25% on the right and is full height. A slim header holds the I KNOW THAT! logo, a "Follow on WhatsApp" button, a rainbow "REMIND ME TO PLAY →" button, and a 2px rainbow rule along the bottom edge.

```
┌──────────────────────────────────────────────────────────┬──────────────┐
│ LOGO              [Follow on WA]  [REMIND ME TO PLAY →]  │              │
├════════════════════ rainbow rule ════════════════════════┤   CHAT       │
│                                                          │  pinned msg  │
│          CROWDPURR IFRAME                                │  messages    │
│     (video + question + answers)                         │              │
│                                                          │  [input]     │
└──────────────────────────────────────────────────────────┴──────────────┘
```

**Mobile:** Crowdpurr is full screen. The page header stays hidden below 1024px. A floating chat button in the bottom-right corner shows the unread count. Tapping it opens a bottom drawer that covers about 70% of the screen height, with Crowdpurr still visible behind it. The drawer header holds a compact WhatsApp button and the rainbow "REMIND ME TO PLAY →" button. If a host alert is active, it appears as a banner at the top above everything.

**Reminder modal:** "REMIND ME TO PLAY →" opens a modal. The modal overlays the page and must not unmount, reload, or move the iframe.

### Hard rules for the iframe

- Render the iframe **only once the player's nickname and email are known** (section 5), with its final `src` already built. Until then, the sign-up screen occupies the iframe's place in the layout. Never load an empty iframe and then change its `src`.
- Once rendered, the iframe stays at the root of the layout and must **never unmount or reload** because of chat, drawer, alert, modal, QR popover, or resize state. Its `src` never changes during the session. Don't give it a changing `key`, and don't move it to a different parent when the layout changes. Change the layout with CSS only.
- `allow="autoplay; fullscreen"` plus `allowfullscreen`. Players don't need camera or microphone.
- Use `dvh` units (`h-[100dvh]`) so mobile browser bars don't cut it off.

## 5. Player sign-up and Crowdpurr auto-login

One sign-up on the play page identifies the player for both the game and chat. Crowdpurr's own sign-in form (nickname and email) is skipped because the page passes both values in the iframe link.

**Crowdpurr feature used:** automatic participant login with URL query parameters (Seminar plan or higher). If every required lead-capture field is supplied, Crowdpurr skips its sign-in form. This experience asks only for nickname and email:

| Parameter | Crowdpurr field |
|-----------|-----------------|
| `f`       | Nickname        |
| `e`       | Email           |

Build the link with `new URL(VITE_CROWDPURR_URL)` and `searchParams.set("f", nickname)` / `searchParams.set("e", email)`, keeping any parameters already on the link. Put the URL builder in `src/lib/crowdpurr.ts`.

This is identification, not secure authentication. Anyone who knows a player's email can build their link. That's acceptable for the beta. Prize eligibility will need verified email later.

**Page load:**
1. Sign in with Firebase anonymous auth.
2. Read `users/{uid}`. While this is loading, show a quiet loading state in the iframe's place. Don't flash the sign-up screen.
3. If the profile exists, build the Crowdpurr link and render the iframe. No form is shown.
4. If not, show the sign-up screen in the iframe's place.

**Sign-up screen:** styled like the rest of the page (section 10), headline "JOIN THE GAME." Desktop: fills the game area, with chat still visible on the right. Mobile: fills the screen where the game will be, and the chat button still works.
- **Nickname** (required): 2–20 characters, trimmed. Reject reserved names, case-insensitive: `ken`, `host`, `admin`, `moderator`, `crowdpurr`, `i know that`, `i know that!`. TODO: check Crowdpurr's own nickname limits and match them.
- **Email** (required): basic format check, maximum 254 characters.
- **Checkbox 1** (required): the Terms checkbox, verbatim from section 8.
- **Checkbox 2** (optional, unchecked): the marketing email checkbox, verbatim from section 8.
- Below the button, reproduce Crowdpurr's own consent line, because players no longer see Crowdpurr's form: "By signing in you accept our Privacy Policy, Terms & Conditions, & GDPR Compliance Policy." Link the three names to `VITE_GAME_PRIVACY_URL`, `VITE_GAME_TERMS_URL`, and `VITE_GAME_GDPR_URL`. TODO: the consent reviewer decides whether Checkbox 1 should also cover these.
- Button: "JOIN THE GAME →", rainbow style.

On submit, create `users/{uid}` with `nickname`, `email`, `consentTerms`, `consentMarketingEmail`, `consentedAt: serverTimestamp()`, and `source: "play-page-signup"`. Then render the iframe with the built link.

**No editing in the prototype.** A player can't change their nickname or email after sign-up, because a new link would reload the game mid-show. A new browser or device means signing up again; Crowdpurr's returning-participant setting (section 9, setup) restores their player and score by email.

**Privacy:** the email is readable only by its owner. It is never written to messages or anywhere other players can read.

## 6. Chat

**Identity:**
- Chat uses the nickname from the player sign-up (section 5), so a player's chat name matches their game name.
- Anyone can read chat before signing up. Until then, the chat input is replaced by a "JOIN THE GAME TO CHAT →" button that brings the player to the sign-up screen (on mobile, it closes the drawer).

**Behavior:**
- Use a Firestore `onSnapshot` listener on `rooms/ikt/messages`, filtered to `hidden == false`, ordered by `createdAt`, limited to the last 100 messages.
- Auto-scroll to the newest message, unless the user has scrolled up. In that case, show a "New messages ↓" button.
- Count unread messages while the mobile drawer is closed.
- Limit each person to one message every 2 seconds, including hosts. Host messages use the same batched write. Enforce it in the Security Rules (see section 9), not just in the app. The 280-character maximum is also enforced in the rules.
- Use `serverTimestamp()` for `createdAt`. Never trust the device clock.
- Hidden messages (moderation) disappear for everyone.

**Host messages:**
- They show a pink **HOST** badge, a rainbow left border, and a slightly larger font.
- Only a signed-in account with a `hosts/{uid}` document can create a message with `isHost: true`. The Security Rules enforce this, so a regular player can't fake a host message even by editing requests in the browser.

**Pinned announcement:** One active pinned announcement sits at the top of the chat panel and the mobile drawer, styled as a rainbow gradient bar.

**Alert banner:** When the host sends an alert, a pink banner appears over the page for 8 seconds, or until it's dismissed. Each alert has an `id`. A device starts the 8 seconds when it receives a new alert id. It does not time the banner from `sentAt`. On the first load, ignore an alert already on `rooms/ikt` if `sentAt` is more than 60 seconds old by the local clock.

## 7. Host screen (`/host`)

The screen asks Ken to sign in with email and password (Firebase Auth). It then reads `hosts/{uid}`. That read is allowed for the signed-in user. If the document does not exist, show "This account isn't set up as a host."

It's built for an iPad on a teleprompter, or a second screen, read from a distance:
- Message text at least 28px; names at least 18px in bold.
- The newest message is at the bottom, always auto-scrolled. Only the last 30 messages are shown.
- Live count of how many people are on the page, using Realtime Database presence (`presence/ikt/{uid}` with `onDisconnect().remove()`).
- Controls:
  - send a host message
  - set or clear the pinned announcement
  - send an alert
  - hide a message (tap it, then confirm)

## 8. WhatsApp and reminder sign-up

**Follow on WhatsApp**

- Desktop: the header button opens a popover. Click the button to open it. Click outside or press Esc to close it. The popover shows the QR image and a link that opens `VITE_WHATSAPP_CHANNEL_URL` in a new tab.
- Mobile: the compact button in the chat drawer header opens `VITE_WHATSAPP_CHANNEL_URL` directly. There is no QR popover below 1024px.
- TODO: Replace `public/brand/whatsapp-qr.png` with the WhatsApp Channel QR. The file in the repo is a placeholder and must not stay as the group invite QR.

**Reminder sign-up**

The form is a modal opened by the rainbow button "REMIND ME TO PLAY →". Desktop: that button is in the header. Mobile: it is in the chat drawer header, next to the compact WhatsApp button. The modal overlays the page and does not affect the iframe.

Fields: email (required), first name, and an optional mobile number. No checkbox is pre-checked. Do not combine or reword the copy below. Use it verbatim.

Phone field helper text:

> Optional. Text reminders aren't switched on yet, so reminders come by email for now. Giving your number is not consent to texts.

Checkbox 1 (required). "Terms of Use" links to `VITE_TERMS_URL`. "Privacy Policy" links to `VITE_PRIVACY_URL`.

> I agree to the Terms of Use and acknowledge the Privacy Policy. *

Checkbox 2. "Privacy Policy" links to `VITE_PRIVACY_URL`.

> By signing up, you agree to receive OH THAT! news, launch updates, show announcements, and marketing emails. You may unsubscribe at any time. See our Privacy Policy.

Note under checkboxes 1–2:

> Required fields are marked with an asterisk. We record your choices with the date and time.

Checkbox 3:

> I consent to receive non-marketing text messages from FranklinAlexander Ventures, LLC regarding my I KNOW THAT! registration, game participation, game reminders, eligibility, results, prizes, account, security, support, and other game-related service communications. Message frequency may vary. Message and data rates may apply. Text HELP for assistance or reply STOP to opt out.

Checkbox 4:

> I consent to receive marketing and promotional text messages from FranklinAlexander Ventures, LLC at the phone number provided, including OH THAT! show and game announcements, special offers, product drops, Shopping Spree announcements, promotions, and other marketing communications. Message frequency may vary. Message and data rates may apply. Text HELP for assistance or reply STOP to opt out.

Footer line. "Privacy Policy" links to `VITE_PRIVACY_URL`. "Terms of Use" links to `VITE_TERMS_URL`.

> Privacy Policy | Terms of Use. OH THAT! is operated by FranklinAlexander Ventures, LLC.

Submit button: "REMIND ME ABOUT THE NEXT GAME →", rainbow button style.

If the player has signed up (section 5), prefill email and first name (from the nickname) and let them edit both in this form. Save the response to the `optIns` collection in Firestore, with a server timestamp for each consent. Map the four checkboxes to `consentTerms`, `consentMarketingEmail`, `consentSmsService`, and `consentSmsMarketing`.

## 9. Database (Firebase)

### Firestore structure

```
hosts/{uid}                       { } or { name }

users/{uid}                       { nickname, email, consentTerms,
                                    consentMarketingEmail, consentedAt,
                                    source }

rateLimits/{uid}                  { lastMessageAt }

rooms/ikt                         { pin: { body, setAt } | null,
                                    alert: { id, body, sentAt } | null }

rooms/ikt/messages/{messageId}    { uid, displayName, body, isHost,
                                    hidden, createdAt }

optIns/{optInId}                  { email, firstName, phone,
                                    consentTerms, consentMarketingEmail,
                                    consentSmsService, consentSmsMarketing,
                                    consentedAt, source }
```

One document per host, at `hosts/{uid}`. An empty document is enough. `name` is optional. There is no `config/hosts` list.

The pinned announcement and the alert live on the single `rooms/ikt` document, so one listener shows both. Each alert includes an `id`. A device shows the banner for 8 seconds from the moment it receives a new id. On initial page load, ignore an existing alert when `sentAt` is more than 60 seconds old by the local clock.

**Composite index:** `rooms/ikt/messages` on `hidden` (ascending) + `createdAt` (descending).

### Sending a message (rate limit)

Each message is sent in a **batched write** that does two things at once: it creates the message, and it writes `rateLimits/{uid}` (merge) with `lastMessageAt: serverTimestamp()`. The rules reject the batch if the last message was less than 2 seconds ago. Hosts use this same batch and the same 2-second limit. A player message's `displayName` must equal the `nickname` on their `users/{uid}` profile. Host messages are exempt from that match (Ken's host account has no player profile, and "Ken" is a reserved player name).

### Security Rules (Firestore)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {

    function signedIn() { return request.auth != null; }
    function isHost() {
      return signedIn() &&
        exists(/databases/$(db)/documents/hosts/$(request.auth.uid));
    }

    match /hosts/{uid} {
      allow read: if request.auth.uid == uid;
      allow write: if false;            // edit in the Firebase console only
    }

    function validEmail(e) {
      return e is string && e.size() <= 254
        && e.matches('^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$');
    }
    function validNickname(n) {
      return n is string && n.size() >= 2 && n.size() <= 20
        && n == n.trim()
        && !n.lower().matches('^(ken|host|admin|moderator|crowdpurr|i know that!?)$');
    }

    match /users/{uid} {
      allow read: if signedIn() && request.auth.uid == uid;
      allow create: if signedIn() && request.auth.uid == uid
        && request.resource.data.keys().hasOnly([
          'nickname', 'email', 'consentTerms', 'consentMarketingEmail',
          'consentedAt', 'source'
        ])
        && validNickname(request.resource.data.nickname)
        && validEmail(request.resource.data.email)
        && request.resource.data.consentTerms == true
        && request.resource.data.consentMarketingEmail is bool
        && request.resource.data.consentedAt == request.time
        && (!('source' in request.resource.data) || request.resource.data.source is string);
      allow update, delete: if false;   // no editing in the prototype
    }

    match /rateLimits/{uid} {
      allow read: if signedIn() && request.auth.uid == uid;
      allow create, update: if signedIn() && request.auth.uid == uid
        && request.resource.data.keys().hasOnly(['lastMessageAt'])
        && request.resource.data.lastMessageAt == request.time
        && (resource == null
            || request.time > resource.data.lastMessageAt + duration.value(2, 's'));
    }

    match /rooms/{room} {
      allow read: if true;
      allow write: if isHost();         // pin and alert

      match /messages/{id} {
        allow read: if resource.data.hidden == false || isHost();

        allow create: if signedIn()
          && request.resource.data.keys().hasOnly(['uid', 'displayName', 'body', 'isHost', 'hidden', 'createdAt'])
          && request.resource.data.uid == request.auth.uid
          && request.resource.data.displayName is string
          && request.resource.data.displayName.size() >= 2
          && request.resource.data.displayName.size() <= 20
          && request.resource.data.body is string
          && request.resource.data.body.size() >= 1
          && request.resource.data.body.size() <= 280
          && request.resource.data.hidden == false
          && request.resource.data.createdAt == request.time
          && (
            (request.resource.data.isHost == true && isHost())
            || (request.resource.data.isHost == false
                && exists(/databases/$(db)/documents/users/$(request.auth.uid))
                && request.resource.data.displayName ==
                   get(/databases/$(db)/documents/users/$(request.auth.uid)).data.nickname)
          )
          && getAfter(/databases/$(db)/documents/rateLimits/$(request.auth.uid))
               .data.lastMessageAt == request.time;

        allow update: if isHost()
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['hidden']);
        allow delete: if false;
      }
    }

    match /optIns/{id} {
      allow create: if signedIn()
        && request.resource.data.keys().hasOnly([
          'email', 'firstName', 'phone',
          'consentTerms', 'consentMarketingEmail',
          'consentSmsService', 'consentSmsMarketing',
          'consentedAt', 'source'
        ])
        && request.resource.data.email is string
        && request.resource.data.email.matches('^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$')
        && request.resource.data.consentTerms == true
        && request.resource.data.consentMarketingEmail is bool
        && request.resource.data.consentSmsService is bool
        && request.resource.data.consentSmsMarketing is bool
        && request.resource.data.consentedAt == request.time
        && (
          (request.resource.data.consentSmsService == false
            && request.resource.data.consentSmsMarketing == false)
          || (request.resource.data.phone is string
            && request.resource.data.phone.size() > 0)
        )
        && (!('firstName' in request.resource.data) || request.resource.data.firstName is string)
        && (!('phone' in request.resource.data) || request.resource.data.phone is string)
        && (!('source' in request.resource.data) || request.resource.data.source is string);
      allow read, update, delete: if false;
    }
  }
}
```

### Realtime Database rules (presence)

Presence is world-readable for the prototype. Restrict this later.

```json
{
  "rules": {
    "presence": {
      // World-readable for the prototype. Restrict this later.
      "$room": {
        ".read": true,
        "$uid": { ".write": "auth != null && auth.uid === $uid" }
      }
    }
  }
}
```

### Setup steps

1. Create a Firebase project. Enable Anonymous and Email/Password sign-in.
2. Create the Firestore database and the Realtime Database. Deploy both sets of rules and the composite index (keep them in the repo as `firestore.rules`, `database.rules.json`, `firestore.indexes.json`).
3. Create Ken's host account. In Firestore, create `hosts/{his uid}`. An empty document is enough. Optional field: `name`.
4. Create the `rooms/ikt` document with `pin: null, alert: null`.
5. In Crowdpurr, confirm the plan includes automatic participant login (Seminar or higher). Set **Leads → Lead Capture Settings → Returning Participants**: Allow Participants To Sign Back In **on**, Allow Multiple Sign-Ins **off**, Email Address **required**. Make sure the only required lead-capture fields are nickname and email, or the sign-in form won't be skipped.
6. Set `VITE_CROWDPURR_URL` to the experience link itself. If `playiknowthat.com` forwards to Crowdpurr, test whether `?f=` and `?e=` survive the forward; if not, use the direct Crowdpurr link.
7. Add a `vercel.json` with a rewrite of all routes to `/index.html`, so `/host` and refreshes don't 404. Add every `VITE_*` value in Vercel's project settings and redeploy after changing any.
8. Add the Vercel domain to Firebase Auth's authorized domains.

## 10. Design system (taken from the live I KNOW THAT! landing page)

Follow the landing page exactly. This page should look like the same site.

### Color tokens

```css
:root {
  --black: #000000;          /* hero and section backgrounds */
  --brown: #221B08;          /* main page background */
  --brown-raised: #322713;   /* alternate sections */
  --surface: #0E0E0E;        /* highlighted card, chat panel */
  --surface-2: #191A1C;      /* WhatsApp/QR card */
  --border: #716A57;         /* card and input borders */
  --text: #E6E5E3;           /* main text (warm off-white) */
  --text-muted: #A39F94;     /* secondary text */
  --numeral: #5B5441;        /* faded "01 02 03" numbers */
  --pink: #CC006D;           /* solid main button, HOST badge, alert */
  --logo-pink: #F9036E;
  --logo-yellow: #FEC300;
  --rainbow: linear-gradient(90deg,
    #C51361 0%, #B65700 22%, #816F09 38%,
    #458C46 55%, #00A5B1 72%, #1B65AC 86%, #32296C 100%);
}
```

Keep these sampled values for the prototype.

### Type

- **Headlines:** a heavy condensed sans in all caps with tight line spacing (about 0.95). It looks like **Anton** (Google Fonts). Headlines end with a period ("HOW IT WORKS.").
- **Small labels, buttons, nav:** a bold geometric sans in all caps with wide letter spacing (about 0.15em) at 11–13px. It looks like **Montserrat** 700.
- **Body:** a clean sans at 15–16px with relaxed line spacing. It looks like **Figtree**.
- Keep Anton, Montserrat 700, and Figtree for the prototype.
- Use a fallback font list for each, for example `Anton, Impact, "Arial Narrow", sans-serif`.

### Components

- **Buttons:** pill shaped (`rounded-full`), with all-caps, letter-spaced text and a trailing "→".
  - Main: the `--rainbow` gradient background with white text ("REMIND ME TO PLAY →").
  - Secondary: solid `--pink`.
  - Tertiary: a `--border` outline on a dark background.
- **Cards:** square corners, a 1.5px `--border` outline, and a transparent background on brown.
  - Large faded Anton number (`--numeral`), then an Anton headline, then a short body line.
  - Highlighted card: `--surface` background, with the number filled with the rainbow gradient (`background-clip: text`).
- **Rainbow rule:** a 2px `--rainbow` line under the header and between major sections.
- **Inputs:** square, dark background, 1px `--border` outline, a small label above, and at least 16px text so iPhones don't zoom in on focus.
- **Big stats:** huge Anton numbers with a tiny letter-spaced label ("STILL IN IT"). Reuse this style later for the survivor counter.

### Chat styling

- The panel uses the `--surface` background with a `--border` divider on its left edge.
- Display names: Montserrat 700, 12px, all caps, `--text-muted`. Message text: body font, `--text`.
- Host messages: a 3px rainbow left border plus a pink **HOST** pill.
- Pinned announcement: a rainbow gradient bar with white Anton text.
- Use the real logo files from Ken. **Don't redraw the logo.**

## 11. Out of scope for the prototype

These are not part of this build:
- Crowdpurr stats or game data (Crowdpurr has no API)
- Any WhatsApp bridge or embedded WhatsApp group
- Verified login (email codes, magic links, or phone verification). The section 5 sign-up identifies players; it doesn't authenticate them.
- Editing a nickname or email after sign-up
- Prizes, payments, Shopify
- Text messages sent from GoHighLevel (collect consent only)

## 12. Test checklist (real phones, especially iPhone Safari)

- [ ] First visit: the sign-up screen shows in the game area. After joining, the game loads already signed in, with no Crowdpurr form.
- [ ] Reload the page: no sign-up screen, the game is still signed in as the same player, with the same score.
- [ ] iPhone Safari: sign up, play a question, reload the page mid-game. The player and score are kept.
- [ ] Round 2: the player stays signed in when Crowdpurr moves to the Round 2 experience.
- [ ] A second device with the same email restores the same player. Note what happens to the first device with multiple sign-ins off.
- [ ] The nickname is identical in chat and in Crowdpurr.
- [ ] Reserved nicknames are rejected, including by direct writes in the Rules Playground. A profile can't be edited after creation.
- [ ] No other player can read anyone's email.
- [ ] Before sign-up, chat is readable and the input shows "JOIN THE GAME TO CHAT →".
- [ ] Open and close the chat drawer during a live question. The game and video keep playing, with no reload.
- [ ] Focus the chat input on iPhone. The keyboard doesn't break the layout or squash the iframe, and the page doesn't zoom.
- [ ] The video's sound plays. Note whether players need to tap once to start audio.
- [ ] Next Round (I KNOW THAT! → Bow Wow) works inside the iframe.
- [ ] 10+ people chatting at once stays smooth, with no duplicate or missing messages.
- [ ] Host messages, pins, and alerts appear on every device within about 1 second.
- [ ] A new alert id shows for 8 seconds from when the device receives it. An alert already stored, with `sentAt` more than 60 seconds ago, does not show on first load.
- [ ] Desktop: Follow on WhatsApp opens the QR popover. Click outside or Esc closes it. The link inside opens the channel URL. Mobile: the drawer button opens the URL directly, with no QR.
- [ ] The reminder modal opens from the header on desktop and from the drawer header on mobile, and the iframe does not reload.
- [ ] A regular user can't fake a host message, hide messages, or post faster than every 2 seconds, even by editing requests in the browser. A host is also limited to one message every 2 seconds. Test this in the Firebase Rules Playground too.
- [ ] A signed-in user can read only `hosts/{their uid}`. The host screen shows "This account isn't set up as a host." when that document is missing.
- [ ] The host screen is readable from teleprompter distance.
- [ ] The opt-in form saves all four consents separately, with a timestamp.
- [ ] Rotate the phone between portrait and landscape. The iframe stays alive.

Deploy to Vercel so Ken can test it on his own phone. Deploy rules with `firebase deploy --only firestore:rules,firestore:indexes,database`.