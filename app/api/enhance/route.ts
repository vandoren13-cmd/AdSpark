// app/api/enhance/route.ts - upscale/enhance a generated image (Zeely "AI image enhancer").
import { NextRequest, NextResponse } from "next/server";
import { uidFromRequest } from "@/lib/firebaseAdmin";
import { enhanceReady, enhanceImage } from "@/lib/enhance";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const uid = await uidFromRequest(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });
    if (!enhanceReady()) return NextResponse.json({ ok: false, error: "Image enhancer isn't configured yet (add FAL_KEY)." }, { status: 503 });

    const rl = await rateLimit(`enhance:${uid}`, 20, 60);
    if (!rl.ok) return NextResponse.json({ ok: false, error: "Too many requests - give it a moment." }, { status: 429 });

    const { imageUrl } = await req.json().catch(() => ({}));
    if (!imageUrl) return NextResponse.json({ ok: false, error: "imageUrl required." }, { status: 400 });

    const url = await enhanceImage(String(imageUrl));
    if (!url) return NextResponse.json({ ok: false, error: "Couldn't enhance that image." }, { status: 502 });
    return NextResponse.json({ ok: true, url });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Enhance failed." }, { status: 500 });
  }
}
