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
