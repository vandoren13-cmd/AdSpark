// app/api/content/route.ts - customer-facing read of published content (guides, news,
// use cases, trends) for the Dashboard + /resources hub. Signed-in customers only.
import { NextRequest, NextResponse } from "next/server";
import { uidFromRequest, adminDb } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/collections";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const uid = await uidFromRequest(req);
  if (!uid) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const slug = url.searchParams.get("slug");
  const limit = Math.min(100, Number(url.searchParams.get("limit")) || 100);

  const snap = await adminDb().collection(COL.content).where("published", "==", true).limit(200).get();
  let items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

  if (slug) {
    const one = items.find(i => i.slug === slug);
    return NextResponse.json({ ok: true, item: one || null });
  }
  if (type) items = items.filter(i => i.type === type);

  items.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || (b.createdAt || 0) - (a.createdAt || 0));
  // Strip heavy body from list payloads (fetch full via ?slug=).
  const list = items.slice(0, limit).map(({ body, ...rest }) => ({ ...rest, hasBody: !!body }));
  return NextResponse.json({ ok: true, items: list });
}
