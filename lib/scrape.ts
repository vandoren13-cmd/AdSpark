// lib/scrape.ts — SERVER ONLY. Fetch a product/landing URL and turn it into an ad brief
// (matches Zeely's "paste a URL" flow). Basic SSRF guard; OpenGraph/meta extraction with a
// best-effort Claude cleanup pass (falls back to raw if no key).
import Anthropic from "@anthropic-ai/sdk";

function publicHttpUrl(raw: string): URL | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h === "0.0.0.0" || h.endsWith(".local") || h.endsWith(".internal")) return null;
    if (/^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) return null; // private ranges
    return u;
  } catch { return null; }
}

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").trim();
const meta = (html: string, prop: string) => {
  const a = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, "i"));
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${prop}["']`, "i"));
  return decode((a?.[1] || b?.[1] || ""));
};

export interface Scraped { title: string; description: string; image: string; siteName: string; price: string; url: string; }

export async function scrapeProduct(raw: string): Promise<Scraped> {
  const u = publicHttpUrl(raw);
  if (!u) throw new Error("Enter a valid public http(s) URL.");
  const res = await fetch(u.toString(), { headers: { "User-Agent": "Mozilla/5.0 (compatible; AdSparkBot/1.0)" }, redirect: "follow", signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Couldn't fetch that URL (HTTP ${res.status}).`);
  const html = (await res.text()).slice(0, 600000);
  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || "";
  return {
    title: meta(html, "og:title") || decode(titleTag),
    description: meta(html, "og:description") || meta(html, "description"),
    image: meta(html, "og:image"),
    siteName: meta(html, "og:site_name") || u.hostname.replace(/^www\./, ""),
    price: meta(html, "product:price:amount") || meta(html, "og:price:amount"),
    url: u.toString(),
  };
}

export async function briefFromScrape(s: Scraped): Promise<{ brand: string; product: string; audience: string; tone: string; goal: string }> {
  const fallback = {
    brand: s.siteName || "",
    product: [s.title, s.description].filter(Boolean).join(" — ").slice(0, 800),
    audience: "", tone: "Bold & punchy", goal: "Drive conversions",
  };
  if (!process.env.ANTHROPIC_API_KEY) return fallback;
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-opus-4-8", max_tokens: 500,
      system: "Extract a concise advertising brief from scraped product-page data. Respond ONLY with valid JSON, no markdown.",
      messages: [{ role: "user", content: `Return JSON {brand, product, audience, tone, goal} for this page.\nSite: ${s.siteName}\nTitle: ${s.title}\nDescription: ${s.description}\nPrice: ${s.price}\n\nbrand = brand/company name; product = 1-2 sentence offer description; audience = likely target audience; tone = short tone label; goal = likely ad goal.` }],
    });
    const text = msg.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    const j = JSON.parse(text.replace(/```json|```/g, "").trim());
    return {
      brand: String(j.brand || fallback.brand),
      product: String(j.product || fallback.product),
      audience: String(j.audience || ""),
      tone: String(j.tone || "Bold & punchy"),
      goal: String(j.goal || "Drive conversions"),
    };
  } catch { return fallback; }
}
