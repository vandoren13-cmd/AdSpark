// lib/platforms/index.ts — SERVER ONLY. One dispatcher over the native ad-platform
// adapters (Meta, Google, TikTok) so routes don't branch per platform. Each adapter is
// env-gated; platformReady() reports whether a platform can actually launch/report.
import { metaReady, metaCreateCampaign, metaGetInsights } from "./meta";
import { googleReady, googleCreateCampaign, googleGetInsights } from "./google";
import { tiktokReady, tiktokCreateCampaign, tiktokGetInsights } from "./tiktok";

export type AdPlatform = "meta" | "google" | "tiktok";
export interface PlatformInsights { impressions: number; clicks: number; spend: number; conversions: number; revenue: number; }

export function platformReady(p: string): boolean {
  if (p === "meta") return metaReady();
  if (p === "google") return googleReady();
  if (p === "tiktok") return tiktokReady();
  return false;
}

// Returns the platform campaign id + the account id to persist (needed for reporting on
// Google/TikTok, where insights require the customer/advertiser id).
export async function createCampaign(p: string, adAccountId: string, opts: { name: string; objective?: string }): Promise<{ id: string; accountId: string }> {
  if (p === "meta") { const r = await metaCreateCampaign(adAccountId, opts); return { id: r.id, accountId: adAccountId }; }
  if (p === "google") return googleCreateCampaign(adAccountId, opts);
  if (p === "tiktok") return tiktokCreateCampaign(adAccountId, opts);
  throw new Error(`Unsupported platform: ${p}`);
}

export async function getInsights(p: string, externalId: string, accountId?: string): Promise<PlatformInsights> {
  if (p === "meta") return metaGetInsights(externalId);
  if (p === "google") return googleGetInsights(externalId, accountId);
  if (p === "tiktok") return tiktokGetInsights(externalId, accountId);
  throw new Error(`Unsupported platform: ${p}`);
}
