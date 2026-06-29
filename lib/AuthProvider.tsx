"use client";
// lib/AuthProvider.tsx - customer auth context (Firebase Auth: email + Google).
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, signOut,
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
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
