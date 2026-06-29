// app/api/event/route.ts - PUBLIC client analytics ingest (page views, CTA clicks).
// Rate-limited per IP; attaches uid when a token is present. Best-effort.
import { NextRequest, NextResponse } from "next/server";
import { uidFromRequest } from "@/lib/firebaseAdmin";
import { logEvent } from "@/lib/events";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const rl = await rateLimit(`event:${clientIp(req)}`, 120, 60);
    if (!rl.ok) return NextResponse.json({ ok: true }); // silently drop excess, never error the client

    const b = await req.json().catch(() => ({}));
    const name = String(b.name || "").slice(0, 60);
    if (!name) return NextResponse.json({ ok: false }, { status: 400 });
    const uid = await uidFromRequest(req);
    await logEvent(name, { uid, props: b.props || {}, source: "client" });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
