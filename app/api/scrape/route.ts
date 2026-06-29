// app/api/scrape/route.ts - paste a product URL → auto-filled ad brief (Zeely-style).
import { NextRequest, NextResponse } from "next/server";
import { uidFromRequest } from "@/lib/firebaseAdmin";
import { scrapeProduct, briefFromScrape } from "@/lib/scrape";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const uid = await uidFromRequest(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

    const rl = await rateLimit(`scrape:${uid}`, 15, 60);
    if (!rl.ok) return NextResponse.json({ ok: false, error: "Too many requests - give it a moment." }, { status: 429 });

    const { url } = await req.json().catch(() => ({}));
    if (!url) return NextResponse.json({ ok: false, error: "URL required." }, { status: 400 });

    const scraped = await scrapeProduct(String(url));
    const brief = await briefFromScrape(scraped);
    return NextResponse.json({ ok: true, brief, image: scraped.image });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Couldn't import that URL." }, { status: 500 });
  }
}
