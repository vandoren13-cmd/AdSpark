// lib/firebaseAdmin.ts — SERVER ONLY. Verifies user ID tokens + reads/writes the
// user's plan, quota, and generation history. Uses a service account from env.
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app: App;
function admin(): App {
  if (getApps().length) return getApps()[0];
  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // env stores the key with literal \n — restore real newlines.
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
  return app;
}

export const adminAuth = () => getAuth(admin());
export const adminDb = () => getFirestore(admin());

// Verify a Firebase ID token from the Authorization: Bearer header → uid (or null).
export async function uidFromRequest(req: Request): Promise<string | null> {
  const h = req.headers.get("authorization") || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) return null;
  try { return (await adminAuth().verifyIdToken(token)).uid; }
  catch { return null; }
}
