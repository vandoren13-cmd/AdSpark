// app/api/video/[id]/route.ts — poll a video job. On completion, re-hosts the provider's
// time-limited mp4 into Firebase Storage so the ad survives, then marks the doc ready.
import { NextRequest, NextResponse } from "next/server";
import { uidFromRequest, adminDb } from "@/lib/firebaseAdmin";
import { pollVideo } from "@/lib/video";
import { rehostFromUrl } from "@/lib/storage";
import { COL } from "@/lib/collections";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const uid = await uidFromRequest(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

    const ref = adminDb().collection(COL.videos).doc(params.id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
    const v: any = snap.data();
    if (v.uid !== uid) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });

    if (v.status === "ready" || v.status === "failed") {
      return NextResponse.json({ ok: true, status: v.status, url: v.url, error: v.error });
    }

    const r = await pollVideo(v.provider, v.jobId);
    if (r.status === "ready" && r.url) {
      const persisted = await rehostFromUrl(`videos/${uid}/${params.id}.mp4`, r.url, "video/mp4");
      await ref.set({ status: "ready", url: persisted, updatedAt: Date.now() }, { merge: true });
      return NextResponse.json({ ok: true, status: "ready", url: persisted });
    }
    if (r.status === "failed") {
      await ref.set({ status: "failed", error: "Generation failed.", updatedAt: Date.now() }, { merge: true });
      return NextResponse.json({ ok: true, status: "failed", error: "Generation failed." });
    }
    return NextResponse.json({ ok: true, status: "processing" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed." }, { status: 500 });
  }
}
