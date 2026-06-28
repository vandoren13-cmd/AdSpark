import React from "react";
import { PLAN_LIST } from "@/lib/plans";
import { PageView } from "@/lib/PageView";

const grad = { background: "linear-gradient(135deg,#7c5cff,#4f8cff,#7c5cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } as React.CSSProperties;

export default function Landing() {
  return (
    <main>
      <PageView name="home" />
      {/* Nav */}
      <header className="nav-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontWeight: 900, fontSize: 20 }}><span style={grad} className="grad-animate">AdSpark AI</span></div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="/done-for-you" className="btn-ghost btn hide-sm" style={{ padding: "8px 14px" }}>Done-for-you</a>
          <a href="/login" className="btn-ghost btn" style={{ padding: "8px 14px" }}>Sign in</a>
          <a href="/login" className="btn" style={{ padding: "8px 16px" }}>Start free</a>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 840, margin: "0 auto", padding: "clamp(40px,9vw,72px) 22px 40px", textAlign: "center" }}>
        <div className="anim anim-1" style={{ fontSize: 12, letterSpacing: 2, color: "#8b97b3", textTransform: "uppercase", marginBottom: 14 }}>AI ad creative · in seconds</div>
        <h1 className="anim anim-2" style={{ fontSize: "clamp(32px,7vw,52px)", lineHeight: 1.08, margin: "0 0 16px", fontWeight: 900 }}>
          Scroll-stopping ads,<br /><span style={grad} className="grad-animate">generated for every platform</span>
        </h1>
        <p className="anim anim-3" style={{ fontSize: "clamp(15px,2.4vw,18px)", color: "#9aa6c2", lineHeight: 1.6, maxWidth: 640, margin: "0 auto 26px" }}>
          Describe your product — or paste a URL — and AdSpark generates platform-native copy, AI images, and <b style={{ color: "#c7d0e6" }}>AI video ads</b> in seconds. Built for Instagram, TikTok, Facebook, LinkedIn and more.
        </p>
        <div className="anim anim-4">
          <a href="/login" className="btn shine-cta" style={{ padding: "14px 28px", fontSize: 16 }}>Start with 5 free generations →</a>
          <div style={{ fontSize: 12.5, color: "#6b7690", marginTop: 12 }}>No credit card required · copy + images + video</div>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "10px 22px 50px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {[
          ["⚡", "Copy, images & video", "Headlines, captions, hashtags and CTAs from a top-tier AI copywriter — plus matching AI images and avatar/UGC or cinematic video ads."],
          ["🔗", "Paste a URL → ads", "Drop in a product or store link and AdSpark builds the brief and the creative automatically. Enhance any image in one click."],
          ["📈", "Built for volume", "Spin up variations per campaign, A/B test what works, and ship to Meta, TikTok and Google. Plans that scale with you."],
        ].map(([icon, t, d], i) => (
          <div key={t} className={`card hover-pop anim anim-${i + 2}`} style={{ padding: 22 }}>
            <div className="float" style={{ fontSize: 28, marginBottom: 10, display: "inline-block" }}>{icon}</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{t}</div>
            <div style={{ fontSize: 13.5, color: "#9aa6c2", lineHeight: 1.55 }}>{d}</div>
          </div>
        ))}
      </section>

      {/* Pricing (self-serve — primary) */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 22px 30px" }}>
        <h2 className="anim anim-1" style={{ textAlign: "center", fontSize: "clamp(24px,5vw,32px)", fontWeight: 900, margin: "0 0 8px" }}>Simple, scalable pricing</h2>
        <p className="anim anim-2" style={{ textAlign: "center", color: "#9aa6c2", marginTop: 0, marginBottom: 30 }}>Start free. Upgrade anytime. Every plan includes copy, images and video.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {PLAN_LIST.map((p, i) => (
            <div key={p.id} className={`card hover-pop anim anim-${i + 2}`} style={{ padding: 22, border: p.id === "pro" ? "1.5px solid #7c5cff" : undefined, position: "relative", boxShadow: p.id === "pro" ? "0 0 40px #7c5cff22" : undefined }}>
              {p.id === "pro" && <div style={{ position: "absolute", top: -10, left: 22, background: "linear-gradient(135deg,#7c5cff,#4f8cff)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20 }}>MOST POPULAR</div>}
              <div style={{ fontSize: 15, fontWeight: 800 }}>{p.name}</div>
              <div style={{ fontSize: 32, fontWeight: 900, margin: "6px 0" }}>${p.priceUsd}<span style={{ fontSize: 13, color: "#8b97b3", fontWeight: 600 }}>{p.priceUsd ? "/mo" : ""}</span></div>
              <div style={{ fontSize: 12.5, color: "#9aa6c2", minHeight: 34, lineHeight: 1.4 }}>{p.blurb}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "12px 0", fontSize: 13, color: "#c7d0e6", display: "flex", flexDirection: "column", gap: 6 }}>
                <li>✓ {p.quota.toLocaleString()} generations / mo</li>
                <li>✓ {p.variants} copy variations each</li>
                <li>✓ {p.images} AI image{p.images > 1 ? "s" : ""} each</li>
                <li>✓ {p.videos} AI video{p.videos > 1 ? "s" : ""} / mo</li>
              </ul>
              <a href="/login" className="btn" style={{ width: "100%", background: p.id === "pro" ? undefined : "#1a2138" }}>{p.priceUsd ? "Choose" : "Start free"}</a>
            </div>
          ))}
        </div>
      </section>

      {/* Done-for-you — secondary, observable option */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 22px 50px" }}>
        <div className="card anim anim-1" style={{ padding: "16px 20px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 13.5, color: "#9aa6c2" }}>
            <b style={{ color: "#c7d0e6" }}>Rather not DIY?</b> Switch on the full suite and we run your ads end-to-end — flat price, no spend fees. You can turn it on right from your account.
          </div>
          <a href="/done-for-you" className="btn-ghost btn" style={{ padding: "9px 16px", fontSize: 13.5, whiteSpace: "nowrap" }}>Explore done-for-you →</a>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "10px 22px 60px" }}>
        <h2 className="anim anim-1" style={{ textAlign: "center", fontSize: "clamp(22px,5vw,28px)", fontWeight: 900, margin: "0 0 24px" }}>Questions</h2>
        {[
          ["What can I make on a self-serve plan?", "Platform-native ad copy, AI images, and AI video ads (avatar/UGC or cinematic) — plus paste-a-URL brief import and one-click image enhancement. Everything downloads ready to ship."],
          ["Do you charge a percentage of my ad spend?", "Never. Self-serve plans are flat monthly. (A spend fee is the #1 complaint about tools like Zeely — we don't do it.)"],
          ["Can you run the ads for me instead?", "Yes — the full done-for-you suite is an option you can switch on from your account. We build, launch and report end-to-end, flat price, and you track it all in your portal."],
          ["Which platforms do you support?", "Meta (Facebook/Instagram), TikTok and Google — native integrations. Copy via Claude, images and video via the latest models."],
          ["Is the AI creative compliant?", "Every asset is labeled AI-generated and carries a compliance record, built to meet current FTC and platform (Meta/TikTok/Google) disclosure requirements."],
        ].map(([q, a], i) => (
          <div key={q} className={`card anim anim-${Math.min(i + 1, 6)}`} style={{ padding: 18, marginBottom: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>{q}</div>
            <div style={{ fontSize: 13.5, color: "#9aa6c2", lineHeight: 1.6 }}>{a}</div>
          </div>
        ))}
      </section>

      <footer style={{ textAlign: "center", padding: "30px 20px", color: "#5b6680", fontSize: 12.5, borderTop: "1px solid #161c2e" }}>
        <div style={{ marginBottom: 8 }}>
          <a href="/done-for-you" style={{ color: "#8b97b3", margin: "0 8px" }}>Done-for-you</a>·
          <a href="/login" style={{ color: "#8b97b3", margin: "0 8px" }}>Sign in</a>·
          <a href="/terms" style={{ color: "#8b97b3", margin: "0 8px" }}>Terms</a>·
          <a href="/privacy" style={{ color: "#8b97b3", margin: "0 8px" }}>Privacy</a>
        </div>
        © AdSpark AI · A VanDoren-EMPIRE company
      </footer>
    </main>
  );
}
