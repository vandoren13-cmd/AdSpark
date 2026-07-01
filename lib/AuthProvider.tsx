"use client";
// lib/AuthProvider.tsx - customer auth context (Firebase Auth: email + Google).
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, signOut, sendPasswordResetEmail, updatePassword, updateProfile,
  reauthenticateWithCredential, EmailAuthProvider,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pw: string) => Promise<void>;
  signUp: (email: string, pw: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPw: string, newPw: string) => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null as any);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // auth may be unconfigured during first setup - fail soft.
    try {
      return onAuthStateChanged(auth, u => { setUser(u); setLoading(false); }, () => setLoading(false));
    } catch { setLoading(false); }
  }, []);

  const value: AuthCtx = {
    user, loading,
    signIn: async (e, p) => { await signInWithEmailAndPassword(auth, e, p); },
    signUp: async (e, p) => { await createUserWithEmailAndPassword(auth, e, p); },
    signInGoogle: async () => { await signInWithPopup(auth, googleProvider); },
    logout: async () => { await signOut(auth); },
    getToken: async () => (auth.currentUser ? auth.currentUser.getIdToken() : null),
    resetPassword: async (e) => { await sendPasswordResetEmail(auth, e); },
    changePassword: async (currentPw, newPw) => {
      const u = auth.currentUser;
      if (!u || !u.email) throw new Error("You must be signed in with an email account.");
      // Re-authenticate first (Firebase requires a recent login to change a password).
      await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, currentPw));
      await updatePassword(u, newPw);
    },
    setDisplayName: async (name) => {
      const u = auth.currentUser;
      if (!u) throw new Error("Not signed in.");
      await updateProfile(u, { displayName: name });
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
