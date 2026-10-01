/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_DATABASE_URL: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_CROWDPURR_URL: string;
  readonly VITE_WHATSAPP_CHANNEL_URL: string;
  readonly VITE_TERMS_URL: string;
  readonly VITE_PRIVACY_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
