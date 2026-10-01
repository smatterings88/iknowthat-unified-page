# I KNOW THAT! — Live Play Page Prototype (SPEC)

Prototype in Cursor. Once Ken approves it, move it to Lovable. Build it on Lovable's front-end stack, with **Firebase** as the backend, so the move is a copy, not a rewrite.

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
  - **Hosting:** preview link
- **No Next.js**, no server components, no Supabase
- **No Cloud Functions** in the prototype. All permissions come from Firestore Security Rules, so the project can stay on the free Spark plan.

Env vars:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_APP_ID=
VITE_CROWDPURR_URL=https://playiknowthat.com
VITE_WHATSAPP_CHANNEL_URL=
VITE_TERMS_URL=
VITE_PRIVACY_URL=
```

Put all Firebase setup in one file, `src/lib/firebase.ts`, and keep Firestore reads and writes in small hooks (`useChat`, `useAnnouncements`, `usePresence`). That keeps the backend easy to swap out later.

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

- Render the iframe **once**, at the root of the layout. It must **never unmount or reload** because of chat, drawer, alert, modal, QR popover, or resize state. Don't give it a changing `key`, don't render it conditionally, and don't move it to a different parent when the layout changes. Change the layout with CSS only.
- `allow="camera; microphone; autoplay; fullscreen"` plus `allowfullscreen`.
- Use `dvh` units (`h-[100dvh]`) so mobile browser bars don't cut it off.

## 5. Chat

**Identity (prototype):**
- Sign every visitor in with Firebase **anonymous auth** when the page loads, so each person has a `uid` without a visible login.
- The first time someone sends a message, ask for a display name (2–20 characters). Keep it in localStorage until that send. The Firestore `users/{uid}` write happens only in the same batched write as the message, not before.

**Behavior:**
- Use a Firestore `onSnapshot` listener on `rooms/ikt/messages`, filtered to `hidden == false`, ordered by `createdAt`, limited to the last 100 messages.
- Auto-scroll to the newest message, unless the user has scrolled up. In that case, show a "New messages ↓" button.
- Count unread messages while the mobile drawer is closed.
- Limit each person to one message every 2 seconds, including hosts. Host messages use the same batched write. Enforce it in the Security Rules (see section 8), not just in the app. The 280-character maximum is also enforced in the rules.
- Use `serverTimestamp()` for `createdAt`. Never trust the device clock.
- Hidden messages (moderation) disappear for everyone.

**Host messages:**
- They show a pink **HOST** badge, a rainbow left border, and a slightly larger font.
- Only a signed-in account with a `hosts/{uid}` document can create a message with `isHost: true`. The Security Rules enforce this, so a regular player can't fake a host message even by editing requests in the browser.

**Pinned announcement:** One active pinned announcement sits at the top of the chat panel and the mobile drawer, styled as a rainbow gradient bar.

**Alert banner:** When the host sends an alert, a pink banner appears over the page for 8 seconds, or until it's dismissed. Each alert has an `id`. A device starts the 8 seconds when it receives a new alert id. It does not time the banner from `sentAt`. On the first load, ignore an alert already on `rooms/ikt` if `sentAt` is more than 60 seconds old by the local clock.

## 6. Host screen (`/host`)

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

## 7. WhatsApp and reminder sign-up

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

Save the response to the `optIns` collection in Firestore, with a server timestamp for each consent. Map the four checkboxes to `consentTerms`, `consentMarketingEmail`, `consentSmsService`, and `consentSmsMarketing`.

## 8. Database (Firebase)

### Firestore structure

```
hosts/{uid}                       { } or { name }

users/{uid}                       { displayName, lastMessageAt }

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

Each message is sent in a **batched write** that does two things at once: it creates the message, and it writes `users/{uid}` (merge) with the current `displayName` and `lastMessageAt: serverTimestamp()`. The rules reject the batch if the last message was less than 2 seconds ago. Hosts use this same batch and the same 2-second limit. The message `displayName` must match the `displayName` written on `users/{uid}` in that batch. The display name stays in localStorage until that first send.

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

    match /users/{uid} {
      allow read: if signedIn() && request.auth.uid == uid;
      allow create, update: if signedIn() && request.auth.uid == uid
        && request.resource.data.displayName is string
        && request.resource.data.displayName.size() >= 2
        && request.resource.data.displayName.size() <= 20
        && request.resource.data.lastMessageAt == request.time
        && (resource == null
            || !('lastMessageAt' in resource.data)
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
          && request.resource.data.displayName == getAfter(/databases/$(db)/documents/users/$(request.auth.uid)).data.displayName
          && request.resource.data.body is string
          && request.resource.data.body.size() >= 1
          && request.resource.data.body.size() <= 280
          && request.resource.data.hidden == false
          && request.resource.data.createdAt == request.time
          && (request.resource.data.isHost == false || isHost())
          && getAfter(/databases/$(db)/documents/users/$(request.auth.uid))
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

## 9. Design system (taken from the live I KNOW THAT! landing page)

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

## 10. Out of scope for the prototype

These are not part of this build:
- Crowdpurr stats or game data (Crowdpurr has no API)
- Any WhatsApp bridge or embedded WhatsApp group
- Login and accounts, prizes, payments, Shopify
- Text messages sent from GoHighLevel (collect consent only)

## 11. Test checklist (real phones, especially iPhone Safari)

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

Deploy a preview link with Firebase Hosting (`firebase hosting:channel:deploy preview`) so Ken can test it on his own phone.
