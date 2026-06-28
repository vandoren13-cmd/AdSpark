// app/api/service-request/route.ts — a self-serve user opts into the full suite (done-for-you).
// Self-serve stays the primary product; this flips a background switch (serviceStatus) and
// drops a lead into the operator console. The user observes status here + in /portal.
import { NextRequest, NextResponse } from "next/server";
import { uidFromRequest, adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/collections";
import { sendEmail } from "@/lib/email";
import { newLeadEmail, leadAckEmail } from "@/lib/emails";
import { logEvent } from "@/lib/events";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const uid = await uidFromRequest(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

    const db = adminDb();
    const userRef = db.collection(COL.users).doc(uid);
    const u: any = (await userRef.get()).data() || {};
    if (u.serviceStatus === "active") return NextResponse.json({ ok: true, status: "active" });

    let email: string | undefined = u.email || undefined;
    if (!email) { try { email = (await adminAuth().getUser(uid)).email || undefined; } catch { /* */ } }

    await userRef.set({ serviceStatus: "requested", email: email || null, updatedAt: Date.now() }, { merge: true });

    const b = await req.json().catch(() => ({}));
    const lead = {
      uid, name: "", email: email || "", company: "", website: "", monthlySpend: "", tier: "",
      message: String(b.message || "In-app request to switch on done-for-you (full suite)."),
      source: "in-app-upgrade", status: "new", createdAt: Date.now(),
    };
    await db.collection(COL.leads).add(lead);

    const admins = (process.env.ADMIN_EMAILS || "").split(",").map(s => s.trim()).filter(Boolean);
    const nl = newLeadEmail(lead);
    const ack = leadAckEmail(lead);
    await Promise.allSettled([
      admins.length ? sendEmail({ to: admins, subject: nl.subject, html: nl.html }) : Promise.resolve(),
      email ? sendEmail({ to: email, subject: ack.subject, html: ack.html }) : Promise.resolve(),
    ]);
    await logEvent("service_requested", { uid });

    return NextResponse.json({ ok: true, status: "requested" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed." }, { status: 500 });
  }
}
