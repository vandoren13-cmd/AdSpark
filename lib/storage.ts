// lib/storage.ts - SERVER ONLY. Persists generated images to Firebase Storage and
// returns a stable, tokenized download URL (survives page refresh; powers history,
// the client portal, and the creative library). The token bypasses Storage rules,
// so storage.rules can stay deny-all for direct client access.
import { randomUUID } from "crypto";
import { adminStorage } from "./firebaseAdmin";

const BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  "";

// Uploads raw bytes and returns a tokenized Firebase download URL.
export async function uploadBuffer(path: string, buf: Buffer, contentType: string): Promise<string> {
  const bucket = adminStorage().bucket(BUCKET);
  const token = randomUUID();
  await bucket.file(path).save(buf, {
    contentType,
    resumable: false,
    metadata: { metadata: { firebaseStorageDownloadTokens: token } },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

// Accepts a data URL ("data:image/png;base64,...") or raw base64. Returns a download URL.
export async function uploadPng(path: string, dataUrlOrB64: string): Promise<string> {
  const b64 = dataUrlOrB64.includes(",") ? dataUrlOrB64.split(",")[1] : dataUrlOrB64;
  return uploadBuffer(path, Buffer.from(b64, "base64"), "image/png");
}

// Downloads a remote file (e.g. a provider's time-limited mp4 URL) and re-hosts it in
// Storage so it survives. Returns the new download URL (or the original on failure).
export async function rehostFromUrl(path: string, url: string, contentType: string): Promise<string> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) return url;
    const buf = Buffer.from(await res.arrayBuffer());
    return await uploadBuffer(path, buf, contentType);
  } catch { return url; }
}
