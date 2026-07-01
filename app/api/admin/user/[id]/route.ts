// app/api/admin/user/[id]/route.ts - a single customer's full profile for the operator
// console: plan/usage, brand kit, service status, their generations, videos, support
// tickets, and any linked managed-client. Admin-gated.
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/admin";
import { planFor } from "@/lib/plans";
import { COL } from "@/lib/collections";

export const runtime = "nodejs";
const byNewest = (a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });

  const db = adminDb();
  const id = params.id;
  const snap = await db.collection(COL.users).doc(id).get();
  if (!snap.exists) return NextResponse.json({ ok: false, error: "Customer not found." }, { status: 404 });
  const u: any = snap.data();
  const plan = planFor(u.plan);

  const [gSnap, vSnap, tSnap, cSnap] = await Promise.all([
    db.collection(COL.generations).where("uid", "==", id).limit(50).get(),
    db.collection(COL.videos).where("uid", "==", id).limit(30).get(),
    db.collection(COL.support).where("uid", "==", id).limit(30).get(),
    db.collection(COL.clients).where("ownerUid", "==", id).limit(1).get(),
  ]);

  const generations = gSnap.docs.map(d => { const g: any = d.data(); return { id: d.id, product: g.brief?.product || "", platform: g.brief?.platform || "", images: g.images || [], imageCount: g.imageCount || 0, variations: g.variations?.length || 0, createdAt: g.createdAt || 0 }; }).sort(byNewest);
  const videos = vSnap.docs.map(d => { const v: any = d.data(); return { id: d.id, kind: v.kind, status: v.status, url: v.url || null, createdAt: v.createdAt || 0 }; }).sort(byNewest);
  const tickets = tSnap.docs.map(d => { const t: any = d.data(); return { id: d.id, subject: t.subject, status: t.status, createdAt: t.createdAt || 0 }; }).sort(byNewest);
  const client = cSnap.empty ? null : { id: cSnap.docs[0].id, ...(cSnap.docs[0].data() as any) };

  return NextResponse.json({
    ok: true,
    user: {
      id, email: u.email || null, displayName: u.displayName || null,
      plan: plan.name, planId: plan.id, quota: plan.quota, used: u.used || 0, periodKey: u.periodKey || "",
      videosUsed: u.videosUsed || 0, videoQuota: plan.videos,
      serviceStatus: u.serviceStatus || "none", subStatus: u.subStatus || null,
      stripeCustomerId: u.stripeCustomerId || null, admin: u.admin === true,
      brandKit: u.brandKit || null, createdAt: u.createdAt || 0,
    },
    generations, videos, tickets, client,
  });
}
