// lib/platforms/meta.ts — SERVER ONLY. Meta (Facebook/Instagram) Marketing API adapter:
// create campaigns and pull performance insights. Env-gated — if META_ACCESS_TOKEN is
// unset, callers fall back to draft/manual flows. Set META_ACCESS_TOKEN + a Meta ad
// account (per-client or META_AD_ACCOUNT_ID) and smoke-test before relying on it.
const V = process.env.META_API_VERSION || "v21.0";
const BASE = `https://graph.facebook.com/${V}`;
const TOKEN = process.env.META_ACCESS_TOKEN || "";

export const metaReady = () => !!TOKEN;

const actId = (id: string) => (id.startsWith("act_") ? id : `act_${id}`);

async function graph(path: string, init?: { method?: string; body?: BodyInit; params?: Record<string, string> }) {
  const url = new URL(`${BASE}/${path}`);
  if (init?.params) for (const [k, v] of Object.entries(init.params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", TOKEN);
  const res = await fetch(url.toString(), { method: init?.method || "GET", body: init?.body });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || `Meta API error (${res.status})`);
  return json;
}

// ODAX objective mapping (current Meta objective enums).
const OBJECTIVES: Record<string, string> = {
  sales: "OUTCOME_SALES", leads: "OUTCOME_LEADS", traffic: "OUTCOME_TRAFFIC",
  awareness: "OUTCOME_AWARENESS", engagement: "OUTCOME_ENGAGEMENT", app: "OUTCOME_APP_PROMOTION",
};

// Creates the campaign PAUSED (operator reviews before spend goes live).
export async function metaCreateCampaign(adAccountId: string, opts: { name: string; objective?: string }): Promise<{ id: string }> {
  if (!metaReady()) throw new Error("Meta is not configured (META_ACCESS_TOKEN missing).");
  const body = new URLSearchParams({
    name: opts.name,
    objective: OBJECTIVES[(opts.objective || "traffic").toLowerCase()] || "OUTCOME_TRAFFIC",
    status: "PAUSED",
    special_ad_categories: "[]",
  });
  const r = await graph(`${actId(adAccountId)}/campaigns`, { method: "POST", body });
  return { id: r.id };
}

export interface MetaInsights { impressions: number; clicks: number; spend: number; conversions: number; revenue: number; }

export async function metaGetInsights(campaignExternalId: string): Promise<MetaInsights> {
  if (!metaReady()) throw new Error("Meta is not configured (META_ACCESS_TOKEN missing).");
  const r = await graph(`${campaignExternalId}/insights`, {
    params: { fields: "impressions,clicks,spend,actions,action_values", date_preset: "last_30d" },
  });
  const row = r?.data?.[0] || {};
  const num = (x: any) => Number(x || 0);
  const fromActions = (arr: any[], types: string[]) => {
    for (const t of types) { const hit = arr?.find((a: any) => a.action_type === t); if (hit) return num(hit.value); }
    return 0;
  };
  const purchaseTypes = ["purchase", "offsite_conversion.fb_pixel_purchase", "omni_purchase"];
  return {
    impressions: num(row.impressions),
    clicks: num(row.clicks),
    spend: num(row.spend),
    conversions: fromActions(row.actions, purchaseTypes),
    revenue: fromActions(row.action_values, purchaseTypes),
  };
}
