import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { firebaseAuth } from "../firebase";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  return (
    ctx ?? { user: null, loading: true, authAvailable: false, dataRoot: null }
  );
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const authAvailable = firebaseAuth != null;

  // Root key for this user's data in Realtime DB (phone number or uid). Use for all paths: dataRoot/expenses, dataRoot/dues, etc.
  const dataRoot =
    user == null
      ? null
      : (user.phoneNumber || "").replace(/\s/g, "") || user.uid;

  useEffect(() => {
    if (!firebaseAuth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithPhone = async (phoneNumber, recaptchaVerifier) => {
    if (!firebaseAuth) throw new Error("Firebase Auth not configured");
    return signInWithPhoneNumber(firebaseAuth, phoneNumber, recaptchaVerifier);
  };

  const signOut = async () => {
    if (!firebaseAuth) return;
    await firebaseSignOut(firebaseAuth);
  };

  const value = {
    user,
    loading,
    authAvailable,
    dataRoot,
    signInWithPhone,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
