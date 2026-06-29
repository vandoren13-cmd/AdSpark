// lib/enhance.ts - SERVER ONLY. AI image upscaler/enhancer via fal.ai (synchronous run).
// Env-gated; reuses FAL_KEY. Tolerant of result-shape variants across upscaler models.
export const enhanceReady = () => !!process.env.FAL_KEY;

export async function enhanceImage(imageUrl: string): Promise<string | null> {
  const key = process.env.FAL_KEY;
  if (!key) return null;
  const model = process.env.IMAGE_ENHANCE_MODEL || "fal-ai/clarity-upscaler";
  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl }),
  });
  if (!res.ok) throw new Error(`Enhance ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const j = await res.json();
  return j?.image?.url || j?.images?.[0]?.url || j?.image_url || null;
}
