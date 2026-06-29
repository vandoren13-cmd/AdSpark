// lib/platforms/google.ts - SERVER ONLY. Google Ads API adapter (campaign create + insights).
// Env-gated; no-ops cleanly when unconfigured. Unlike Meta's static token, Google needs a
// refresh-token → access-token exchange + a developer token + the MCC login-customer-id header.
// Gotchas handled: money is in micros (÷1e6), metric values arrive as strings, searchStream
// returns an array of chunks.
const V = process.env.GOOGLE_ADS_API_VERSION || "v23";
const BASE = `https://googleads.googleapis.com/${V}`;
const DEV_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "";
const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET || "";
const REFRESH = process.env.GOOGLE_ADS_REFRESH_TOKEN || "";
const LOGIN_CID = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || "").replace(/-/g, "");
const DEFAULT_CID = (process.env.GOOGLE_ADS_CUSTOMER_ID || "").replace(/-/g, "");

export const googleReady = () => !!(DEV_TOKEN && CLIENT_ID && CLIENT_SECRET && REFRESH);

const digits = (s: string) => (s || "").replace(/-/g, "");

let _tok: { value: string; exp: number } | null = null;
async function accessToken(): Promise<string> {
  if (_tok && _tok.exp > Date.now() + 60000) return _tok.value;
  const body = new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: REFRESH, grant_type: "refresh_token" });
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body });
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j?.error_description || j?.error || `Google OAuth error (${res.status})`);
  _tok = { value: j.access_token, exp: Date.now() + Number(j.expires_in || 3500) * 1000 };
  return _tok.value;
}

async function gads(cid: string, op: "mutate" | "searchStream", body: unknown) {
  if (!googleReady()) throw new Error("Google Ads is not configured.");
  const tok = await accessToken();
  const res = await fetch(`${BASE}/customers/${cid}/googleAds:${op}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tok}`,
      "developer-token": DEV_TOKEN,
      ...(LOGIN_CID ? { "login-customer-id": LOGIN_CID } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j?.error?.message || j?.[0]?.error?.message || `Google Ads error (${res.status})`);
  return j;
}

// Google has no "objective" - map to advertisingChannelType.
const CHANNEL: Record<string, string> = { traffic: "SEARCH", sales: "SEARCH", leads: "SEARCH", awareness: "DISPLAY", engagement: "DISPLAY", app: "DISPLAY" };

export async function googleCreateCampaign(adAccountId: string, opts: { name: string; objective?: string }): Promise<{ id: string; accountId: string }> {
  const cid = digits(adAccountId) || DEFAULT_CID;
  if (!cid) throw new Error("Google Ads customer id missing.");
  const channel = CHANNEL[(opts.objective || "traffic").toLowerCase()] || "SEARCH";
  // Atomic: create the budget (-1) and the campaign (-2) referencing it, in one request.
  const body = {
    mutateOperations: [
      { campaignBudgetOperation: { create: { resourceName: `customers/${cid}/campaignBudgets/-1`, name: `${opts.name} Budget ${Date.now()}`, amountMicros: 5000000, deliveryMethod: "STANDARD" } } },
      { campaignOperation: { create: {
        resourceName: `customers/${cid}/campaigns/-2`, name: opts.name, status: "PAUSED",
        advertisingChannelType: channel, campaignBudget: `customers/${cid}/campaignBudgets/-1`, manualCpc: {},
        networkSettings: { targetGoogleSearch: channel === "SEARCH", targetSearchNetwork: channel === "SEARCH", targetContentNetwork: channel === "DISPLAY", targetPartnerSearchNetwork: false },
      } } },
    ],
  };
  const j = await gads(cid, "mutate", body);
  const rn: string = j?.mutateOperationResponses?.find((r: any) => r.campaignResult)?.campaignResult?.resourceName || "";
  const id = rn.split("/").pop() || "";
  if (!id) throw new Error("Google Ads: no campaign id returned.");
  return { id, accountId: cid };
}

export interface GoogleInsights { impressions: number; clicks: number; spend: number; conversions: number; revenue: number; }

export async function googleGetInsights(campaignExternalId: string, accountId?: string): Promise<GoogleInsights> {
  const cid = digits(accountId || "") || DEFAULT_CID;
  if (!cid) throw new Error("Google Ads customer id missing.");
  const query = `SELECT campaign.id, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value FROM campaign WHERE campaign.id = ${campaignExternalId} AND segments.date DURING LAST_30_DAYS`;
  const j = await gads(cid, "searchStream", { query });
  const out: GoogleInsights = { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 };
  const chunks = Array.isArray(j) ? j : [j];
  for (const ch of chunks) for (const row of ch?.results || []) {
    const m = row.metrics || {};
    out.impressions += Number(m.impressions || 0);
    out.clicks += Number(m.clicks || 0);
    out.spend += Number(m.costMicros || m.cost_micros || 0) / 1e6;
    out.conversions += Number(m.conversions || 0);
    out.revenue += Number(m.conversionsValue || m.conversions_value || 0);
  }
  return out;
}
