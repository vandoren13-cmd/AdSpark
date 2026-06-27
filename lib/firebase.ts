// lib/firebase.ts — client Firebase (Auth + Firestore). Browser-safe (NEXT_PUBLIC_*).
// Init is guarded so a missing/empty config never throws at module load — otherwise
// static prerendering (which evaluates this module via AuthProvider) crashes the whole
// build before the NEXT_PUBLIC_* env vars are set in the host. When configured, it
// initializes normally; when not, `auth`/`dbc` are undefined and AuthProvider fails soft.
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _dbc: Firestore | undefined;
if (cfg.apiKey) {
  try {
    _app = getApps().length ? getApp() : initializeApp(cfg);
    _auth = getAuth(_app);
    _dbc = getFirestore(_app);
  } catch { /* misconfigured — leave undefined; AuthProvider handles it gracefully */ }
}

export const auth = _auth as Auth;
export const dbc = _dbc as Firestore;
export const googleProvider = new GoogleAuthProvider();
