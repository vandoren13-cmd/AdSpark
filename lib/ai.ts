// lib/ai.ts — SERVER ONLY. The AdSpark generation engine.
//   • Ad COPY  → Claude (claude-opus-4-8) — superior creative/direct-response writing.
//   • Ad IMAGES → OpenAI gpt-image-1 — returns base64 PNGs.
import Anthropic from "@anthropic-ai/sdk";

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
export interface AdSet {
  variations: AdVariation[];
  creativeBrief: string;
  imagePrompt: string;
  images: string[]; // data URLs (data:image/png;base64,...)
}

function parseJSON<T>(raw: string, fallback: T): T {
  try { return JSON.parse(raw.replace(/```json|```/g, "").trim()) as T; }
  catch { const m = raw.match(/\{[\s\S]*\}/); if (m) { try { return JSON.parse(m[0]) as T; } catch { /* */ } } return fallback; }
}

// ── Ad copy (Claude) ─────────────────────────────────────────────────────────
export async function generateAdCopy(brief: AdBrief, variants: number): Promise<{ variations: AdVariation[]; creativeBrief: string; imagePrompt: string }> {
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
  "imagePrompt": "a vivid, specific prompt for an eye-catching, on-brand AD IMAGE for ${brief.platform} — clean, high-contrast, scroll-stopping; NO real logos/trademarks, NO watermark"
}`,
    }],
  });
  const text = msg.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
  const j = parseJSON<{ variations: AdVariation[]; creativeBrief: string; imagePrompt: string }>(text, { variations: [], creativeBrief: "", imagePrompt: "" });
  // normalize
  j.variations = (Array.isArray(j.variations) ? j.variations : []).slice(0, variants).map(v => ({
    headline: String(v?.headline || ""), primaryText: String(v?.primaryText || ""),
    caption: String(v?.caption || ""), hashtags: Array.isArray(v?.hashtags) ? v.hashtags.map(String) : [],
    cta: String(v?.cta || ""),
  }));
  j.creativeBrief = String(j.creativeBrief || "");
  j.imagePrompt = String(j.imagePrompt || `${brief.product} ad for ${brief.platform}, ${brief.tone}, clean high-contrast`);
  return j;
}

// ── Ad images (OpenAI gpt-image-1) ───────────────────────────────────────────
export async function generateAdImages(prompt: string, n: number): Promise<string[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return [];
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    try {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-image-1", prompt, n: 1, size: "1024x1024", quality: "medium", output_format: "png" }),
      });
      if (!res.ok) {
        const raw = await res.text(); let m = raw;
        try { m = JSON.parse(raw)?.error?.message || raw; } catch { /* */ }
        throw new Error(/billing hard limit/i.test(m) ? "Image generation paused (billing limit)." : `Image error: ${String(m).slice(0, 120)}`);
      }
      const b64 = (await res.json())?.data?.[0]?.b64_json;
      if (b64) out.push(`data:image/png;base64,${b64}`);
    } catch (e) { if (i === 0) throw e; /* partial set OK after the first */ }
  }
  return out;
}

export async function generateAdSet(brief: AdBrief, variants: number, images: number): Promise<AdSet> {
  const copy = await generateAdCopy(brief, variants);
  const imgs = images > 0 ? await generateAdImages(copy.imagePrompt, images) : [];
  return { ...copy, images: imgs };
}
