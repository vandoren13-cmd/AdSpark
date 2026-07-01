"use client";
// app/portal/page.tsx - managed-client portal. A done-for-you client signs in and sees
// their campaigns, blended performance, and reports. Non-clients get a CTA to apply.
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

const grad = { background: "linear-gradient(135deg,#7c5cff,#4f8cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } as React.CSSProperties;

export default function PortalPage() {
  const { user, loading, getToken, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  useEffect(() => { if (user) load(); }, [user]); // eslint-disable-line

  async function load() {
    try {
      const t = await getToken(); if (!t) return;
      const r = await fetch("/api/client", { headers: { Authorization: `Bearer ${t}` } });
      const j = await r.json();
      if (j.ok) setData(j); else setErr(j.error);
    } catch (e: any) { setErr(e.message); } finally { setLoaded(true); }
  }

  async function act(body: any) {
    setBusy(true); setErr(null);
    try {
      const t = await getToken(); if (!t) return;
      const r = await fetch("/api/client", { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      await load();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }
  const approve = (creativeId: string) => act({ action: "approve", creativeId });
  const requestChanges = (creativeId: string) => { const note = prompt("What would you like changed?") || ""; act({ action: "request_changes", creativeId, note }); };
  const sendMessage = async () => { if (!msg.trim()) return; const text = msg.trim(); setMsg(""); await act({ action: "message", text }); };

  if (loading || !user || !loaded) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#8b97b3" }}>Loading…</main>;

  const header = (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #1c2238" }}>
      <div style={{ fontWeight: 900, fontSize: 18 }}><span style={grad}>AdSpark AI</span> <span style={{ color: "#8b97b3", fontWeight: 700 }}>· Client portal</span></div>
      <div style={{ display: "flex", gap: 10 }}>
        <a href="/app" className="btn-ghost btn" style={{ padding: "7px 12px", fontSize: 13 }}>Generator</a>
        <button onClick={() => { logout(); router.replace("/"); }} className="btn-ghost btn" style={{ padding: "7px 12px", fontSize: 13 }}>Log out</button>
      </div>
    </header>
  );

  if (!data?.client) return (
    <main style={{ minHeight: "100vh" }}>
      {header}
      <div style={{ maxWidth: 620, margin: "60px auto", padding: "0 20px", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 8px" }}>No managed account yet</h1>
        <p style={{ color: "#9aa6c2", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>This portal is for done-for-you clients. Want us to run your ads end-to-end - flat price, no spend fees, you never touch the account?</p>
        <a href="/done-for-you" className="btn" style={{ padding: "12px 22px" }}>See done-for-you plans →</a>
      </div>
    </main>
  );

  const c = data.client, tot = data.totals || {};
  const card = (label: string, value: any, accent?: boolean) => (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontSize: 11, color: "#8b97b3", textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, marginTop: 4, color: accent ? "#34d399" : undefined }}>{value}</div>
    </div>
  );

  return (
    <main style={{ minHeight: "100vh" }}>
      {header}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 18px 60px" }}>
        {err && <div style={{ color: "#ff6b6b", marginBottom: 16 }}>{err}</div>}
        <h1 style={{ fontSize: 24, margin: "0 0 2px" }}>{c.name}</h1>
        <div style={{ color: "#8b97b3", fontSize: 13, marginBottom: 20 }}>{[c.serviceTier, c.status, `$${(c.mrrUsd || 0).toLocaleString()}/mo`].filter(Boolean).join(" · ")}</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 26 }}>
          {card("Ad spend (all-time)", `$${(tot.spendUsd ?? 0).toLocaleString()}`)}
          {card("Revenue", `$${(tot.revenueUsd ?? 0).toLocaleString()}`)}
          {card("ROAS", `${tot.roas ?? 0}x`, true)}
          {card("Conversions", (tot.conversions ?? 0).toLocaleString())}
        </div>

        <div style={{ fontSize: 16, fontWeight: 800, margin: "8px 0 12px" }}>Your campaigns</div>
        {(!data.campaigns || data.campaigns.length === 0) ? (
          <div className="card" style={{ padding: 18, color: "#8b97b3", fontSize: 13, marginBottom: 26 }}>Your campaigns are being set up - they'll appear here shortly.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 26 }}>
            {data.campaigns.map((cp: any, i: number) => (
              <div key={i} className="card" style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div><div style={{ fontSize: 13.5, fontWeight: 700 }}>{cp.name}</div><div style={{ fontSize: 11.5, color: "#8b97b3" }}>{cp.platform} · {cp.status}</div></div>
                {cp.lastResults && <div style={{ textAlign: "right", fontSize: 12.5 }}><div style={{ color: "#34d399", fontWeight: 700 }}>{(cp.lastResults.roas ?? 0)}x ROAS</div><div style={{ color: "#8b97b3" }}>${(cp.lastResults.spendUsd ?? 0).toLocaleString()} spend</div></div>}
              </div>
            ))}
          </div>
        )}

        {/* Creative approvals - client signs off before launch */}
        {data.creatives && data.creatives.length > 0 && (
          <>
            <div style={{ fontSize: 16, fontWeight: 800, margin: "8px 0 12px" }}>Creative to review</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 26 }}>
              {data.creatives.map((cr: any) => (
                <div key={cr.id} className="card" style={{ padding: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  {cr.assetUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={cr.assetUrl} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", border: "1px solid #232a3e" }} />}
                  <div style={{ minWidth: 0, flex: "1 1 260px" }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cr.copy?.headline || "New creative"}</div>
                    {cr.copy?.primaryText && <div style={{ fontSize: 12, color: "#aab7cf", marginTop: 3, lineHeight: 1.4 }}>{cr.copy.primaryText}</div>}
                    {cr.approvalStatus === "changes_requested" && cr.clientNote && <div style={{ fontSize: 11.5, color: "#f6c453", marginTop: 4 }}>Your note: {cr.clientNote}</div>}
                  </div>
                  {cr.approvalStatus === "pending" ? (
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button className="btn" disabled={busy} onClick={() => approve(cr.id)} style={{ padding: "7px 12px", fontSize: 12.5 }}>Approve</button>
                      <button className="btn-ghost btn" disabled={busy} onClick={() => requestChanges(cr.id)} style={{ padding: "7px 12px", fontSize: 12.5 }}>Request changes</button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", color: cr.approvalStatus === "approved" ? "#34d399" : "#f6c453", flexShrink: 0 }}>{cr.approvalStatus === "approved" ? "✓ Approved" : "Changes requested"}</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Messages with your team */}
        <div style={{ fontSize: 16, fontWeight: 800, margin: "8px 0 12px" }}>Messages</div>
        <div className="card" style={{ padding: 14, marginBottom: 26 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflow: "auto", marginBottom: 12 }}>
            {(!data.messages || data.messages.length === 0) ? (
              <div style={{ color: "#8b97b3", fontSize: 13 }}>Message your AdSpark team here - questions, creative direction, anything.</div>
            ) : data.messages.map((m: any) => (
              <div key={m.id} style={{ alignSelf: m.from === "client" ? "flex-end" : "flex-start", maxWidth: "80%", padding: "8px 12px", borderRadius: 10, background: m.from === "client" ? "linear-gradient(135deg,#7c5cff,#4f8cff)" : "#0a0e1c", border: m.from === "client" ? "none" : "1px solid #1c2238", color: m.from === "client" ? "#fff" : "#cdd6ea", fontSize: 13, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>{m.text}</div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="in" value={msg} onChange={e => setMsg(e.target.value)} placeholder="Write a message…" onKeyDown={e => { if (e.key === "Enter") sendMessage(); }} />
            <button className="btn" disabled={busy || !msg.trim()} onClick={sendMessage} style={{ padding: "0 16px", whiteSpace: "nowrap" }}>Send</button>
          </div>
        </div>

        <div style={{ fontSize: 16, fontWeight: 800, margin: "8px 0 12px" }}>Reports</div>
        {(!data.reports || data.reports.length === 0) ? (
          <div className="card" style={{ padding: 18, color: "#8b97b3", fontSize: 13 }}>Your first performance report will appear here.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.reports.map((r: any) => (
              <a key={r.id} href={`/r/${r.id}?t=${r.token}`} target="_blank" rel="noreferrer" className="card" style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, textDecoration: "none" }}>
                <div><div style={{ fontSize: 13.5, fontWeight: 700 }}>{r.periodStart} → {r.periodEnd}</div><div style={{ fontSize: 11.5, color: "#8b97b3" }}>${(r.spendUsd || 0).toLocaleString()} spend · {r.roas}x ROAS</div></div>
                <span style={{ fontSize: 12, color: "#7c5cff", fontWeight: 700, flexShrink: 0 }}>Open ↗</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
