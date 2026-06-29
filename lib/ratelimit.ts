// lib/ratelimit.ts - SERVER ONLY. Firestore-backed fixed-window rate limiter. Works across
// serverless instances (no Redis/dep). Fails OPEN on limiter error so a Firestore hiccup
// never blocks legitimate traffic. Counter docs carry `exp` for optional Firestore TTL cleanup.
import { adminDb } from "./firebaseAdmin";
import { COL } from "./collections";

export async function rateLimit(key: string, limit: number, windowSec: number): Promise<{ ok: boolean; remaining: number }> {
  try {
    const db = adminDb();
    const windowId = Math.floor(Date.now() / (windowSec * 1000));
    const ref = db.collection(COL.ratelimits).doc(`${key}:${windowId}`);
    const count = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const next = ((snap.exists ? (snap.data() as any).count : 0) || 0) + 1;
      tx.set(ref, { count: next, exp: (windowId + 1) * windowSec * 1000 }, { merge: true });
      return next;
    });
    return { ok: count <= limit, remaining: Math.max(0, limit - count) };
  } catch {
    return { ok: true, remaining: limit };
  }
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}
