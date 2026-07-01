// app/api/creations/route.ts - the signed-in user's saved work (the "My Creations"
// library): GET returns their generations (copy + images) and videos; DELETE removes one.
import { NextRequest, NextResponse } from "next/server";
import { uidFromRequest, adminDb } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/collections";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const uid = await uidFromRequest(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });
    const db = adminDb();

    const [gSnap, vSnap] = await Promise.all([
      db.collection(COL.generations).where("uid", "==", uid).limit(200).get(),
      db.collection(COL.videos).where("uid", "==", uid).limit(100).get(),
    ]);

    const generations = gSnap.docs.map(d => {
      const g: any = d.data();
      return { id: d.id, brief: g.brief, variations: g.variations || [], creativeBrief: g.creativeBrief || "", images: g.images || [], imageCount: g.imageCount || 0, tags: g.tags || null, createdAt: g.createdAt || 0 };
    }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const videos = vSnap.docs.map(d => {
      const v: any = d.data();
      return { id: d.id, kind: v.kind, status: v.status, url: v.url || null, brief: v.brief || null, createdAt: v.createdAt || 0 };
    }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return NextResponse.json({ ok: true, generations, videos });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const uid = await uidFromRequest(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });
    const { type, id } = await req.json().catch(() => ({}));
    if (!id || (type !== "generation" && type !== "video")) return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });

    const col = type === "video" ? COL.videos : COL.generations;
    const ref = adminDb().collection(col).doc(String(id));
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
    if ((snap.data() as any).uid !== uid) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
    await ref.delete();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed." }, { status: 500 });
  }
}
