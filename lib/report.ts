// lib/report.ts - SERVER ONLY. Build + store a 30-day client performance report, optionally
// emailing the client a shareable link. Shared by the admin route and the weekly cron.
import { randomUUID } from "crypto";
import { adminDb } from "./firebaseAdmin";
import { COL } from "./collections";
import { sendEmail } from "./email";
import { reportReadyEmail } from "./emails";

export async function buildAndStoreReport(clientId: string, opts?: { email?: boolean }): Promise<{ id: string; token: string; url: string } | null> {
  const db = adminDb();
  const clientSnap = await db.collection(COL.clients).doc(clientId).get();
  if (!clientSnap.exists) return null;
  const client: any = clientSnap.data();

  const now = Date.now();
  const since = now - 30 * 86400000;
  const rs = await db.collection(COL.results).where("clientId", "==", clientId).limit(1000).get();
  const results = rs.docs.map(d => d.data() as any).filter(r => (r.ingestedAt || 0) >= since);

  const sum = (f: string) => results.reduce((s, r) => s + (Number(r[f]) || 0), 0);
  const spend = sum("spendUsd"), revenue = sum("revenueUsd"), conversions = sum("conversions");
  const impressions = sum("impressions"), clicks = sum("clicks");
  const metrics = {
    spendUsd: Math.round(spend), revenueUsd: Math.round(revenue), conversions, impressions, clicks,
    roas: spend ? +(revenue / spend).toFixed(2) : 0,
    ctr: impressions ? +((clicks / impressions) * 100).toFixed(2) : 0,
    cpaUsd: conversions ? +(spend / conversions).toFixed(2) : 0,
  };

  const byHook: Record<string, { spend: number; rev: number }> = {};
  for (const r of results) { const k = r.tags?.hook; if (!k) continue; const x = byHook[k] || (byHook[k] = { spend: 0, rev: 0 }); x.spend += r.spendUsd || 0; x.rev += r.revenueUsd || 0; }
  const topHook = Object.entries(byHook).map(([k, v]) => ({ hook: k, roas: v.spend ? +(v.rev / v.spend).toFixed(2) : 0 })).sort((a, b) => b.roas - a.roas)[0];

  const campSnap = await db.collection(COL.campaigns).where("clientId", "==", clientId).limit(50).get();
  const campaigns = campSnap.docs.map(d => { const c: any = d.data(); return { name: c.name, platform: c.platform, status: c.status, lastResults: c.lastResults || null }; });

  const clientName = client.company || client.name || "your brand";
  const summary = results.length
    ? `Over the last 30 days we ran $${metrics.spendUsd.toLocaleString()} in ad spend for ${clientName} across ${campaigns.length} campaign(s), driving ${conversions} conversions at a ${metrics.roas}x ROAS${topHook ? ` - your best-performing angle was "${topHook.hook}"` : ""}.`
    : `We're setting up ${clientName}'s campaigns. Your first performance report will populate here as results come in.`;

  const token = randomUUID();
  const periodStart = new Date(since).toISOString().slice(0, 10);
  const periodEnd = new Date(now).toISOString().slice(0, 10);
  const ref = await db.collection(COL.reports).add({ clientId, clientName, periodStart, periodEnd, metrics, campaigns, summary, token, sentAt: null as number | null, createdAt: now });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${appUrl}/r/${ref.id}?t=${token}`;

  if (opts?.email && client.email) {
    const e = reportReadyEmail(clientName, url, summary);
    await sendEmail({ to: client.email, subject: e.subject, html: e.html });
    await ref.set({ sentAt: Date.now() }, { merge: true });
  }

  return { id: ref.id, token, url };
}
