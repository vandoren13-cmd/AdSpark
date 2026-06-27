// lib/events.ts — SERVER ONLY. First-party funnel analytics (no third-party connector).
// Best-effort: never throws, so logging never breaks a request.
import { adminDb } from "./firebaseAdmin";
import { COL } from "./collections";

export async function logEvent(name: string, data?: { uid?: string | null; props?: any; source?: string }) {
  try {
    await adminDb().collection(COL.events).add({
      name: String(name).slice(0, 60),
      uid: data?.uid || null,
      props: data?.props || {},
      source: data?.source || "server",
      createdAt: Date.now(),
    });
  } catch { /* analytics must never break the request */ }
}
