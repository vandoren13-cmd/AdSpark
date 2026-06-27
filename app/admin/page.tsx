"use client";
// app/admin/page.tsx — operator back office. Gated server-side by /api/admin/* (admin
// flag or ADMIN_EMAILS allowlist); non-admins get a "not authorized" view.
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

const grad = { background: "linear-gradient(135deg,#7c5cff,#4f8cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } as React.CSSProperties;
const statusColor: Record<string, string> = { new: "#4f8cff", contacted: "#f6c453", won: "#34d399", lost: "#6b7690" };

export default function AdminPage() {
  const { user, loading, getToken, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [denied, setDenied] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [nc, setNc] = useState({ clientId: "", name: "", platform: "meta", objective: "traffic", dailyBudgetUsd: "" });

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  useEffect(() => { if (user) load(); }, [user]); // eslint-disable-line

  async function load() {
    try {
      const t = await getToken(); if (!t) return;
      const r = await fetch("/api/admin/overview", { headers: { Authorization: `Bearer ${t}` } });
      if (r.status === 403) { setDenied(true); return; }
      const j = await r.json();
      if (j.ok) { setData(j); setDenied(false); } else setErr(j.error);
    } catch (e: any) { setErr(e.message); }
  }

  async function leadAction(id: string, body: any) {
    setBusyId(id); setErr(null);
    try {
      const t = await getToken(); if (!t) return;
      const r = await fetch("/api/admin/leads", { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      await load();
    } catch (e: any) { setErr(e.message); }
    finally { setBusyId(null); }
  }

  const ncSet = (k: string, v: string) => setNc(s => ({ ...s, [k]: v }));

  async function createCampaign(goLive: boolean) {
    if (!nc.clientId || !nc.name.trim()) { setErr("Pick a client and enter a campaign name."); return; }
    setBusyId("new-campaign"); setErr(null);
    try {
      const t = await getToken(); if (!t) return;
      const r = await fetch("/api/admin/campaigns", { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify({ ...nc, dailyBudgetUsd: Number(nc.dailyBudgetUsd) || 0, goLive }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      if (j.warn) setErr(j.warn);
      setNc({ clientId: "", name: "", platform: "meta", objective: "traffic", dailyBudgetUsd: "" });
      await load();
    } catch (e: any) { setErr(e.message); }
    finally { setBusyId(null); }
  }

  async function syncResults(id: string) {
    setBusyId(id); setErr(null);
    try {
      const t = await getToken(); if (!t) return;
      const r = await fetch("/api/admin/results", { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "sync", campaignId: id }) });
      const j = await r.json(); if (!j.ok) throw new Error(j.error); await load();
    } catch (e: any) { setErr(e.message); }
    finally { setBusyId(null); }
  }

  async function logResults(id: string) {
    const spend = Number(prompt("Spend ($)?") || "0");
    const impressions = Number(prompt("Impressions?") || "0");
    const clicks = Number(prompt("Clicks?") || "0");
    const conversions = Number(prompt("Conversions?") || "0");
    const revenue = Number(prompt("Revenue ($)?") || "0");
    setBusyId(id); setErr(null);
    try {
      const t = await getToken(); if (!t) return;
      const r = await fetch("/api/admin/results", { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify({ campaignId: id, spend, impressions, clicks, conversions, revenue }) });
      const j = await r.json(); if (!j.ok) throw new Error(j.error); await load();
    } catch (e: any) { setErr(e.message); }
    finally { setBusyId(null); }
  }

  if (loading || !user) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#8b97b3" }}>Loading…</main>;
  if (denied) return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center", padding: 20 }}>
      <div>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Not authorized</div>
        <div style={{ color: "#8b97b3", fontSize: 13, marginTop: 6 }}>This area is for AdSpark operators. <a href="/app" style={{ color: "#7c5cff" }}>Back to app</a></div>
      </div>
    </main>
  );

  const s = data?.stats;
  const stat = (label: string, value: any) => (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 11, color: "#8b97b3", textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, marginTop: 4 }}>{value}</div>
    </div>
  );
  const lbl: React.CSSProperties = { fontSize: 10, color: "#8b97b3", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, display: "block" };
  const clientName = (id: string) => { const c = (data?.clients || []).find((x: any) => x.id === id); return c ? (c.company || c.name || c.email) : id; };

  return (
    <main style={{ minHeight: "100vh" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #1c2238" }}>
        <div style={{ fontWeight: 900, fontSize: 18 }}><span style={grad}>AdSpark</span> <span style={{ color: "#8b97b3", fontWeight: 700 }}>· Operator</span></div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/app" className="btn-ghost btn" style={{ padding: "7px 12px", fontSize: 13 }}>App</a>
          <button onClick={() => { logout(); router.replace("/"); }} className="btn-ghost btn" style={{ padding: "7px 12px", fontSize: 13 }}>Log out</button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "22px 18px 60px" }}>
        {err && <div style={{ color: "#ff6b6b", marginBottom: 16 }}>{err}</div>}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 26 }}>
          {stat("MRR (service)", `$${(s?.mrr ?? 0).toLocaleString()}`)}
          {stat("New leads", s?.leadsNew ?? 0)}
          {stat("Clients", s?.clients ?? 0)}
          {stat("Users", s?.users ?? 0)}
          {stat("Gens (30d)", s?.gens30d ?? 0)}
          {stat("Gens (all)", s?.gensTotal ?? 0)}
        </div>

        {/* Leads */}
        <div style={{ fontSize: 16, fontWeight: 800, margin: "8px 0 12px" }}>Leads</div>
        {(!data?.leads || data.leads.length === 0) ? (
          <div className="card" style={{ padding: 18, color: "#8b97b3", fontSize: 13, marginBottom: 26 }}>No leads yet. They'll appear here as people apply on <a href="/done-for-you" style={{ color: "#7c5cff" }}>/done-for-you</a>.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 26 }}>
            {data.leads.map((l: any) => (
              <div key={l.id} className="card" style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0, flex: "1 1 320px" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>
                    {l.name || l.email} <span style={{ color: "#8b97b3", fontWeight: 500 }}>· {l.email}</span>
                    {l.tier && <span style={{ color: "#7c5cff", fontWeight: 700 }}> · {l.tier}</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#8b97b3" }}>
                    {[l.company, l.monthlySpend, l.website].filter(Boolean).join(" · ") || "—"}
                  </div>
                  {l.message && <div style={{ fontSize: 12, color: "#aeb9d4", marginTop: 4, lineHeight: 1.4 }}>{l.message}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: statusColor[l.status] || "#8b97b3", textTransform: "uppercase" }}>{l.status}</span>
                  {l.status !== "won" && <button className="btn-ghost btn" disabled={busyId === l.id} onClick={() => leadAction(l.id, { status: "contacted" })} style={{ padding: "5px 10px", fontSize: 12 }}>Contacted</button>}
                  {l.status !== "won" && <button className="btn" disabled={busyId === l.id} onClick={() => leadAction(l.id, { action: "convert" })} style={{ padding: "5px 10px", fontSize: 12 }}>Convert →</button>}
                  {l.status !== "lost" && l.status !== "won" && <button className="btn-ghost btn" disabled={busyId === l.id} onClick={() => leadAction(l.id, { status: "lost" })} style={{ padding: "5px 10px", fontSize: 12, color: "#8b97b3" }}>Lost</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Clients */}
        <div style={{ fontSize: 16, fontWeight: 800, margin: "8px 0 12px" }}>Clients</div>
        {(!data?.clients || data.clients.length === 0) ? (
          <div className="card" style={{ padding: 18, color: "#8b97b3", fontSize: 13, marginBottom: 26 }}>No clients yet. Convert a lead above to create one.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 26 }}>
            {data.clients.map((c: any) => (
              <div key={c.id} className="card" style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>{c.company || c.name || c.email}</div>
                  <div style={{ fontSize: 11.5, color: "#8b97b3" }}>{[c.serviceTier, c.email].filter(Boolean).join(" · ")}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>${(c.mrrUsd || 0).toLocaleString()}/mo</div>
                  <div style={{ fontSize: 11, color: c.status === "active" ? "#34d399" : "#8b97b3" }}>{c.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Campaigns */}
        <div style={{ fontSize: 16, fontWeight: 800, margin: "8px 0 12px" }}>Campaigns</div>
        <div className="card" style={{ padding: 14, marginBottom: 12, display: "grid", gridTemplateColumns: "repeat(5,1fr) auto", gap: 8, alignItems: "end" }}>
          <div><label style={lbl}>Client</label>
            <select className="in" value={nc.clientId} onChange={e => ncSet("clientId", e.target.value)}>
              <option value="">Select…</option>
              {(data?.clients || []).map((c: any) => <option key={c.id} value={c.id}>{c.company || c.name || c.email}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Name</label><input className="in" value={nc.name} onChange={e => ncSet("name", e.target.value)} placeholder="Spring sale" /></div>
          <div><label style={lbl}>Platform</label><select className="in" value={nc.platform} onChange={e => ncSet("platform", e.target.value)}><option value="meta">Meta</option><option value="google">Google</option><option value="tiktok">TikTok</option></select></div>
          <div><label style={lbl}>Objective</label><select className="in" value={nc.objective} onChange={e => ncSet("objective", e.target.value)}><option value="traffic">Traffic</option><option value="sales">Sales</option><option value="leads">Leads</option><option value="awareness">Awareness</option><option value="engagement">Engagement</option></select></div>
          <div><label style={lbl}>Daily $</label><input className="in" value={nc.dailyBudgetUsd} onChange={e => ncSet("dailyBudgetUsd", e.target.value)} placeholder="50" /></div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn-ghost btn" disabled={busyId === "new-campaign"} onClick={() => createCampaign(false)} style={{ padding: "10px 12px", fontSize: 12 }}>Draft</button>
            <button className="btn" disabled={busyId === "new-campaign"} onClick={() => createCampaign(true)} style={{ padding: "10px 12px", fontSize: 12 }}>Go live</button>
          </div>
        </div>
        {(!data?.campaigns || data.campaigns.length === 0) ? (
          <div className="card" style={{ padding: 18, color: "#8b97b3", fontSize: 13, marginBottom: 26 }}>No campaigns yet. Create one for a client above.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 26 }}>
            {data.campaigns.map((c: any) => (
              <div key={c.id} className="card" style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0, flex: "1 1 300px" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>{c.name} <span style={{ color: "#8b97b3", fontWeight: 500 }}>· {clientName(c.clientId)}</span></div>
                  <div style={{ fontSize: 11.5, color: "#8b97b3" }}>
                    {c.platform} · {c.objective} · {c.status}{c.externalId ? ` · ${c.externalId}` : " · draft"}
                    {c.lastResults ? ` · $${(c.lastResults.spendUsd || 0).toLocaleString()} spend · ${(c.lastResults.roas || 0).toFixed(2)}x ROAS` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button className="btn-ghost btn" disabled={busyId === c.id} onClick={() => logResults(c.id)} style={{ padding: "5px 10px", fontSize: 12 }}>Log results</button>
                  {c.externalId && <button className="btn" disabled={busyId === c.id} onClick={() => syncResults(c.id)} style={{ padding: "5px 10px", fontSize: 12 }}>Sync</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent generations */}
        <div style={{ fontSize: 16, fontWeight: 800, margin: "8px 0 12px" }}>Recent generations</div>
        {(!data?.generations || data.generations.length === 0) ? (
          <div className="card" style={{ padding: 18, color: "#8b97b3", fontSize: 13 }}>No generations yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.generations.map((g: any) => (
              <div key={g.id} className="card" style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.brief?.product || "—"}</div>
                  <div style={{ fontSize: 11.5, color: "#8b97b3" }}>{g.brief?.platform} · {g.variations?.length || 0} variations · {g.imageCount || 0} images</div>
                </div>
                <div style={{ fontSize: 11, color: "#6b7690", flexShrink: 0 }}>{g.createdAt ? new Date(g.createdAt).toLocaleString() : ""}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
