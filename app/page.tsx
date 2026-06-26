import React from "react";
import { PLAN_LIST } from "@/lib/plans";

const grad = { background: "linear-gradient(135deg,#7c5cff,#4f8cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } as React.CSSProperties;

export default function Landing() {
  return (
    <main>
      {/* Nav */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontWeight: 900, fontSize: 20 }}><span style={grad}>AdSpark AI</span></div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/login" className="btn-ghost btn" style={{ padding: "8px 14px" }}>Sign in</a>
          <a href="/login" className="btn" style={{ padding: "8px 16px" }}>Start free</a>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 820, margin: "0 auto", padding: "64px 22px 40px", textAlign: "center" }}>
        <div style={{ fontSize: 12, letterSpacing: 2, color: "#8b97b3", textTransform: "uppercase", marginBottom: 14 }}>AI ad creative · in seconds</div>
        <h1 style={{ fontSize: 46, lineHeight: 1.1, margin: "0 0 16px", fontWeight: 900 }}>
          Scroll-stopping ads, <span style={grad}>generated for every platform</span>
        </h1>
        <p style={{ fontSize: 17, color: "#9aa6c2", lineHeight: 1.6, maxWidth: 620, margin: "0 auto 26px" }}>
          Describe your product once. AdSpark writes platform-native ad copy, captions, hashtags and CTAs — and generates matching ad images — for Instagram, TikTok, Facebook, LinkedIn and more.
        </p>
        <a href="/login" className="btn" style={{ padding: "14px 26px", fontSize: 16 }}>Start with 5 free generations →</a>
        <div style={{ fontSize: 12.5, color: "#6b7690", marginTop: 12 }}>No credit card required.</div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "10px 22px 50px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {[
          ["⚡", "Copy that converts", "Headlines, primary text, captions, hashtags and CTAs — written by a top-tier AI copywriter, tuned to each platform."],
          ["🎨", "AI ad images", "On-brand, scroll-stopping visuals generated alongside the copy. Download and ship."],
          ["📈", "Built for volume", "Spin up multiple variations per campaign and A/B test what works. Quotas that scale with you."],
        ].map(([icon, t, d]) => (
          <div key={t} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{t}</div>
            <div style={{ fontSize: 13.5, color: "#9aa6c2", lineHeight: 1.55 }}>{d}</div>
          </div>
        ))}
      </section>

      {/* Pricing */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 22px 70px" }}>
        <h2 style={{ textAlign: "center", fontSize: 30, fontWeight: 900, margin: "0 0 8px" }}>Simple, scalable pricing</h2>
        <p style={{ textAlign: "center", color: "#9aa6c2", marginTop: 0, marginBottom: 30 }}>Start free. Upgrade when you're ready.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {PLAN_LIST.map(p => (
            <div key={p.id} className="card" style={{ padding: 20, border: p.id === "pro" ? "1.5px solid #7c5cff" : undefined, position: "relative" }}>
              {p.id === "pro" && <div style={{ position: "absolute", top: -10, left: 20, background: "linear-gradient(135deg,#7c5cff,#4f8cff)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20 }}>POPULAR</div>}
              <div style={{ fontSize: 15, fontWeight: 800 }}>{p.name}</div>
              <div style={{ fontSize: 30, fontWeight: 900, margin: "6px 0" }}>${p.priceUsd}<span style={{ fontSize: 13, color: "#8b97b3", fontWeight: 600 }}>{p.priceUsd ? "/mo" : ""}</span></div>
              <div style={{ fontSize: 12.5, color: "#9aa6c2", minHeight: 34, lineHeight: 1.4 }}>{p.blurb}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "12px 0", fontSize: 13, color: "#c7d0e6", display: "flex", flexDirection: "column", gap: 6 }}>
                <li>✓ {p.quota.toLocaleString()} generations / mo</li>
                <li>✓ {p.variants} copy variations each</li>
                <li>✓ {p.images} AI image{p.images > 1 ? "s" : ""} each</li>
              </ul>
              <a href="/login" className="btn" style={{ width: "100%", background: p.id === "pro" ? undefined : "#1a2138" }}>{p.priceUsd ? "Choose" : "Start free"}</a>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ textAlign: "center", padding: "30px 20px", color: "#5b6680", fontSize: 12.5, borderTop: "1px solid #161c2e" }}>
        © AdSpark AI · A VanDoren-EMPIRE company
      </footer>
    </main>
  );
}
