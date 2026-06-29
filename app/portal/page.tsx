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
