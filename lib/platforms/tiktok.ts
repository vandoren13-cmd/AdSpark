// lib/platforms/tiktok.ts — SERVER ONLY. TikTok Marketing API adapter (campaign + insights).
// Env-gated; no-ops cleanly when unconfigured. Gotchas handled: auth via the `Access-Token`
// header (not Bearer); every response is HTTP 200 wrapped in a {code,message,data} envelope
// (code===0 means success); report arrays are JSON-encoded in the query string; metric values
// arrive as strings; budget is in whole currency units.
const V = process.env.TIKTOK_API_VERSION || "v1.3";
const BASE = `https://business-api.tiktok.com/open_api/${V}`;
const TOKEN = process.env.TIKTOK_ACCESS_TOKEN || "";
const DEFAULT_ADV = process.env.TIKTOK_ADVERTISER_ID || "";

export const tiktokReady = () => !!TOKEN;

async function tt(path: string, init: { method: "GET" | "POST"; query?: Record<string, string>; body?: unknown }) {
  if (!tiktokReady()) throw new Error("TikTok is not configured.");
  const url = new URL(`${BASE}/${path}`);
  if (init.query) for (const [k, v] of Object.entries(init.query)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    method: init.method,
    headers: { "Access-Token": TOKEN, "Content-Type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const j: any = await res.json().catch(() => ({}));
  if (j?.code !== 0) throw new Error(j?.message || `TikTok error (code ${j?.code ?? res.status})`);
  return j.data;
}

const OBJECTIVES: Record<string, string> = { sales: "PRODUCT_SALES", leads: "LEAD_GENERATION", traffic: "TRAFFIC", awareness: "REACH", engagement: "ENGAGEMENT", app: "APP_PROMOTION" };

export async function tiktokCreateCampaign(adAccountId: string, opts: { name: string; objective?: string }): Promise<{ id: string; accountId: string }> {
  const adv = adAccountId || DEFAULT_ADV;
  if (!adv) throw new Error("TikTok advertiser id missing.");
  const data = await tt("campaign/create/", { method: "POST", body: {
    advertiser_id: adv, campaign_name: opts.name,
    objective_type: OBJECTIVES[(opts.objective || "traffic").toLowerCase()] || "TRAFFIC",
    budget_mode: "BUDGET_MODE_DAY", budget: 50, operation_status: "DISABLE", // DISABLE = created paused
  } });
  return { id: String(data.campaign_id), accountId: adv };
}

export interface TikTokInsights { impressions: number; clicks: number; spend: number; conversions: number; revenue: number; }

export async function tiktokGetInsights(campaignExternalId: string, accountId?: string): Promise<TikTokInsights> {
  const adv = accountId || DEFAULT_ADV;
  if (!adv) throw new Error("TikTok advertiser id missing.");
  const end = new Date(Date.now()).toISOString().slice(0, 10);
  const start = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const data = await tt("report/integrated/get/", { method: "GET", query: {
    advertiser_id: adv, report_type: "BASIC", data_level: "AUCTION_CAMPAIGN",
    dimensions: JSON.stringify(["campaign_id"]),
    metrics: JSON.stringify(["impressions", "clicks", "spend", "conversion", "complete_payment_roas"]),
    filtering: JSON.stringify([{ field_name: "campaign_ids", filter_type: "IN", filter_value: JSON.stringify([campaignExternalId]) }]),
    start_date: start, end_date: end, page_size: "1000",
  } });
  const row = (data?.list || [])[0]?.metrics || {};
  const spend = Number(row.spend || 0);
  const roas = Number(row.complete_payment_roas || 0);
  return { impressions: Number(row.impressions || 0), clicks: Number(row.clicks || 0), spend, conversions: Number(row.conversion || 0), revenue: +(spend * roas).toFixed(2) };
}
