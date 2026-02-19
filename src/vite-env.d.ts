/// <reference types="vite/client" />

declare module "*.jsx" {
  import type { ComponentType } from "react";
  const component: ComponentType;
  export default component;
}

declare module "./context/AuthContext" {
  import type { ComponentType } from "react";
  export const AuthProvider: ComponentType<{ children: React.ReactNode }>;
  export function useAuth(): {
    user: unknown;
    loading: boolean;
    authAvailable: boolean;
    dataRoot: string | null;
    signInWithPhone: (phone: string, verifier: unknown) => Promise<unknown>;
    signOut: () => Promise<void>;
  };
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  // TODO: Add Firebase credentials in .env (see .env.example)
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_DATABASE_URL: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
