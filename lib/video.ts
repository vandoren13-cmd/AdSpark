// lib/video.ts — SERVER ONLY. Pluggable video model-router (avatar + cinematic), async
// job → poll, env-gated (no-op until keys set). Mirrors the image router in lib/ai.ts.
//   • avatar / UGC / talking-head → HeyGen
//   • product / cinematic (text→video, image→video) → fal.ai (Veo / Kling / Seedance)

export interface VideoCreateOpts {
  script?: string;                 // avatar: the spoken text
  avatarId?: string; voiceId?: string;
  prompt?: string;                 // cinematic: text→video
  imageUrl?: string;               // cinematic: image→video
  model?: string;
  duration?: string;               // e.g. "8s"
  aspectRatio?: string;            // "16:9" | "9:16"
  width?: number; height?: number; // avatar dimension
}
export type VideoStatus = "processing" | "ready" | "failed";
export interface VideoEngine {
  id: string;
  ready(): boolean;
  create(opts: VideoCreateOpts): Promise<{ jobId: string } | null>;
  poll(jobId: string): Promise<{ status: VideoStatus; url?: string }>;
}

// ── HeyGen (avatar / talking-head / UGC) ──────────────────────────────────────
const heygen: VideoEngine = {
  id: "heygen",
  ready: () => !!process.env.HEYGEN_API_KEY,
  async create(opts) {
    const key = process.env.HEYGEN_API_KEY;
    if (!key) return null;
    const res = await fetch("https://api.heygen.com/v2/video/generate", {
      method: "POST",
      headers: { "X-Api-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        video_inputs: [{
          character: { type: "avatar", avatar_id: opts.avatarId || process.env.HEYGEN_AVATAR_ID, avatar_style: "normal" },
          voice: { type: "text", input_text: opts.script || "", voice_id: opts.voiceId || process.env.HEYGEN_VOICE_ID },
        }],
        dimension: { width: opts.width || 1280, height: opts.height || 720 },
      }),
    });
    if (!res.ok) throw new Error(`HeyGen create ${res.status}: ${(await res.text()).slice(0, 160)}`);
    const j = await res.json();
    const id = j?.data?.video_id;
    if (!id) throw new Error(`HeyGen: no video_id (${JSON.stringify(j?.error)})`);
    return { jobId: id };
  },
  async poll(jobId) {
    const key = process.env.HEYGEN_API_KEY!;
    const res = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${encodeURIComponent(jobId)}`, { headers: { "X-Api-Key": key } });
    if (!res.ok) throw new Error(`HeyGen status ${res.status}`);
    const d = (await res.json())?.data ?? {};
    if (d.status === "completed") return { status: "ready", url: d.video_url };
    if (d.status === "failed") return { status: "failed" };
    return { status: "processing" };
  },
};

// ── fal.ai (product / cinematic — Veo / Kling / Seedance behind one queue API) ─
const fal: VideoEngine = {
  id: "fal",
  ready: () => !!process.env.FAL_KEY,
  async create(opts) {
    const key = process.env.FAL_KEY;
    if (!key) return null;
    const model = opts.model || process.env.VIDEO_MODEL || "fal-ai/veo3/fast";
    const body: Record<string, unknown> = { prompt: opts.prompt, aspect_ratio: opts.aspectRatio || "16:9", duration: opts.duration || "8s" };
    if (opts.imageUrl) body.image_url = opts.imageUrl;
    const res = await fetch(`https://queue.fal.run/${model}`, {
      method: "POST",
      headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`fal submit ${res.status}: ${(await res.text()).slice(0, 160)}`);
    const j = await res.json();
    // fal's poll URL needs the model slug — pack it into the jobId to fit poll(jobId).
    return { jobId: `${model}::${j.request_id}` };
  },
  async poll(jobId) {
    const key = process.env.FAL_KEY!;
    const [model, requestId] = jobId.split("::");
    const base = `https://queue.fal.run/${model}/requests/${requestId}`;
    const s = await fetch(`${base}/status`, { headers: { Authorization: `Key ${key}` } });
    if (!s.ok) throw new Error(`fal status ${s.status}`);
    const status = (await s.json())?.status;
    if (status !== "COMPLETED") return { status: status === "IN_QUEUE" || status === "IN_PROGRESS" ? "processing" : "failed" };
    const r = await fetch(base, { headers: { Authorization: `Key ${key}` } });
    if (!r.ok) throw new Error(`fal result ${r.status}`);
    const url = (await r.json())?.video?.url;
    return url ? { status: "ready", url } : { status: "failed" };
  },
};

const ENGINES: Record<string, VideoEngine> = { heygen, fal };

export type VideoKind = "avatar" | "product";
const providerFor = (kind: VideoKind) => (kind === "avatar" ? "heygen" : "fal");

export const videoReady = (kind: VideoKind) => ENGINES[providerFor(kind)].ready();
export const anyVideoReady = () => Object.values(ENGINES).some(e => e.ready());

export async function createVideo(kind: VideoKind, opts: VideoCreateOpts): Promise<{ provider: string; jobId: string } | null> {
  const provider = providerFor(kind);
  const engine = ENGINES[provider];
  if (!engine.ready()) return null;
  const r = await engine.create(opts);
  return r ? { provider, jobId: r.jobId } : null;
}

export async function pollVideo(provider: string, jobId: string): Promise<{ status: VideoStatus; url?: string }> {
  const engine = ENGINES[provider];
  if (!engine) return { status: "failed" };
  return engine.poll(jobId);
}
