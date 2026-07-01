"use client";
// app/admin/page.tsx - operator back office. Sidebar-navigated console with separated
// sections: Dashboard, Leads, Clients, Campaigns, Creatives (+client approvals),
// Support (CS queue), Messages (client threads), Customers, Reports, Generations.
// Gated server-side by /api/admin/* (admin flag or ADMIN_EMAILS allowlist).
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

const grad = { background: "linear-gradient(135deg,#8b5cff,#4f8cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } as React.CSSProperties;
const leadColor: Record<string, string> = { new: "#4f8cff", contacted: "#f6c453", won: "#34d399", lost: "#6b7690" };

type View = "dashboard" | "leads" | "clients" | "campaigns" | "creatives" | "support" | "messages" | "customers" | "reports" | "generations";

export default function AdminPage() {
  const { user, loading, getToken, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [support, setSupport] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userCounts, setUserCounts] = useState<any>({});
  const [sendSel, setSendSel] = useState<Record<string, string>>({});
  const [denied, setDenied] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [q, setQ] = useState("");
  const [nc, setNc] = useState({ clientId: "", name: "", platform: "meta", objective: "traffic", dailyBudgetUsd: "" });
  // Support helpdesk UI state
  const [selTicket, setSelTicket] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [supportFilter, setSupportFilter] = useState<"all" | "open" | "pending" | "resolved">("all");
  // Customer detail + Messages helpdesk state
  const [selUser, setSelUser] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [selThread, setSelThread] = useState<string | null>(null);
  const [msgText, setMsgText] = useState("");

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  useEffect(() => { if (user) load(); }, [user]); // eslint-disable-line

  async function load() {
    setRefreshing(true);
    try {
      const t = await getToken(); if (!t) return;
      const h = { Authorization: `Bearer ${t}` };
      const r = await fetch("/api/admin/overview", { headers: h });
      if (r.status === 403) { setDenied(true); return; }
      const j = await r.json();
      if (j.ok) { setData(j); setDenied(false); } else setErr(j.error);
      const [sj, mj, uj] = await Promise.all([
        fetch("/api/admin/support", { headers: h }).then(x => x.json()).catch(() => ({})),
        fetch("/api/admin/messages", { headers: h }).then(x => x.json()).catch(() => ({})),
        fetch("/api/admin/users", { headers: h }).then(x => x.json()).catch(() => ({})),
      ]);
      if (sj.ok) setSupport(sj.tickets || []);
      if (mj.ok) setMessages(mj.messages || []);
      if (uj.ok) { setUsers(uj.users || []); setUserCounts(uj.counts || {}); }
    } catch (e: any) { setErr(e.message); }
    finally { setRefreshing(false); }
  }

  // ── actions ──────────────────────────────────────────────────────────────
  async function api(url: string, body: any, id: string) {
    setBusyId(id); setErr(null);
    try {
      const t = await getToken(); if (!t) return null;
      const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json(); if (!j.ok) throw new Error(j.error || j.warn); await load(); return j;
    } catch (e: any) { setErr(e.message); return null; }
    finally { setBusyId(null); }
  }
  const leadAction = (id: string, body: any) => api("/api/admin/leads", { id, ...body }, id);
  const ncSet = (k: string, v: string) => setNc(s => ({ ...s, [k]: v }));
  async function createCampaign(goLive: boolean) {
    if (!nc.clientId || !nc.name.trim()) { setErr("Pick a client and enter a campaign name."); return; }
    const j = await api("/api/admin/campaigns", { ...nc, dailyBudgetUsd: Number(nc.dailyBudgetUsd) || 0, goLive }, "new-campaign");
    if (j) { if (j.warn) setErr(j.warn); setNc({ clientId: "", name: "", platform: "meta", objective: "traffic", dailyBudgetUsd: "" }); }
  }
  const syncResults = (id: string) => api("/api/admin/results", { action: "sync", campaignId: id }, id);
  async function promptAndLog(base: any, key: string) {
    const spend = Number(prompt("Spend ($)?") || "0"), impressions = Number(prompt("Impressions?") || "0"), clicks = Number(prompt("Clicks?") || "0"), conversions = Number(prompt("Conversions?") || "0"), revenue = Number(prompt("Revenue ($)?") || "0");
    await api("/api/admin/results", { ...base, spend, impressions, clicks, conversions, revenue }, key);
  }
  const logResults = (id: string) => promptAndLog({ campaignId: id }, id);
  const logCreativeResults = (id: string) => promptAndLog({ creativeId: id }, id);
  const promoteCreative = (genId: string) => api("/api/admin/creatives", { fromGenerationId: genId }, genId);
  const generateReport = (clientId: string) => api("/api/admin/reports", { clientId, email: true }, clientId);
  const supportAction = (id: string, body: any) => api("/api/admin/support", { id, ...body }, id);
  async function sendReply(id: string) {
    if (!replyText.trim()) return;
    const text = replyText.trim(); setReplyText("");
    await supportAction(id, { reply: text });
  }
  async function sendClientMessage(clientId: string) {
    if (!msgText.trim()) return;
    const text = msgText.trim(); setMsgText("");
    await api("/api/admin/messages", { clientId, text }, "msg-" + clientId);
  }
  async function openCustomer(id: string) {
    setSelUser(id); setUserDetail(null); setDetailBusy(true);
    try {
      const t = await getToken(); if (!t) return;
      const r = await fetch(`/api/admin/user/${id}`, { headers: { Authorization: `Bearer ${t}` } });
      const j = await r.json(); if (j.ok) setUserDetail(j); else setErr(j.error);
    } catch (e: any) { setErr(e.message); }
    finally { setDetailBusy(false); }
  }
  function sendForApproval(creativeId: string) {
    const clientId = sendSel[creativeId];
    if (!clientId) { setErr("Pick a client to send this creative to."); return; }
    api("/api/admin/creatives", { action: "send_for_approval", id: creativeId, clientId }, creativeId);
  }

  // ── derived ─────────────────────────────────────────────────────────────
  const s = data?.stats;
  const clientName = (id: string) => { const c = (data?.clients || []).find((x: any) => x.id === id); return c ? (c.company || c.name || c.email) : id; };
  const pendingApprovals = useMemo(() => (data?.creatives || []).filter((c: any) => c.approvalStatus === "pending").length, [data]);
  const openTickets = useMemo(() => support.filter(t => t.status !== "resolved").length, [support]);
  const unreadMsgs = useMemo(() => messages.filter(m => m.from === "client" && !m.readByOperator).length, [messages]);
  const threads = useMemo(() => {
    const m: Record<string, any[]> = {};
    for (const msg of messages) (m[msg.clientId] = m[msg.clientId] || []).push(msg);
    return Object.entries(m);
  }, [messages]);

  if (loading || !user) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#8b97b3" }}>Loading…</main>;
  if (denied) return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center", padding: 20 }}>
      <div><div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div><div style={{ fontSize: 18, fontWeight: 800 }}>Not authorized</div>
        <div style={{ color: "#8b97b3", fontSize: 13, marginTop: 6 }}>This area is for AdSpark operators. <a href="/app" style={{ color: "#8b5cff" }}>Back to app</a></div></div>
    </main>
  );

  const NAV: { id: View; label: string; ico: string; badge?: number; muted?: boolean }[] = [
    { id: "dashboard", label: "Dashboard", ico: "📊" },
    { id: "leads", label: "Leads", ico: "🎯", badge: s?.leadsNew || 0 },
    { id: "clients", label: "Clients", ico: "🏢", badge: s?.clients || 0, muted: true },
    { id: "campaigns", label: "Campaigns", ico: "🚀" },
    { id: "creatives", label: "Creatives", ico: "🎨", badge: pendingApprovals },
    { id: "support", label: "Support", ico: "💬", badge: openTickets },
    { id: "messages", label: "Messages", ico: "✉️", badge: unreadMsgs },
    { id: "customers", label: "Customers", ico: "👥", badge: userCounts.total || 0, muted: true },
    { id: "reports", label: "Reports", ico: "📄" },
    { id: "generations", label: "Generations", ico: "✨" },
  ];
  const title = NAV.find(n => n.id === view)?.label || "";

  // ── shared bits ──
  const stat = (label: string, value: any) => (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 11, color: "#8b97b3", textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, marginTop: 4 }}>{value}</div>
    </div>
  );
  const lbl: React.CSSProperties = { fontSize: 10, color: "#8b97b3", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, display: "block" };
  const H = ({ children }: { children: React.ReactNode }) => <div style={{ fontSize: 15, fontWeight: 800, margin: "0 0 12px" }}>{children}</div>;
  const empty = (t: string) => <div className="card" style={{ padding: 20, color: "#8b97b3", fontSize: 13 }}>{t}</div>;
  const ql = q.trim().toLowerCase();

  return (
    <main>
      <div className="admin-shell">
        {/* Sidebar */}
        <aside className="admin-nav">
          <div style={{ fontWeight: 900, fontSize: 16, padding: "4px 12px 14px" }}><span style={grad}>AdSpark</span> <span style={{ color: "#8b97b3", fontWeight: 700, fontSize: 12 }}>Operator</span></div>
          {NAV.map(n => (
            <button key={n.id} className={`admin-navlink${view === n.id ? " on" : ""}`} onClick={() => setView(n.id)}>
              <span className="ico">{n.ico}</span><span className="navlabel">{n.label}</span>
              {!!n.badge && <span className={`admin-badge${n.muted ? " muted" : ""}`}>{n.badge}</span>}
            </button>
          ))}
          <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid #161c2e", display: "flex", flexDirection: "column", gap: 4 }}>
            <a href="/app" className="admin-navlink"><span className="ico">↩</span><span className="navlabel">Back to app</span></a>
            <button className="admin-navlink" onClick={() => { logout(); router.replace("/"); }}><span className="ico">⎋</span><span className="navlabel">Log out</span></button>
          </div>
        </aside>

        {/* Main */}
        <div className="admin-main">
          <div className="admin-topbar">
            <div style={{ maxWidth: 1180, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 900 }}>{title}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {(view === "leads" || view === "customers") && (
                  <input className="in" value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" style={{ width: 180, padding: "7px 11px", fontSize: 13 }} />
                )}
                <button className="btn-ghost btn" disabled={refreshing} onClick={load} style={{ padding: "7px 12px", fontSize: 13 }}>{refreshing ? "…" : "↻ Refresh"}</button>
              </div>
            </div>
          </div>

          <div style={{ padding: "22px 22px 60px", maxWidth: 1180, margin: "0 auto" }}>
            {err && <div style={{ color: "#ff6b6b", marginBottom: 16 }}>{err}</div>}

            {/* DASHBOARD */}
            {view === "dashboard" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 24 }}>
                  {stat("MRR (service)", `$${(s?.mrr ?? 0).toLocaleString()}`)}
                  {stat("Blended ROAS", `${data?.insights?.totals?.roas ?? 0}x`)}
                  {stat("New leads", s?.leadsNew ?? 0)}
                  {stat("Clients", s?.clients ?? 0)}
                  {stat("Customers", userCounts.total ?? s?.users ?? 0)}
                  {stat("Paid", userCounts.paid ?? 0)}
                  {stat("Gens (30d)", s?.gens30d ?? 0)}
                  {stat("Open tickets", openTickets)}
                </div>
                {data?.funnel?.length > 0 && (
                  <div className="card" style={{ padding: 14, marginBottom: 24 }}>
                    <div style={{ fontSize: 11, color: "#8b97b3", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Funnel events</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                      {data.funnel.map((f: any) => <div key={f.name} style={{ fontSize: 13 }}><span style={{ color: "#c7d0e6", fontWeight: 700 }}>{f.count}</span> <span style={{ color: "#8b97b3" }}>{f.name}</span></div>)}
                    </div>
                  </div>
                )}
                <H>What&apos;s converting {data?.insights && <span style={{ color: "#8b97b3", fontWeight: 500, fontSize: 12 }}>· {data.insights.totals.results} results · ${data.insights.totals.spendUsd.toLocaleString()} spend · {data.insights.totals.roas}x</span>}</H>
                {(!data?.insights || data.insights.totals.results === 0) ? empty("No performance data yet. Promote a generation to a creative and log results - every row is tagged by hook/format/vertical, building your \"what converts\" benchmark.") : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
                    {([["By hook", "byHook"], ["By format", "byFormat"], ["By vertical", "byVertical"], ["By platform", "byPlatform"]] as const).map(([t, k]) => (
                      <div key={k} className="card" style={{ padding: 14 }}>
                        <div style={{ fontSize: 11, color: "#8b97b3", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>{t}</div>
                        {((data.insights as any)[k] || []).length === 0 ? <div style={{ fontSize: 12, color: "#6b7690" }}>-</div> : ((data.insights as any)[k]).map((row: any) => (
                          <div key={row.key} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "3px 0", gap: 8 }}>
                            <span style={{ color: "#c7d0e6", textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.key}</span>
                            <span style={{ color: "#34d399", fontWeight: 700, flexShrink: 0 }}>{row.roas}x <span style={{ color: "#6b7690", fontWeight: 500 }}>({row.count})</span></span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* LEADS */}
            {view === "leads" && ((data?.leads || []).filter((l: any) => !ql || [l.name, l.email, l.company].some((x: string) => (x || "").toLowerCase().includes(ql))).length === 0 ? empty("No leads. They appear as people apply on /done-for-you.") : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(data.leads || []).filter((l: any) => !ql || [l.name, l.email, l.company].some((x: string) => (x || "").toLowerCase().includes(ql))).map((l: any) => (
                  <div key={l.id} className="card" style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0, flex: "1 1 320px" }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700 }}>{l.name || l.email} <span style={{ color: "#8b97b3", fontWeight: 500 }}>· {l.email}</span>{l.tier && <span style={{ color: "#8b5cff", fontWeight: 700 }}> · {l.tier}</span>}</div>
                      <div style={{ fontSize: 11.5, color: "#8b97b3" }}>{[l.company, l.monthlySpend, l.website].filter(Boolean).join(" · ") || "-"}</div>
                      {l.message && <div style={{ fontSize: 12, color: "#aeb9d4", marginTop: 4, lineHeight: 1.4 }}>{l.message}</div>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: leadColor[l.status] || "#8b97b3", textTransform: "uppercase" }}>{l.status}</span>
                      {l.status !== "won" && <button className="btn-ghost btn" disabled={busyId === l.id} onClick={() => leadAction(l.id, { status: "contacted" })} style={{ padding: "5px 10px", fontSize: 12 }}>Contacted</button>}
                      {l.status !== "won" && <button className="btn" disabled={busyId === l.id} onClick={() => leadAction(l.id, { action: "convert" })} style={{ padding: "5px 10px", fontSize: 12 }}>Convert →</button>}
                      {l.status !== "lost" && l.status !== "won" && <button className="btn-ghost btn" disabled={busyId === l.id} onClick={() => leadAction(l.id, { status: "lost" })} style={{ padding: "5px 10px", fontSize: 12, color: "#8b97b3" }}>Lost</button>}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* CLIENTS */}
            {view === "clients" && ((data?.clients || []).length === 0 ? empty("No clients yet. Convert a lead to create one.") : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.clients.map((c: any) => (
                  <div key={c.id} className="card" style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div><div style={{ fontSize: 13.5, fontWeight: 700 }}>{c.company || c.name || c.email}</div><div style={{ fontSize: 11.5, color: "#8b97b3" }}>{[c.serviceTier, c.email].filter(Boolean).join(" · ")}</div></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button className="btn-ghost btn" disabled={busyId === c.id} onClick={() => generateReport(c.id)} style={{ padding: "5px 10px", fontSize: 12 }}>Report</button>
                      <div style={{ textAlign: "right" }}><div style={{ fontSize: 14, fontWeight: 800 }}>${(c.mrrUsd || 0).toLocaleString()}/mo</div><div style={{ fontSize: 11, color: c.status === "active" ? "#34d399" : "#8b97b3" }}>{c.status}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* CAMPAIGNS */}
            {view === "campaigns" && (
              <>
                <div className="card" style={{ padding: 14, marginBottom: 12, display: "grid", gridTemplateColumns: "repeat(5,1fr) auto", gap: 8, alignItems: "end" }}>
                  <div><label style={lbl}>Client</label><select className="in" value={nc.clientId} onChange={e => ncSet("clientId", e.target.value)}><option value="">Select…</option>{(data?.clients || []).map((c: any) => <option key={c.id} value={c.id}>{c.company || c.name || c.email}</option>)}</select></div>
                  <div><label style={lbl}>Name</label><input className="in" value={nc.name} onChange={e => ncSet("name", e.target.value)} placeholder="Spring sale" /></div>
                  <div><label style={lbl}>Platform</label><select className="in" value={nc.platform} onChange={e => ncSet("platform", e.target.value)}><option value="meta">Meta</option><option value="google">Google</option><option value="tiktok">TikTok</option></select></div>
                  <div><label style={lbl}>Objective</label><select className="in" value={nc.objective} onChange={e => ncSet("objective", e.target.value)}><option value="traffic">Traffic</option><option value="sales">Sales</option><option value="leads">Leads</option><option value="awareness">Awareness</option></select></div>
                  <div><label style={lbl}>Daily $</label><input className="in" value={nc.dailyBudgetUsd} onChange={e => ncSet("dailyBudgetUsd", e.target.value)} placeholder="50" /></div>
                  <div style={{ display: "flex", gap: 6 }}><button className="btn-ghost btn" disabled={busyId === "new-campaign"} onClick={() => createCampaign(false)} style={{ padding: "10px 12px", fontSize: 12 }}>Draft</button><button className="btn" disabled={busyId === "new-campaign"} onClick={() => createCampaign(true)} style={{ padding: "10px 12px", fontSize: 12 }}>Go live</button></div>
                </div>
                {(!data?.campaigns || data.campaigns.length === 0) ? empty("No campaigns yet.") : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {data.campaigns.map((c: any) => (
                      <div key={c.id} className="card" style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ minWidth: 0, flex: "1 1 300px" }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>{c.name} <span style={{ color: "#8b97b3", fontWeight: 500 }}>· {clientName(c.clientId)}</span></div><div style={{ fontSize: 11.5, color: "#8b97b3" }}>{c.platform} · {c.objective} · {c.status}{c.externalId ? ` · ${c.externalId}` : " · draft"}{c.lastResults ? ` · $${(c.lastResults.spendUsd || 0).toLocaleString()} · ${(c.lastResults.roas || 0).toFixed(2)}x` : ""}</div></div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}><button className="btn-ghost btn" disabled={busyId === c.id} onClick={() => logResults(c.id)} style={{ padding: "5px 10px", fontSize: 12 }}>Log results</button>{c.externalId && <button className="btn" disabled={busyId === c.id} onClick={() => syncResults(c.id)} style={{ padding: "5px 10px", fontSize: 12 }}>Sync</button>}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* CREATIVES */}
            {view === "creatives" && ((data?.creatives || []).length === 0 ? empty("No creatives yet. Promote a generation (Generations tab → Creative) to start.") : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.creatives.map((c: any) => (
                  <div key={c.id} className="card" style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: "1 1 260px" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {c.assetUrl && <img src={c.assetUrl} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", border: "1px solid #232a3e" }} />}
                      <div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.copy?.headline || c.type}</div><div style={{ fontSize: 11.5, color: "#8b5cff" }}>{[c.tags?.hook, c.tags?.format, c.tags?.vertical].filter(Boolean).join(" · ") || "untagged"}</div></div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                      {c.approvalStatus && c.approvalStatus !== "none" && <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", color: c.approvalStatus === "approved" ? "#34d399" : c.approvalStatus === "changes_requested" ? "#f6c453" : "#4f8cff" }}>{c.approvalStatus === "approved" ? "✓ approved" : c.approvalStatus === "changes_requested" ? "changes" : "pending"}</span>}
                      <select className="in" value={sendSel[c.id] || ""} onChange={e => setSendSel(sv => ({ ...sv, [c.id]: e.target.value }))} style={{ width: "auto", padding: "5px 8px", fontSize: 11.5 }}><option value="">Client…</option>{(data?.clients || []).map((cl: any) => <option key={cl.id} value={cl.id}>{cl.company || cl.name || cl.email}</option>)}</select>
                      <button className="btn-ghost btn" disabled={busyId === c.id} onClick={() => sendForApproval(c.id)} style={{ padding: "5px 10px", fontSize: 12 }}>Send for approval</button>
                      <button className="btn-ghost btn" disabled={busyId === c.id} onClick={() => logCreativeResults(c.id)} style={{ padding: "5px 10px", fontSize: 12 }}>Log results</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* SUPPORT - helpdesk (list + conversation) */}
            {view === "support" && (support.length === 0 ? empty("No support requests yet. Customer messages from /support land here.") : (() => {
              const stColor = (st: string) => st === "resolved" ? "#34d399" : st === "pending" ? "#f6c453" : "#4f8cff";
              const count = (st: string) => support.filter(t => t.status === st).length;
              const filtered = support.filter(t => supportFilter === "all" || t.status === supportFilter);
              const active = support.find(t => t.id === selTicket) || null;
              const thread = active ? [{ from: "customer", text: active.message, at: active.createdAt }, ...(active.replies || [])] : [];
              return (
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                  {/* Left: filters + ticket list */}
                  <div style={{ flex: "1 1 300px", minWidth: 270, maxWidth: 400 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                      {(["all", "open", "pending", "resolved"] as const).map(f => (
                        <button key={f} onClick={() => setSupportFilter(f)} className="chip" style={{ padding: "5px 11px", fontSize: 11.5, cursor: "pointer", textTransform: "capitalize", background: supportFilter === f ? "#7c5cff22" : undefined, borderColor: supportFilter === f ? "#7c5cff55" : undefined, color: supportFilter === f ? "#cbbcff" : undefined }}>
                          {f}{f !== "all" ? ` ${count(f)}` : ` ${support.length}`}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "70vh", overflowY: "auto" }}>
                      {filtered.length === 0 ? <div style={{ color: "#6b7690", fontSize: 12.5, padding: 8 }}>No {supportFilter} tickets.</div> : filtered.map((t: any) => {
                        const sel = t.id === selTicket;
                        const last = (t.replies || [])[t.replies?.length - 1];
                        const awaiting = t.status !== "resolved" && (!last || last.from === "customer");
                        return (
                          <button key={t.id} onClick={() => { setSelTicket(t.id); setReplyText(""); }} className="card" style={{ textAlign: "left", padding: "10px 12px", cursor: "pointer", border: sel ? "1.5px solid #7c5cff" : undefined, background: sel ? "#10142a" : undefined }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                              <span style={{ width: 7, height: 7, borderRadius: 7, background: stColor(t.status), flexShrink: 0 }} />
                              <span style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</span>
                              {awaiting && <span className="admin-badge" style={{ marginLeft: "auto" }}>new</span>}
                            </div>
                            <div style={{ fontSize: 11, color: "#8b97b3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.email}</div>
                            <div style={{ fontSize: 11.5, color: "#6b7690", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.message}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: conversation + reply */}
                  <div style={{ flex: "2 1 420px", minWidth: 300 }}>
                    {!active ? (
                      <div className="card" style={{ padding: 40, textAlign: "center", color: "#8b97b3", fontSize: 13.5 }}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>💬</div>Select a ticket to read and reply.
                      </div>
                    ) : (
                      <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "78vh" }}>
                        {/* header */}
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #1c2238", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 800 }}>{active.subject}</div>
                            <div style={{ fontSize: 12, color: "#8b97b3" }}>{active.email} · opened {active.createdAt ? new Date(active.createdAt).toLocaleDateString() : ""}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: stColor(active.status) }}>{active.status}</span>
                            {active.status !== "pending" && <button className="btn-ghost btn" disabled={busyId === active.id} onClick={() => supportAction(active.id, { status: "pending" })} style={{ padding: "5px 10px", fontSize: 12 }}>Pending</button>}
                            {active.status !== "resolved" ? <button className="btn-ghost btn" disabled={busyId === active.id} onClick={() => supportAction(active.id, { status: "resolved" })} style={{ padding: "5px 10px", fontSize: 12 }}>Resolve</button> : <button className="btn-ghost btn" disabled={busyId === active.id} onClick={() => supportAction(active.id, { status: "open" })} style={{ padding: "5px 10px", fontSize: 12 }}>Reopen</button>}
                          </div>
                        </div>
                        {/* conversation */}
                        <div style={{ padding: 16, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 10, background: "#080b14" }}>
                          {thread.map((m: any, i: number) => (
                            <div key={i} style={{ alignSelf: m.from === "agent" ? "flex-end" : "flex-start", maxWidth: "82%" }}>
                              <div style={{ fontSize: 10, color: "#6b7690", marginBottom: 3, textAlign: m.from === "agent" ? "right" : "left" }}>{m.from === "agent" ? "You" : active.email}{m.at ? ` · ${new Date(m.at).toLocaleString()}` : ""}</div>
                              <div style={{ padding: "9px 13px", borderRadius: 12, fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap", background: m.from === "agent" ? "linear-gradient(135deg,#7c5cff,#4f8cff)" : "#0d1120", border: m.from === "agent" ? "none" : "1px solid #1c2238", color: m.from === "agent" ? "#fff" : "#cdd6ea" }}>{m.text}</div>
                            </div>
                          ))}
                        </div>
                        {/* reply box */}
                        <div style={{ padding: 12, borderTop: "1px solid #1c2238" }}>
                          <textarea className="in" rows={2} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply… (sends an email to the customer)" style={{ resize: "vertical", marginBottom: 8 }} onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendReply(active.id); }} />
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 11, color: "#6b7690" }}>⌘/Ctrl + Enter to send · emails the customer</span>
                            <button className="btn btn-spark" disabled={busyId === active.id || !replyText.trim()} onClick={() => sendReply(active.id)} style={{ padding: "8px 16px", fontSize: 13 }}>{busyId === active.id ? "Sending…" : "Send reply"}</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })())}

            {/* MESSAGES - helpdesk (thread list + conversation) */}
            {view === "messages" && (threads.length === 0 ? empty("No client messages yet. Managed clients message you from their portal.") : (() => {
              const active = threads.find(([cid]: any) => cid === selThread) as any;
              const conv = active ? [...active[1]].sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0)) : [];
              return (
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                  {/* Left: client thread list */}
                  <div style={{ flex: "1 1 280px", minWidth: 260, maxWidth: 360 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "74vh", overflowY: "auto" }}>
                      {threads.map(([cid, ms]: any) => {
                        const sorted = [...ms].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                        const last = sorted[sorted.length - 1];
                        const unread = ms.some((m: any) => m.from === "client" && !m.readByOperator);
                        const sel = cid === selThread;
                        return (
                          <button key={cid} onClick={() => { setSelThread(cid); setMsgText(""); }} className="card" style={{ textAlign: "left", padding: "10px 12px", cursor: "pointer", border: sel ? "1.5px solid #7c5cff" : undefined, background: sel ? "#10142a" : undefined }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clientName(cid)}</span>
                              {unread && <span className="admin-badge" style={{ marginLeft: "auto" }}>new</span>}
                            </div>
                            <div style={{ fontSize: 11.5, color: "#6b7690", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{last?.from === "operator" ? "You: " : ""}{last?.text}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Right: conversation + reply */}
                  <div style={{ flex: "2 1 420px", minWidth: 300 }}>
                    {!active ? (
                      <div className="card" style={{ padding: 40, textAlign: "center", color: "#8b97b3", fontSize: 13.5 }}><div style={{ fontSize: 32, marginBottom: 10 }}>✉️</div>Select a client to view the thread.</div>
                    ) : (
                      <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "78vh" }}>
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #1c2238", fontSize: 15, fontWeight: 800 }}>{clientName(active[0])}</div>
                        <div style={{ padding: 16, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 8, background: "#080b14" }}>
                          {conv.map((m: any) => (
                            <div key={m.id} style={{ alignSelf: m.from === "operator" ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                              <div style={{ fontSize: 10, color: "#6b7690", marginBottom: 3, textAlign: m.from === "operator" ? "right" : "left" }}>{m.from === "operator" ? "You" : clientName(active[0])}{m.createdAt ? ` · ${new Date(m.createdAt).toLocaleString()}` : ""}</div>
                              <div style={{ padding: "8px 12px", borderRadius: 11, fontSize: 13, lineHeight: 1.45, whiteSpace: "pre-wrap", background: m.from === "operator" ? "linear-gradient(135deg,#7c5cff,#4f8cff)" : "#0d1120", border: m.from === "operator" ? "none" : "1px solid #1c2238", color: m.from === "operator" ? "#fff" : "#cdd6ea" }}>{m.text}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ padding: 12, borderTop: "1px solid #1c2238", display: "flex", gap: 8 }}>
                          <input className="in" value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="Message the client…" onKeyDown={e => { if (e.key === "Enter") sendClientMessage(active[0]); }} />
                          <button className="btn btn-spark" disabled={busyId === "msg-" + active[0] || !msgText.trim()} onClick={() => sendClientMessage(active[0])} style={{ padding: "0 16px", whiteSpace: "nowrap" }}>Send</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })())}

            {/* CUSTOMERS */}
            {view === "customers" && (
              <>
                <div style={{ display: "flex", gap: 16, marginBottom: 14, fontSize: 12.5, color: "#8b97b3" }}>
                  <span><b style={{ color: "#e7ecf5" }}>{userCounts.total ?? 0}</b> total</span>
                  <span><b style={{ color: "#e7ecf5" }}>{userCounts.paid ?? 0}</b> paid</span>
                  <span><b style={{ color: "#e7ecf5" }}>{userCounts.service ?? 0}</b> on service</span>
                </div>
                {users.filter(u => !ql || [u.email, u.displayName].some((x: string) => (x || "").toLowerCase().includes(ql))).length === 0 ? empty("No customers match.") : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {users.filter(u => !ql || [u.email, u.displayName].some((x: string) => (x || "").toLowerCase().includes(ql))).map(u => (
                      <button key={u.id} onClick={() => openCustomer(u.id)} className="card hover-pop" style={{ textAlign: "left", cursor: "pointer", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ minWidth: 0, flex: "1 1 260px" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.displayName || u.email || u.id}{u.admin && <span style={{ color: "#8b5cff", fontSize: 10.5, fontWeight: 800 }}> · ADMIN</span>}</div>
                          <div style={{ fontSize: 11.5, color: "#8b97b3" }}>{u.email}{u.hasBrandKit ? " · brand kit ✓" : ""}{u.serviceStatus !== "none" ? ` · service: ${u.serviceStatus}` : ""}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                          <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 800, textTransform: "capitalize" }}>{u.plan}</div><div style={{ fontSize: 11, color: "#8b97b3" }}>{u.used} used</div></div>
                          <span style={{ fontSize: 11, color: "#6b7690" }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ""}</span>
                          <span style={{ color: "#8b5cff", fontSize: 14 }}>›</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* REPORTS */}
            {view === "reports" && ((data?.reports || []).length === 0 ? empty("No reports yet. Generate one from the Clients tab.") : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.reports.map((r: any) => (
                  <div key={r.id} className="card" style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div><div style={{ fontSize: 13.5, fontWeight: 700 }}>{r.clientName} <span style={{ color: "#8b97b3", fontWeight: 500 }}>· {r.periodStart}→{r.periodEnd}</span></div><div style={{ fontSize: 11.5, color: "#8b97b3" }}>${(r.metrics?.spendUsd || 0).toLocaleString()} spend · {(r.metrics?.roas || 0)}x{r.sentAt ? " · emailed ✓" : ""}</div></div>
                    <a className="btn-ghost btn" href={`/r/${r.id}?t=${r.token}`} target="_blank" rel="noreferrer" style={{ padding: "5px 10px", fontSize: 12 }}>Open ↗</a>
                  </div>
                ))}
              </div>
            ))}

            {/* GENERATIONS */}
            {view === "generations" && ((data?.generations || []).length === 0 ? empty("No generations yet.") : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.generations.map((g: any) => (
                  <div key={g.id} className="card" style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.brief?.product || "-"}</div><div style={{ fontSize: 11.5, color: "#8b97b3" }}>{g.brief?.platform} · {g.variations?.length || 0} variations · {g.imageCount || 0} images</div></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}><button className="btn-ghost btn" disabled={busyId === g.id} onClick={() => promoteCreative(g.id)} style={{ padding: "4px 9px", fontSize: 11.5 }}>→ Creative</button><span style={{ fontSize: 11, color: "#6b7690" }}>{g.createdAt ? new Date(g.createdAt).toLocaleDateString() : ""}</span></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer detail drill-down */}
      {selUser && (
        <div onClick={() => { setSelUser(null); setUserDetail(null); }} style={{ position: "fixed", inset: 0, background: "#04060cd8", zIndex: 100, display: "grid", placeItems: "center", padding: 20, overflow: "auto" }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ padding: 20, maxWidth: 760, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
            {(detailBusy || !userDetail) ? (
              <div style={{ padding: 30, textAlign: "center", color: "#8b97b3" }}>Loading customer…</div>
            ) : (() => {
              const d = userDetail; const cu = d.user;
              return (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{cu.displayName || cu.email || cu.id}{cu.admin && <span style={{ color: "#8b5cff", fontSize: 11, fontWeight: 800 }}> · ADMIN</span>}</div>
                      <div style={{ fontSize: 12.5, color: "#8b97b3" }}>{cu.email} · joined {cu.createdAt ? new Date(cu.createdAt).toLocaleDateString() : "-"}</div>
                    </div>
                    <button onClick={() => { setSelUser(null); setUserDetail(null); }} className="btn-ghost btn" style={{ padding: "6px 10px", fontSize: 13 }}>✕</button>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 16 }}>
                    <div className="card" style={{ padding: 12 }}><div style={{ fontSize: 10.5, color: "#8b97b3", textTransform: "uppercase" }}>Plan</div><div style={{ fontSize: 16, fontWeight: 800 }}>{cu.plan}{cu.subStatus ? <span style={{ fontSize: 11, color: "#8b97b3", fontWeight: 500 }}> · {cu.subStatus}</span> : ""}</div></div>
                    <div className="card" style={{ padding: 12 }}><div style={{ fontSize: 10.5, color: "#8b97b3", textTransform: "uppercase" }}>Generations</div><div style={{ fontSize: 16, fontWeight: 800 }}>{cu.used}/{cu.quota}</div></div>
                    <div className="card" style={{ padding: 12 }}><div style={{ fontSize: 10.5, color: "#8b97b3", textTransform: "uppercase" }}>Videos</div><div style={{ fontSize: 16, fontWeight: 800 }}>{cu.videosUsed}/{cu.videoQuota}</div></div>
                    <div className="card" style={{ padding: 12 }}><div style={{ fontSize: 10.5, color: "#8b97b3", textTransform: "uppercase" }}>Service</div><div style={{ fontSize: 16, fontWeight: 800, textTransform: "capitalize" }}>{cu.serviceStatus}</div></div>
                  </div>

                  {/* Brand kit */}
                  {cu.brandKit && (cu.brandKit.name || cu.brandKit.voice || cu.brandKit.benefits) && (
                    <div className="card" style={{ padding: 14, marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Brand kit</div>
                      <div style={{ fontSize: 12.5, color: "#aab7cf", lineHeight: 1.6 }}>
                        {cu.brandKit.name && <div><b style={{ color: "#8b97b3" }}>Name:</b> {cu.brandKit.name}</div>}
                        {cu.brandKit.voice && <div><b style={{ color: "#8b97b3" }}>Voice:</b> {cu.brandKit.voice}</div>}
                        {cu.brandKit.benefits && <div><b style={{ color: "#8b97b3" }}>Benefits:</b> {cu.brandKit.benefits}</div>}
                        {cu.brandKit.avoid && <div><b style={{ color: "#8b97b3" }}>Avoid:</b> {cu.brandKit.avoid}</div>}
                      </div>
                    </div>
                  )}

                  {/* Support tickets */}
                  {d.tickets?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Support tickets ({d.tickets.length})</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {d.tickets.map((t: any) => (
                          <button key={t.id} onClick={() => { setSelUser(null); setUserDetail(null); setView("support"); setSelTicket(t.id); }} className="card" style={{ textAlign: "left", cursor: "pointer", padding: "8px 12px", display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <span style={{ fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</span>
                            <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", color: t.status === "resolved" ? "#34d399" : t.status === "pending" ? "#f6c453" : "#4f8cff", flexShrink: 0 }}>{t.status}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent generations */}
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Recent creations ({d.generations?.length || 0} sets · {d.videos?.length || 0} videos)</div>
                  {(!d.generations || d.generations.length === 0) ? <div style={{ color: "#8b97b3", fontSize: 12.5 }}>No generations yet.</div> : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 8 }}>
                      {d.generations.slice(0, 12).map((g: any) => (
                        <div key={g.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                          {g.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={g.images[0]} alt="" style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} />
                          ) : <div style={{ height: 80, display: "grid", placeItems: "center", background: "#0a0e1c", color: "#6b7690" }}>✨</div>}
                          <div style={{ padding: "6px 8px", fontSize: 10.5, color: "#aab7cf", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.product || "Ad set"}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </main>
  );
}
