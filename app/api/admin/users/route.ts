// app/api/admin/users/route.ts - customer directory for the operator console (admin-gated).
// Lists self-serve customers with plan, usage, billing status, and service opt-in.
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/admin";
import { COL } from "@/lib/collections";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const uid = await requireAdmin(req);
  if (!uid) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });

  const snap = await adminDb().collection(COL.users).limit(500).get();
  const users = snap.docs.map(d => {
    const u: any = d.data();
    return {
      id: d.id,
      email: u.email || null,
      displayName: u.displayName || null,
      plan: u.plan || "free",
      used: u.used || 0,
      periodKey: u.periodKey || "",
      serviceStatus: u.serviceStatus || "none",
      subStatus: u.subStatus || null,
      admin: u.admin === true,
      hasBrandKit: !!(u.brandKit && (u.brandKit.name || u.brandKit.voice || u.brandKit.benefits)),
      createdAt: u.createdAt || 0,
    };
  }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const paid = users.filter(u => u.plan && u.plan !== "free").length;
  return NextResponse.json({ ok: true, users, counts: { total: users.length, paid, service: users.filter(u => u.serviceStatus === "active").length } });
}
