// lib/collections.ts — the single source of truth for the Firestore data model.
// Collection names + the shape of every document. All access is server-side via the
// Admin SDK (see firebaseAdmin.ts); client direct access is denied by firestore.rules.
//
// Layout mirrors the two halves of the business (see STRATEGY.md):
//   Funnel (self-serve):  users, generations, leads
//   Service (done-for-you): clients, campaigns, creatives, results, reports, invoices

import type { ImageQuality } from "@/lib/plans";

export const COL = {
  users: "adspark_users",
  generations: "adspark_generations",
  leads: "adspark_leads",
  clients: "adspark_clients",
  campaigns: "adspark_campaigns",
  creatives: "adspark_creatives",
  results: "adspark_results",
  reports: "adspark_reports",
  invoices: "adspark_invoices",
} as const;

// ── Funnel (self-serve tool) ─────────────────────────────────────────────────

export interface UserDoc {
  plan: string;            // PlanId
  periodKey: string;       // "YYYY-MM" — monthly quota window
  used: number;            // generations used this period
  email?: string | null;
  // billing (Phase 2)
  stripeCustomerId?: string | null;
  stripeSubId?: string | null;
  subStatus?: string | null;
  // access
  admin?: boolean;         // operator access to /admin
  createdAt: number;
  updatedAt: number;
}

export interface Brief {
  brand: string; product: string; goal: string;
  platform: string; tone: string; audience: string;
}

export interface GenerationDoc {
  uid: string;
  brief: Brief;
  variations: any[];
  creativeBrief: string;
  imagePrompt: string;
  images: string[];        // persisted Storage download URLs
  imageCount: number;
  quality?: ImageQuality;
  createdAt: number;
}

export type LeadStatus = "new" | "contacted" | "won" | "lost";

export interface LeadDoc {
  uid: string | null;
  name: string; email: string; company: string; website: string;
  monthlySpend: string; tier: string; message: string;
  source: string;
  status: LeadStatus;
  createdAt: number;
}

// ── Service (done-for-you) ───────────────────────────────────────────────────

export type ClientStatus = "active" | "paused" | "churned";

export interface ClientDoc {
  leadId?: string | null;     // origin lead, if converted
  ownerUid?: string | null;   // linked auth user, if any
  name: string;               // contact name
  company: string;
  email: string;
  serviceTier: string;        // ServiceTierId
  mrrUsd: number;             // retainer
  platforms: string[];        // ["meta","google",...]
  adAccounts: Record<string, string>; // platform -> external ad-account id
  status: ClientStatus;
  notes?: string;
  startedAt: number;
  updatedAt: number;
}

export type CampaignStatus = "draft" | "live" | "paused" | "ended";

export interface CampaignDoc {
  clientId: string;
  platform: string;           // "meta" | "google" | "tiktok"
  externalId?: string | null; // platform campaign id once launched
  name: string;
  objective: string;
  status: CampaignStatus;
  dailyBudgetUsd?: number;
  createdAt: number;
  updatedAt: number;
}

// The moat: every shipped asset is tagged so results can be attributed to what works.
export interface CreativeTags {
  vertical?: string; hook?: string; format?: string; offer?: string; platform?: string;
}

export interface CreativeDoc {
  clientId?: string | null;
  campaignId?: string | null;
  generationId?: string | null;
  type: "image" | "video" | "copy";
  assetUrl?: string | null;
  copy?: any;                 // headline/primaryText/caption/hashtags/cta
  tags: CreativeTags;
  externalAdId?: string | null;
  aiDisclosed?: boolean;      // FTC/platform AI label applied
  status: "draft" | "live" | "archived";
  createdAt: number;
}

// Performance rows — the data that compounds into "what converts for [niche]".
export interface ResultDoc {
  creativeId: string;
  campaignId: string;
  clientId: string;
  platform: string;
  date: string;               // "YYYY-MM-DD"
  impressions: number;
  clicks: number;
  spendUsd: number;
  conversions: number;
  revenueUsd: number;
  ctr: number;
  cpaUsd: number;
  roas: number;
  ingestedAt: number;
}

export interface ReportDoc {
  clientId: string;
  periodStart: string; periodEnd: string;
  metrics: Record<string, number>;
  summary: string;
  url?: string | null;
  sentAt?: number | null;
  createdAt: number;
}

export type InvoiceKind = "subscription" | "retainer";

export interface InvoiceDoc {
  kind: InvoiceKind;
  uid?: string | null;
  clientId?: string | null;
  amountUsd: number;
  currency: string;
  status: string;             // mirrors Stripe invoice status
  stripeInvoiceId?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  createdAt: number;
}
