// app/api/admin/overview/route.ts — back-office dashboard data: headline stats plus
// recent leads, clients, and global generation activity. Admin-gated.
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/admin";
import { COL } from "@/lib/collections";

export const runtime = "nodejs";

const byNewest = (a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0);

export async function GET(req: NextRequest) {
  try {
    const uid = await requireAdmin(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });

    const db = adminDb();
    const d30 = Date.now() - 30 * 86400000;

    const [usersC, leadsNewC, clientsC, gensTotalC, gens30dC] = await Promise.all([
      db.collection(COL.users).count().get(),
      db.collection(COL.leads).where("status", "==", "new").count().get(),
      db.collection(COL.clients).count().get(),
      db.collection(COL.generations).count().get(),
      db.collection(COL.generations).where("createdAt", ">=", d30).count().get(),
    ]);

    const [leadsSnap, clientsSnap, gensSnap] = await Promise.all([
      db.collection(COL.leads).limit(100).get(),
      db.collection(COL.clients).limit(100).get(),
      db.collection(COL.generations).limit(60).get(),
    ]);

    const leads = leadsSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).sort(byNewest).slice(0, 30);
    const clients = clientsSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).sort(byNewest);
    const generations = gensSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).sort(byNewest).slice(0, 15);
    const mrr = clients.reduce((s, c: any) => s + (c.status === "active" ? (c.mrrUsd || 0) : 0), 0);

    return NextResponse.json({
      ok: true,
      stats: {
        users: usersC.data().count,
        leadsNew: leadsNewC.data().count,
        clients: clientsC.data().count,
        gensTotal: gensTotalC.data().count,
        gens30d: gens30dC.data().count,
        mrr,
      },
      leads, clients, generations,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed to load." }, { status: 500 });
  }
}
