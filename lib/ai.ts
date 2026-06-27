// lib/ai.ts — SERVER ONLY. The AdSpark generation engine.
//   • Ad COPY  → Claude (claude-opus-4-8) — superior creative/direct-response writing.
//   • Ad IMAGES → a pluggable model-router (default: OpenAI gpt-image-1) — returns base64 PNGs.
import Anthropic from "@anthropic-ai/sdk";
import type { ImageQuality } from "@/lib/plans";

export interface AdBrief {
  brand: string;
  product: string;
  goal: string;        // e.g. "drive signups", "sell the product", "build awareness"
  platform: string;    // Instagram | Facebook | TikTok | LinkedIn | Google | X | Pinterest
  tone: string;        // e.g. "bold & punchy", "premium", "friendly"
  audience: string;    // target audience
}
export interface AdVariation {
  headline: string;
  primaryText: string;
  caption: string;
  hashtags: string[];
  cta: string;
}
// The moat: every generation is auto-tagged so results can be attributed to what
// actually converts (by vertical / hook / format / offer). Produced in the same
// Claude call as the copy — zero extra cost or latency.
export interface AdTags {
  vertical: string;  // niche, e.g. "skincare", "b2b saas", "home services"
  hook: string;      // dominant angle, e.g. "problem-solution", "social-proof", "urgency"
  format: string;    // creative format, e.g. "ugc", "product-shot", "lifestyle", "testimonial"
  offer: string;     // offer type, e.g. "discount", "free-trial", "bundle", "lead-magnet"
}
export interface AdSet {
  variations: AdVariation[];
  creativeBrief: string;
  imagePrompt: string;
  tags: AdTags;
  images: string[]; // data URLs (data:image/png;base64,...)
}

function parseJSON<T>(raw: string, fallback: T): T {
  try { return JSON.parse(raw.replace(/```json|```/g, "").trim()) as T; }
  catch { const m = raw.match(/\{[\s\S]*\}/); if (m) { try { return JSON.parse(m[0]) as T; } catch { /* */ } } return fallback; }
}

// ── Ad copy (Claude) ─────────────────────────────────────────────────────────
export async function generateAdCopy(brief: AdBrief, variants: number): Promise<{ variations: AdVariation[]; creativeBrief: string; imagePrompt: string; tags: AdTags }> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2600,
    system: "You are an elite direct-response advertising copywriter and creative director. You write scroll-stopping, platform-native ad copy that converts — specific, benefit-led, no fluff, no clichés. Respond ONLY with valid JSON, no markdown.",
    messages: [{
      role: "user",
      content: `Create ad creative for this campaign.

Brand: ${brief.brand}
Product/offer: ${brief.product}
Goal: ${brief.goal}
Platform: ${brief.platform}
Tone: ${brief.tone}
Target audience: ${brief.audience}

Return JSON exactly:
{
  "variations": [ ${variants} distinct, ready-to-publish ad variations, each:
    { "headline": "punchy hook (platform-appropriate length)",
      "primaryText": "the main ad body — persuasive, benefit-led, native to ${brief.platform}",
      "caption": "a ready-to-paste social caption with a hook + value + soft CTA",
      "hashtags": ["6-10 relevant, buyer-intent hashtags for ${brief.platform}"],
      "cta": "the call to action" } ],
  "creativeBrief": "a short creative brief for the design/visual direction (1-2 sentences)",
  "imagePrompt": "a vivid, specific prompt for an eye-catching, on-brand AD IMAGE for ${brief.platform} — clean, high-contrast, scroll-stopping; NO real logos/trademarks, NO watermark",
  "tags": {
    "vertical": "the business vertical/niche in 1-3 words (e.g. skincare, b2b saas, home services)",
    "hook": "the single dominant hook angle (one of: problem-solution, social-proof, urgency, curiosity, benefit, fear-of-missing-out, authority)",
    "format": "the creative format (one of: ugc, product-shot, lifestyle, testimonial, founder-story, comparison, meme)",
    "offer": "the core offer type (one of: discount, free-trial, bundle, new-arrival, lead-magnet, consultation, none)"
  }
}`,
    }],
  });
  const text = msg.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
  const j = parseJSON<{ variations: AdVariation[]; creativeBrief: string; imagePrompt: string; tags: AdTags }>(text, { variations: [], creativeBrief: "", imagePrompt: "", tags: { vertical: "", hook: "", format: "", offer: "" } });
  // normalize
  j.variations = (Array.isArray(j.variations) ? j.variations : []).slice(0, variants).map(v => ({
    headline: String(v?.headline || ""), primaryText: String(v?.primaryText || ""),
    caption: String(v?.caption || ""), hashtags: Array.isArray(v?.hashtags) ? v.hashtags.map(String) : [],
    cta: String(v?.cta || ""),
  }));
  j.creativeBrief = String(j.creativeBrief || "");
  j.imagePrompt = String(j.imagePrompt || `${brief.product} ad for ${brief.platform}, ${brief.tone}, clean high-contrast`);
  const t: any = j.tags || {};
  j.tags = { vertical: String(t.vertical || "").toLowerCase().slice(0, 40), hook: String(t.hook || "").toLowerCase().slice(0, 40), format: String(t.format || "").toLowerCase().slice(0, 40), offer: String(t.offer || "").toLowerCase().slice(0, 40) };
  return j;
}

// ── Ad images — model-router ──────────────────────────────────────────────────
// Don't hard-wire one vendor: gpt-image-1 sunsets 2026-10-23. An engine produces a
// single image (data URL) or null; register new vendors (FLUX/Ideogram/Bria) below and
// select via the IMAGE_ENGINE env var. Swapping engines is then config, not a rewrite.
interface ImageEngine {
  id: string;
  generate(prompt: string, quality: ImageQuality): Promise<string | null>;
}

const openaiGptImage: ImageEngine = {
  id: "openai-gpt-image-1",
  async generate(prompt, quality) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return null;
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-image-1", prompt, n: 1, size: "1024x1024", quality, output_format: "png" }),
    });
    if (!res.ok) {
      const raw = await res.text(); let m = raw;
      try { m = JSON.parse(raw)?.error?.message || raw; } catch { /* */ }
      throw new Error(/billing hard limit/i.test(m) ? "Image generation paused (billing limit)." : `Image error: ${String(m).slice(0, 120)}`);
    }
    const b64 = (await res.json())?.data?.[0]?.b64_json;
    return b64 ? `data:image/png;base64,${b64}` : null;
  },
};

// Register additional engines here, then point IMAGE_ENGINE at one (e.g. "flux").
const ENGINES: Record<string, ImageEngine> = {
  "openai-gpt-image-1": openaiGptImage,
};

function imageEngine(): ImageEngine {
  return ENGINES[process.env.IMAGE_ENGINE || "openai-gpt-image-1"] || openaiGptImage;
}

export async function generateAdImages(prompt: string, n: number, quality: ImageQuality = "medium"): Promise<string[]> {
  const engine = imageEngine();
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    try {
      const url = await engine.generate(prompt, quality);
      if (url) out.push(url);
    } catch (e) { if (i === 0) throw e; /* partial set OK after the first */ }
  }
  return out;
}

export async function generateAdSet(brief: AdBrief, variants: number, images: number, quality: ImageQuality = "medium"): Promise<AdSet> {
  const copy = await generateAdCopy(brief, variants);
  const imgs = images > 0 ? await generateAdImages(copy.imagePrompt, images, quality) : [];
  return { ...copy, images: imgs };
}
