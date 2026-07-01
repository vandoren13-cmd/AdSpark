// app/api/admin/content/route.ts - manage customer-facing content. Admin-gated, so the
// content-management agent (or an operator) can create/update/publish/delete posts.
//   GET                                   → all content (incl. drafts)
//   POST { id?, type, title, body, ... }  → create (no id) or update (with id)
//   DELETE { id }                         → remove
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/admin";
import { COL } from "@/lib/collections";

export const runtime = "nodejs";

const TYPES = ["news", "guide", "usecase", "trend"];
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
const clip = (v: any, n: number) => String(v ?? "").slice(0, n);

export async function GET(req: NextRequest) {
  const uid = await requireAdmin(req);
  if (!uid) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
  const snap = await adminDb().collection(COL.content).limit(300).get();
  const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  try {
    const uid = await requireAdmin(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
    const b = await req.json().catch(() => ({}));
    const db = adminDb();
    const now = Date.now();

    const title = clip(b.title, 200).trim();
    if (!title) return NextResponse.json({ ok: false, error: "Title is required." }, { status: 400 });
    const type = TYPES.includes(b.type) ? b.type : "guide";

    const doc: any = {
      type, title,
      slug: clip(b.slug, 80).trim() || slugify(title),
      excerpt: clip(b.excerpt, 300),
      body: clip(b.body, 20000),
      category: clip(b.category, 80),
      coverEmoji: clip(b.coverEmoji, 8) || "📄",
      published: b.published !== false,
      featured: !!b.featured,
      order: Number.isFinite(b.order) ? Number(b.order) : 100,
      author: clip(b.author, 80) || "AdSpark Team",
      updatedAt: now,
    };

    if (b.id) {
      await db.collection(COL.content).doc(String(b.id)).set(doc, { merge: true });
      return NextResponse.json({ ok: true, id: String(b.id) });
    }
    const ref = await db.collection(COL.content).add({ ...doc, createdAt: now });
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const uid = await requireAdmin(req);
  if (!uid) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ ok: false, error: "id required." }, { status: 400 });
  await adminDb().collection(COL.content).doc(String(id)).delete();
  return NextResponse.json({ ok: true });
}
