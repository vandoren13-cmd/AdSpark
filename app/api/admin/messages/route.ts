// app/api/admin/messages/route.ts - operator side of the managed-client message threads.
//   GET                      → recent messages across all clients (newest first)
//   POST { clientId, text }  → operator reply into a client's thread
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/admin";
import { COL } from "@/lib/collections";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const uid = await requireAdmin(req);
  if (!uid) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
  const snap = await adminDb().collection(COL.messages).limit(300).get();
  const messages = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return NextResponse.json({ ok: true, messages });
}

export async function POST(req: NextRequest) {
  try {
    const uid = await requireAdmin(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
    const { clientId, text } = await req.json().catch(() => ({}));
    if (!clientId || !String(text || "").trim()) return NextResponse.json({ ok: false, error: "clientId and text required." }, { status: 400 });
    await adminDb().collection(COL.messages).add({ clientId: String(clientId), from: "operator", uid, text: String(text).slice(0, 2000).trim(), readByOperator: true, readByClient: false, createdAt: Date.now() });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed." }, { status: 500 });
  }
}
