// lib/admin.ts — SERVER ONLY. Gate operator (back-office) endpoints.
// An authed user is an admin if their user doc has `admin: true`, OR their email is
// in the ADMIN_EMAILS allowlist (comma-separated env). Returns the uid or null.
import type { NextRequest } from "next/server";
import { uidFromRequest, adminAuth, adminDb } from "./firebaseAdmin";
import { COL } from "./collections";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

export async function requireAdmin(req: NextRequest): Promise<string | null> {
  const uid = await uidFromRequest(req);
  if (!uid) return null;

  try {
    const u: any = (await adminDb().collection(COL.users).doc(uid).get()).data() || {};
    if (u.admin === true) return uid;
  } catch { /* */ }

  if (ADMIN_EMAILS.length) {
    try {
      const email = (await adminAuth().getUser(uid)).email?.toLowerCase();
      if (email && ADMIN_EMAILS.includes(email)) return uid;
    } catch { /* */ }
  }

  return null;
}
