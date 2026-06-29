"use client";
import React, { useState } from "react";
import { SERVICE_TIERS } from "@/lib/plans";
import { PageView } from "@/lib/PageView";
import { Logo } from "@/lib/Logo";

const grad = { background: "linear-gradient(135deg,#7c5cff,#4f8cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } as React.CSSProperties;
const label: React.CSSProperties = { fontSize: 11, color: "#8b97b3", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5, display: "block" };

export default function DoneForYou() {
  const [form, setForm] = useState({ name: "", email: "", company: "", website: "", monthlySpend: "", tier: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(tier?: string) {
    setErr(null);
    if (!form.email.trim()) { setErr("Please enter your email so we can reach you."); return; }
    setBusy(true);
    try {
      const payload = { ...form, tier: tier || form.tier, source: "done-for-you" };
      const r = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Failed to submit");
      setDone(true);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <main>
      <div className="aurora" aria-hidden="true" />
      <PageView name="done-for-you" />
      {/* Nav */}
      <header className="nav-wrap glass" style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 22px", borderLeft: 0, borderRight: 0, borderTop: 0 }}>
        <a href="/" style={{ textDecoration: "none" }}><Logo size={19} /></a>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/login" className="btn-ghost btn" style={{ padding: "8px 14px" }}>Sign in</a>
          <a href="#apply" className="btn" style={{ padding: "8px 16px" }}>Apply</a>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "clamp(36px,8vw,56px) 22px 32px", textAlign: "center" }}>
        <div className="anim anim-1" style={{ fontSize: 12, letterSpacing: 2, color: "#8b97b3", textTransform: "uppercase", marginBottom: 14 }}>Done-for-you ad management</div>
        <h1 className="anim anim-2" style={{ fontSize: "clamp(30px,6.5vw,44px)", lineHeight: 1.12, margin: "0 0 16px", fontWeight: 900 }}>
          We run your ads <span style={grad} className="grad-animate">end-to-end</span>. You never touch the account.
        </h1>
        <p className="anim anim-3" style={{ fontSize: "clamp(15px,2.4vw,18px)", color: "#9aa6c2", lineHeight: 1.6, maxWidth: 640, margin: "0 auto 10px" }}>
          AI-built creative, human strategy, weekly reporting. One flat monthly price - <b style={{ color: "#c7d0e6" }}> no percentage of your ad spend, no surprises.</b>
        </p>
      </section>

      {/* Trust band - the Zeely wedge */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 22px 36px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {[
          ["No spend fees", "Flat retainer, separate from your ad budget. We never take a cut of your spend."],
          ["Truly done-for-you", "You don't pick creatives, set budgets, or read dashboards. We do all of it."],
          ["No surprises", "Transparent pricing, plain-English weekly reports, cancel anytime."],
        ].map(([t, d]) => (
          <div key={t} className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>✓ {t}</div>
            <div style={{ fontSize: 13, color: "#9aa6c2", lineHeight: 1.5 }}>{d}</div>
          </div>
        ))}
      </section>

      {/* Service tiers */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "10px 22px 24px" }}>
        <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 900, margin: "0 0 6px" }}>Flat-price plans</h2>
        <p style={{ textAlign: "center", color: "#9aa6c2", marginTop: 0, marginBottom: 26 }}>Pick the scope that fits your spend. We handle the rest.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {SERVICE_TIERS.map(t => (
            <div key={t.id} className="card" style={{ padding: 22, border: t.popular ? "1.5px solid #7c5cff" : undefined, position: "relative" }}>
              {t.popular && <div style={{ position: "absolute", top: -10, left: 22, background: "linear-gradient(135deg,#7c5cff,#4f8cff)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20 }}>MOST POPULAR</div>}
              <div style={{ fontSize: 16, fontWeight: 800 }}>{t.name}</div>
              <div style={{ fontSize: 32, fontWeight: 900, margin: "6px 0" }}>${t.priceUsd.toLocaleString()}<span style={{ fontSize: 13, color: "#8b97b3", fontWeight: 600 }}>/mo</span></div>
              <div style={{ fontSize: 12.5, color: "#9aa6c2", minHeight: 36, lineHeight: 1.4 }}>{t.tagline}</div>
              <div style={{ fontSize: 11.5, color: "#7c5cff", fontWeight: 700, margin: "6px 0 10px" }}>{t.targetSpend}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 14px", fontSize: 13, color: "#c7d0e6", display: "flex", flexDirection: "column", gap: 6 }}>
                {t.features.map(f => <li key={f}>✓ {f}</li>)}
              </ul>
              <a href="#apply" onClick={() => set("tier", t.name)} className="btn" style={{ width: "100%", background: t.popular ? undefined : "#1a2138" }}>Apply for {t.name}</a>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", fontSize: 12.5, color: "#6b7690", marginTop: 14 }}>
          Prefer to run ads yourself? <a href="/login" style={{ color: "#7c5cff" }}>Use the self-serve generator →</a>
        </div>
      </section>

      {/* Apply form */}
      <section id="apply" style={{ maxWidth: 620, margin: "0 auto", padding: "30px 22px 70px" }}>
        <div className="card" style={{ padding: 24 }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Got it - we'll be in touch.</div>
              <div style={{ fontSize: 14, color: "#9aa6c2" }}>We'll review your details and reach out at <b style={{ color: "#c7d0e6" }}>{form.email}</b> within one business day with 3 ad concepts we'd test for you.</div>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>Apply to work with us</h2>
              <p style={{ fontSize: 13.5, color: "#9aa6c2", margin: "0 0 18px" }}>Tell us a bit about your business. We'll reply with a free teardown of 3 ad concepts.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={label}>Name</label><input className="in" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Your name" /></div>
                <div><label style={label}>Email *</label><input className="in" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@company.com" /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={label}>Company</label><input className="in" value={form.company} onChange={e => set("company", e.target.value)} placeholder="Company / brand" /></div>
                <div><label style={label}>Website</label><input className="in" value={form.website} onChange={e => set("website", e.target.value)} placeholder="yoursite.com" /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={label}>Monthly ad spend</label>
                  <select className="in" value={form.monthlySpend} onChange={e => set("monthlySpend", e.target.value)}>
                    <option value="">Select…</option>
                    <option>Under $500/mo</option><option>$500 - $2K/mo</option><option>$2K - $8K/mo</option><option>$8K+/mo</option>
                  </select>
                </div>
                <div><label style={label}>Interested in</label>
                  <select className="in" value={form.tier} onChange={e => set("tier", e.target.value)}>
                    <option value="">Not sure yet</option>
                    {SERVICE_TIERS.map(t => <option key={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}><label style={label}>What are you advertising?</label>
                <textarea className="in" rows={3} value={form.message} onChange={e => set("message", e.target.value)} placeholder="Product/offer, goals, anything we should know…" style={{ resize: "vertical" }} />
              </div>
              {err && <div style={{ color: "#ff6b6b", fontSize: 12.5, marginBottom: 10 }}>{err}</div>}
              <button className="btn" onClick={() => submit()} disabled={busy} style={{ width: "100%" }}>{busy ? "Submitting…" : "Get my free ad teardown →"}</button>
            </>
          )}
        </div>
      </section>

      <footer style={{ textAlign: "center", padding: "30px 20px", color: "#5b6680", fontSize: 12.5, borderTop: "1px solid #161c2e" }}>
        © 2026 AdSpark AI · AI ad creative, on autopilot.
      </footer>
    </main>
  );
}
