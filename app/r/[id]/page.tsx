"use client";
// app/r/[id]/page.tsx — PUBLIC, shareable client performance report (no login).
// Reads the report id from the path and the share token from ?t=.
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

const grad = { background: "linear-gradient(135deg,#7c5cff,#4f8cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } as React.CSSProperties;

export default function ReportPage() {
  const params = useParams();
  const search = useSearchParams();
  const id = String(params?.id || "");
  const token = search?.get("t") || "";
  const [report, setReport] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/report/${id}?t=${encodeURIComponent(token)}`);
        const j = await r.json();
        if (j.ok) setReport(j.report); else setErr(j.error);
      } catch (e: any) { setErr(e.message); }
    })();
  }, [id, token]);

  if (err) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#8b97b3", textAlign: "center", padding: 20 }}><div><div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>{err}</div></main>;
  if (!report) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#8b97b3" }}>Loading report…</main>;

  const m = report.metrics || {};
  const card = (label: string, value: any, accent?: boolean) => (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontSize: 11, color: "#8b97b3", textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, marginTop: 4, color: accent ? "#34d399" : undefined }}>{value}</div>
    </div>
  );

  return (
    <main>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ fontWeight: 900, fontSize: 20 }}><span style={grad}>AdSpark AI</span></div>
        <div style={{ fontSize: 12, color: "#8b97b3" }}>{report.periodStart} → {report.periodEnd}</div>
      </header>

      <section style={{ maxWidth: 900, margin: "0 auto", padding: "20px 22px 60px" }}>
        <div style={{ fontSize: 12, letterSpacing: 1.5, color: "#7c5cff", textTransform: "uppercase", fontWeight: 800, marginBottom: 8 }}>Performance report</div>
        <h1 style={{ fontSize: 30, fontWeight: 900, margin: "0 0 14px" }}>{report.clientName}</h1>
        <div className="card" style={{ padding: 18, fontSize: 15, color: "#c7d0e6", lineHeight: 1.6, marginBottom: 22 }}>{report.summary}</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 22 }}>
          {card("Ad spend", `$${(m.spendUsd ?? 0).toLocaleString()}`)}
          {card("Revenue", `$${(m.revenueUsd ?? 0).toLocaleString()}`)}
          {card("ROAS", `${m.roas ?? 0}x`, true)}
          {card("Conversions", (m.conversions ?? 0).toLocaleString())}
          {card("CTR", `${m.ctr ?? 0}%`)}
          {card("Cost / conv.", `$${(m.cpaUsd ?? 0).toLocaleString()}`)}
        </div>

        {report.campaigns?.length > 0 && (
          <>
            <div style={{ fontSize: 16, fontWeight: 800, margin: "8px 0 12px" }}>Campaigns</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {report.campaigns.map((c: any, i: number) => (
                <div key={i} className="card" style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>{c.name}</div>
                    <div style={{ fontSize: 11.5, color: "#8b97b3" }}>{c.platform} · {c.status}</div>
                  </div>
                  {c.lastResults && <div style={{ textAlign: "right", fontSize: 12.5 }}><div style={{ color: "#34d399", fontWeight: 700 }}>{(c.lastResults.roas ?? 0)}x ROAS</div><div style={{ color: "#8b97b3" }}>${(c.lastResults.spendUsd ?? 0).toLocaleString()} spend</div></div>}
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: 36, color: "#5b6680", fontSize: 12.5 }}>
          Managed by <b style={{ color: "#9aa6c2" }}>AdSpark AI</b> · questions? Just reply to your report email.
        </div>
      </section>
    </main>
  );
}
