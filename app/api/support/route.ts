// app/api/support/route.ts - customer support tickets.
//   POST → open a ticket (saved to Firestore, notifies the support inbox).
//   GET  → the signed-in customer's own tickets (with agent replies + status).
// A customer-service agent works these in /admin (see /api/admin/support).
import { NextRequest, NextResponse } from "next/server";
import { uidFromRequest, adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/collections";
import { rateLimit } from "@/lib/ratelimit";
import { sendEmail } from "@/lib/email";
import { supportReceivedEmail } from "@/lib/emails";

export const runtime = "nodejs";

const supportInbox = () =>
  process.env.SUPPORT_EMAIL ||
  (process.env.ADMIN_EMAILS || "").split(",").map(s => s.trim()).filter(Boolean)[0] ||
  process.env.EMAIL_REPLY_TO ||
  "";

export async function GET(req: NextRequest) {
  const uid = await uidFromRequest(req);
  if (!uid) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });
  const gs = await adminDb().collection(COL.support).where("uid", "==", uid).limit(50).get();
  const tickets = gs.docs.map(d => ({ id: d.id, ...(d.data() as any) })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return NextResponse.json({ ok: true, tickets });
}

export async function POST(req: NextRequest) {
  try {
    const uid = await uidFromRequest(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

    const rl = await rateLimit(`support:${uid}`, 5, 3600);
    if (!rl.ok) return NextResponse.json({ ok: false, error: "You've sent a few requests already - we'll be in touch shortly." }, { status: 429 });

    const b = await req.json().catch(() => ({}));
    const subject = String(b.subject || "").slice(0, 160).trim();
    const message = String(b.message || "").slice(0, 4000).trim();
    if (!message) return NextResponse.json({ ok: false, error: "Please describe how we can help." }, { status: 400 });

    let email = String(b.email || "").slice(0, 200).trim();
    if (!email) { try { email = (await adminAuth().getUser(uid)).email || ""; } catch { /* */ } }

    const now = Date.now();
    const ref = await adminDb().collection(COL.support).add({
      uid, email, subject: subject || "(no subject)", message, status: "open", replies: [], createdAt: now, updatedAt: now,
    });

    // Notify the customer-service inbox (best-effort; no-ops until email configured).
    try {
      const to = supportInbox();
      if (to) { const m = supportReceivedEmail({ email, subject, message }); await sendEmail({ to, subject: m.subject, html: m.html, replyTo: email || undefined, idempotencyKey: `support:${ref.id}` }); }
    } catch { /* */ }

    return NextResponse.json({ ok: true, id: ref.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed to send." }, { status: 500 });
  }
}
