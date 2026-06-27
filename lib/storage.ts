// lib/storage.ts — SERVER ONLY. Persists generated images to Firebase Storage and
// returns a stable, tokenized download URL (survives page refresh; powers history,
// the client portal, and the creative library). The token bypasses Storage rules,
// so storage.rules can stay deny-all for direct client access.
import { randomUUID } from "crypto";
import { adminStorage } from "./firebaseAdmin";

const BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  "";

// Accepts a data URL ("data:image/png;base64,...") or raw base64. Returns a Firebase
// download URL for the uploaded PNG.
export async function uploadPng(path: string, dataUrlOrB64: string): Promise<string> {
  const b64 = dataUrlOrB64.includes(",") ? dataUrlOrB64.split(",")[1] : dataUrlOrB64;
  const buf = Buffer.from(b64, "base64");
  const bucket = adminStorage().bucket(BUCKET);
  const token = randomUUID();
  await bucket.file(path).save(buf, {
    contentType: "image/png",
    resumable: false,
    metadata: { metadata: { firebaseStorageDownloadTokens: token } },
  });
  const encoded = encodeURIComponent(path);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media&token=${token}`;
}
