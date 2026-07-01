// lib/scrape.ts - SERVER ONLY. Fetch a product/landing URL and turn it into an ad brief
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

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Fetch-Dest": "document", "Sec-Fetch-Mode": "navigate", "Sec-Fetch-Site": "none",
  "Upgrade-Insecure-Requests": "1",
};

function parseHtml(html: string, u: URL): Scraped {
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

// Reader-proxy fallback for bot-protected sites (Etsy, Amazon, etc.). r.jina.ai fetches
// the page and returns clean text, bypassing most bot walls. Anonymous access is now
// rate/reputation-limited, so set JINA_API_KEY (free tier) to make hard sites reliable.
async function readerFallback(u: URL): Promise<Scraped | null> {
  try {
    const headers: Record<string, string> = { "User-Agent": BROWSER_HEADERS["User-Agent"], "X-Return-Format": "markdown" };
    if (process.env.JINA_API_KEY) headers["Authorization"] = `Bearer ${process.env.JINA_API_KEY}`;
    const res = await fetch(`https://r.jina.ai/${u.toString()}`, {
      headers,
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const txt = await res.text();
    const title = decode(txt.match(/^Title:\s*(.+)$/m)?.[1] || "");
    const start = txt.indexOf("Markdown Content:");
    const content = (start >= 0 ? txt.slice(start + 17) : txt)
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[#>*_`|]/g, " ").replace(/\s+/g, " ").trim().slice(0, 1400);
    if (!title && !content) return null;
    return { title, description: content, image: "", siteName: u.hostname.replace(/^www\./, ""), price: "", url: u.toString() };
  } catch { return null; }
}

// Marketplaces that serve a generic *site* page to a direct fetch (so we'd scrape the
// wrong description). Read these via the proxy first to get the real listing.
const PREFER_READER = ["etsy.com", "amazon.", "aliexpress.", "ebay.com", "walmart.com", "wayfair.com"];

// Reject obviously-generic marketplace boilerplate so we fall through to a better source.
function looksGeneric(s: Scraped, host: string): boolean {
  const t = `${s.title} ${s.description}`.toLowerCase();
  if (host.includes("etsy.com")) return /online marketplace for buying and selling/.test(t) || s.title.trim().toLowerCase() === "etsy";
  return false;
}

export async function scrapeProduct(raw: string): Promise<Scraped> {
  const u = publicHttpUrl(raw);
  if (!u) throw new Error("Enter a valid public http(s) URL.");
  const host = u.hostname.toLowerCase();
  const hard = PREFER_READER.some(h => host.includes(h));

  // Bot-protected marketplaces: read via proxy first (a direct fetch returns a generic page).
  if (hard) {
    const r = await readerFallback(u);
    if (r && (r.title || r.description)) return r;
  }
  // Direct fetch with a realistic browser identity (works for most sites).
  try {
    const res = await fetch(u.toString(), { headers: BROWSER_HEADERS, redirect: "follow", signal: AbortSignal.timeout(12000) });
    if (res.ok) {
      const scraped = parseHtml((await res.text()).slice(0, 600000), u);
      if ((scraped.title || scraped.description) && !looksGeneric(scraped, host)) return scraped;
    }
  } catch { /* fall through */ }
  // Reader fallback for everything else (or when the direct page looked generic).
  const viaReader = await readerFallback(u);
  if (viaReader && (viaReader.title || viaReader.description)) return viaReader;
  throw new Error("Couldn't reach that URL - the site blocks automated requests. Copy the product details into the brief below and hit Generate.");
}

export async function briefFromScrape(s: Scraped): Promise<{ brand: string; product: string; audience: string; tone: string; goal: string }> {
  const fallback = {
    brand: s.siteName || "",
    product: [s.title, s.description].filter(Boolean).join(" - ").slice(0, 800),
    audience: "", tone: "Bold & punchy", goal: "Drive conversions",
  };
  if (!process.env.ANTHROPIC_API_KEY) return fallback;
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-opus-4-8", max_tokens: 500,
      system: "Extract a concise advertising brief from scraped product-page data. NEVER use em-dashes (—) or en-dashes (–); use a plain hyphen or comma. Respond ONLY with valid JSON, no markdown.",
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
