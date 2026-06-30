import React from "react";
import { PLAN_LIST } from "@/lib/plans";
import { PageView } from "@/lib/PageView";
import { Reveal } from "@/lib/Reveal";
import { Logo } from "@/lib/Logo";

const grad = { background: "linear-gradient(135deg,#8b5cff,#4f8cff,#ff7a59)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } as React.CSSProperties;
const blueGrad: React.CSSProperties = { background: "linear-gradient(135deg,#37d5ff,#8b5cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" };
const muted: React.CSSProperties = { color: "#aab7cf" };
const PLATFORMS = ["Meta", "Instagram", "TikTok", "Facebook", "Google", "YouTube", "LinkedIn", "Pinterest"];

// Deterministic spark-particle field (fixed positions → no hydration mismatch).
const SPARKS = [
  { l: 8, d: 0.0, t: 7.5 }, { l: 19, d: 2.1, t: 9.0 }, { l: 31, d: 4.0, t: 8.0 },
  { l: 44, d: 1.2, t: 10.0 }, { l: 57, d: 3.3, t: 7.0 }, { l: 66, d: 0.6, t: 9.5 },
  { l: 78, d: 2.7, t: 8.5 }, { l: 88, d: 4.6, t: 7.8 }, { l: 95, d: 1.8, t: 10.5 },
  { l: 13, d: 5.2, t: 8.8 }, { l: 50, d: 6.0, t: 9.2 }, { l: 72, d: 5.6, t: 7.4 },
];
function Sparks() {
  return (
    <div className="sparks" aria-hidden="true">
      {SPARKS.map((s, i) => (
        <span key={i} className="spark" style={{ left: `${s.l}%`, bottom: "10%", animationDuration: `${s.t}s`, animationDelay: `${s.d}s` }} />
      ))}
    </div>
  );
}

// ── Hero "AI Creative Studio" mockup (CSS/SVG; depicts the real product) ──
function StudioMock() {
  const angles = ["Save time", "Boost curb appeal", "Reliable weekly service", "First-time offer"];
  const tabs = ["Meta", "TikTok", "Google", "YouTube", "Instagram"];
  const outputs: [string, string, string][] = [
    ["Meta · Image Ad", "A better-looking lawn without losing your weekend.", "Learn More"],
    ["TikTok · Hook", "Your lawn might be costing your home its curb appeal.", "Watch"],
    ["Google · Search", "Reliable Lawn Care Near You - Free Quote", "Get Quote"],
  ];
  return (
    <div className="gborder float" style={{ borderRadius: 20, padding: 1 }}>
      <div className="glass" style={{ borderRadius: 20, padding: 16 }}>
        {/* window chrome */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <span style={{ width: 9, height: 9, borderRadius: 9, background: "#ff5f57" }} />
          <span style={{ width: 9, height: 9, borderRadius: 9, background: "#febc2e" }} />
          <span style={{ width: 9, height: 9, borderRadius: 9, background: "#28c840" }} />
          <span style={{ marginLeft: 8, fontSize: 11, color: "#6b7690" }}>AdSpark · AI Creative Studio</span>
          <span style={{ marginLeft: "auto" }} className="badge-ready">✦ Campaign Ready</span>
        </div>
        {/* prompt input */}
        <div className="in" style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: "#9aa6c2", marginBottom: 12 }}>
          <span style={{ color: "#8b5cff" }}>✦</span> Paste a product URL or describe your offer...
          <span className="btn btn-spark" style={{ marginLeft: "auto", padding: "5px 11px", fontSize: 11 }}>Generate</span>
        </div>
        {/* campaign name + angles */}
        <div style={{ fontSize: 10, color: "#8b97b3", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5 }}>Campaign</div>
        <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 9 }}>Premium Lawn Care for Busy Homeowners</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 13 }}>
          {angles.map((a) => <span key={a} className="chip" style={{ padding: "4px 9px", fontSize: 10.5 }}>{a}</span>)}
        </div>
        {/* platform tabs */}
        <div style={{ display: "flex", gap: 5, marginBottom: 12, overflow: "hidden" }}>
          {tabs.map((t, i) => <span key={t} className={`tab${i === 0 ? " on" : ""}`}>{t}</span>)}
        </div>
        {/* generated outputs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {/* video output card */}
          <div className="card" style={{ padding: 0, overflow: "hidden", gridColumn: "1 / -1" }}>
            <div className="mock-img" style={{ height: 92, position: "relative", display: "grid", placeItems: "center" }}>
              <div style={{ width: 0, height: 0, borderLeft: "16px solid #fff", borderTop: "11px solid transparent", borderBottom: "11px solid transparent", marginLeft: 4, opacity: 0.92 }} />
              <span style={{ position: "absolute", top: 6, left: 6, fontSize: 9, fontWeight: 700, color: "#c7d0e6", background: "#0a0e1ccc", border: "1px solid #2c3450", borderRadius: 5, padding: "2px 6px" }}>✦ AI video · 0:15</span>
              <span style={{ position: "absolute", bottom: 6, right: 8, fontSize: 10, color: "#cbd6ff" }}>Before → after transformation</span>
            </div>
          </div>
          {outputs.slice(0, 2).map(([badge, copy, cta]) => (
            <div key={badge} className="card" style={{ padding: 10 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: "#9aa6c2", marginBottom: 6 }}>{badge}</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, lineHeight: 1.35, marginBottom: 8, color: "#e7ecf5" }}>{copy}</div>
              <span style={{ fontSize: 9.5, fontWeight: 700, background: "#7c5cff22", border: "1px solid #7c5cff55", color: "#cbbcff", borderRadius: 6, padding: "2px 8px" }}>{cta} →</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureMock({ kind }: { kind: "studio" | "url" | "insights" }) {
  if (kind === "studio") return (
    <div className="gborder" style={{ borderRadius: 16, padding: 1 }}><div className="glass" style={{ borderRadius: 16, padding: 14 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {["Copy", "Image", "Video"].map((t, i) => <span key={t} className="chip" style={{ padding: "5px 11px", fontSize: 11.5, background: i === 2 ? "#7c5cff22" : undefined, borderColor: i === 2 ? "#7c5cff55" : undefined, color: i === 2 ? "#cbbcff" : undefined }}>{t}</span>)}
      </div>
      <div className="mock-img" style={{ height: 130, borderRadius: 10, display: "grid", placeItems: "center", position: "relative" }}>
        <div style={{ width: 0, height: 0, borderLeft: "18px solid #fff", borderTop: "12px solid transparent", borderBottom: "12px solid transparent", marginLeft: 5, opacity: 0.9 }} />
        <span style={{ position: "absolute", bottom: 8, left: 8, fontSize: 9.5, fontWeight: 700, color: "#c7d0e6", background: "#0a0e1ccc", border: "1px solid #2c3450", borderRadius: 5, padding: "2px 6px" }}>✦ AI-generated</span>
      </div>
    </div></div>
  );
  if (kind === "url") return (
    <div className="gborder" style={{ borderRadius: 16, padding: 1 }}><div className="glass" style={{ borderRadius: 16, padding: 16 }}>
      <div className="in" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#9aa6c2" }}><span style={{ color: "#8b5cff" }}>🔗</span> yourstore.com/product</div>
      <svg viewBox="0 0 200 26" style={{ width: "100%", height: 22, margin: "4px 0" }} aria-hidden="true">
        <path className="dash" d="M40 2 C40 18, 100 8, 100 22" /><path className="dash" d="M100 2 L100 22" /><path className="dash" d="M160 2 C160 18, 100 8, 100 22" />
      </svg>
      <div className="card" style={{ padding: 12 }}>
        <div style={{ fontSize: 11, color: "#8b97b3", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 7 }}>Brief - auto-filled</div>
        <div className="shimmer-line" style={{ height: 8, marginBottom: 6 }} />
        <div className="shimmer-line" style={{ height: 8, width: "85%", marginBottom: 6 }} />
        <div className="shimmer-line" style={{ height: 8, width: "55%" }} />
      </div>
    </div></div>
  );
  return (
    <div className="gborder" style={{ borderRadius: 16, padding: 1 }}><div className="glass" style={{ borderRadius: 16, padding: 16 }}>
      <div style={{ fontSize: 11, color: "#8b97b3", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>What's converting · by hook</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120 }}>
        {[["UGC", 92], ["Social proof", 74], ["Urgency", 58], ["Curiosity", 40]].map(([l, h]) => (
          <div key={l as string} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: `${h as number}%`, borderRadius: "6px 6px 0 0", background: "linear-gradient(180deg,#8b5cff,#37d5ff)" }} />
            <div style={{ fontSize: 10, color: "#8b97b3", marginTop: 6 }}>{l}</div>
          </div>
        ))}
      </div>
    </div></div>
  );
}

const FEATURES: [string, string, string][] = [
  ["📝", "Ad copy", "Headlines, primary text, captions, hashtags and CTAs - written platform-native by Claude."],
  ["🪝", "Scroll-stopping hooks", "Opening lines built to stop the scroll on social feeds and short-form video."],
  ["🖼️", "AI images", "Product scenes, lifestyle creative and promo graphics - generate, then enhance in one click."],
  ["🎬", "Real AI video", "Actual rendered video ads - avatar/UGC talking-head or cinematic product video, not just scripts."],
  ["🧩", "Platform variations", "Adapt one idea for Meta, TikTok, Google, YouTube, Instagram, Facebook, LinkedIn and Pinterest."],
  ["🧪", "Creative testing angles", "Explore different benefits, offers, audiences and emotional angles to test faster."],
];

const STEPS: [string, string, string][] = [
  ["01", "Add your product, URL, or idea", "Paste a product or store link and AdSpark builds the brief for you - or just describe what you sell."],
  ["02", "Let AdSpark build the campaign", "Copy, AI images, real video, hooks and platform-specific variations - auto-tagged and ready to ship."],
  ["03", "Launch, test, improve", "Ship to Meta, TikTok and Google, then spin up new variations as you learn what your audience responds to."],
];

const VARIATIONS = ["Pain point", "Benefit-led", "Before & after", "Founder story", "Social proof", "Urgency", "Educational", "Comparison", "Lifestyle", "Problem-solution", "Product transformation", "Audience segment"];

const USE_CASES: [string, string, string][] = [
  ["🛍️", "E-commerce shops", "Turn product pages into ad copy, lifestyle creative, short video hooks and platform-ready variations."],
  ["🔧", "Local service businesses", "Seasonal offers, appointment bookings, promotions and before-and-after transformations."],
  ["🏢", "Agencies", "Generate campaign concepts, client variations, hooks and creative testing angles faster."],
  ["🎨", "Creators", "Turn digital products, courses and offers into polished ads across social platforms."],
  ["🎯", "Coaches & consultants", "Clear positioning, lead-gen ads, webinar promos and offer-specific campaign angles."],
  ["🚀", "Startups", "Explain your product clearly, test messaging faster, and launch without a big marketing team."],
];

export default function Landing() {
  return (
    <main>
      <div className="aurora" aria-hidden="true" />
      <PageView name="home" />

      {/* Sticky glass nav */}
      <header className="nav-wrap glass" style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 22px", borderLeft: 0, borderRight: 0, borderTop: 0 }}>
        <a href="/" style={{ textDecoration: "none" }}><Logo size={19} /></a>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="#features" className="btn-ghost btn hide-sm" style={{ padding: "8px 14px", border: "none" }}>Features</a>
          <a href="#how" className="btn-ghost btn hide-sm" style={{ padding: "8px 14px", border: "none" }}>How it works</a>
          <a href="#pricing" className="btn-ghost btn hide-sm" style={{ padding: "8px 14px", border: "none" }}>Pricing</a>
          <a href="/done-for-you" className="btn-ghost btn hide-sm" style={{ padding: "8px 14px" }}>Done-for-you</a>
          <a href="/login" className="btn-ghost btn" style={{ padding: "8px 14px" }}>Sign in</a>
          <a href="/login" className="btn btn-spark" style={{ padding: "8px 16px" }}>Start free</a>
        </div>
      </header>

      {/* Hero */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />
        <Sparks />
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "clamp(34px,7vw,76px) 22px 34px", display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 44, alignItems: "center" }}>
          <div>
            <div className="anim anim-1 eyebrow" style={{ marginBottom: 16 }}>AI campaign engine for faster growth</div>
            <h1 className="anim anim-2" style={{ fontSize: "clamp(34px,6vw,60px)", lineHeight: 1.04, margin: "0 0 18px", fontWeight: 900, letterSpacing: -0.6 }}>
              Turn any product, URL or idea into a <span style={grad} className="grad-animate">complete ad campaign</span>
            </h1>
            <p className="anim anim-3" style={{ fontSize: "clamp(15px,2.2vw,18px)", color: "#aab7cf", lineHeight: 1.62, maxWidth: 540, margin: "0 0 26px" }}>
              AdSpark creates ad copy, AI images, <b style={{ color: "#e7ecf5" }}>real AI video</b>, hooks and platform-ready variations in minutes - so you stop starting from scratch and start launching with confidence. Ship to Meta, TikTok and Google, or let us run it all for you.
            </p>
            <div className="anim anim-4" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="/login" className="btn btn-spark shine-cta" style={{ padding: "14px 26px", fontSize: 16 }}>Generate my first campaign →</a>
              <a href="#features" className="btn-ghost btn" style={{ padding: "14px 22px", fontSize: 16 }}>See what it makes</a>
            </div>
            <div className="anim anim-5" style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", marginTop: 18 }}>
              {["No design experience needed", "Copy · images · video · variations", "Start free - no card"].map((t) => (
                <span key={t} style={{ fontSize: 12.5, color: "#8b97b3", display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ color: "#37d5ff" }}>✓</span>{t}</span>
              ))}
            </div>
          </div>
          <div className="anim anim-3"><StudioMock /></div>
        </div>
      </section>

      {/* Platform trust strip */}
      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "6px 22px 44px" }}>
        <div style={{ textAlign: "center", fontSize: 12, color: "#6b7690", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>Create ads for the platforms where your customers already are</div>
        <div className="marquee">
          <div className="marquee-track">
            {[...PLATFORMS, ...PLATFORMS].map((p, i) => <span key={i} className="chip pulse-chip">{p}</span>)}
          </div>
        </div>
      </section>

      {/* What AdSpark does */}
      <section id="features" style={{ maxWidth: 1080, margin: "0 auto", padding: "26px 22px 20px" }}>
        <Reveal><div style={{ textAlign: "center", marginBottom: 8 }}><span className="eyebrow">One AI engine</span></div></Reveal>
        <Reveal delay={50}><h2 style={{ textAlign: "center", fontSize: "clamp(24px,5vw,36px)", fontWeight: 900, margin: "0 0 10px" }}>Everything behind a better ad - in one place</h2></Reveal>
        <Reveal delay={100}><p style={{ textAlign: "center", ...muted, maxWidth: 600, margin: "0 auto 30px", lineHeight: 1.6 }}>Generate the core pieces of a campaign from one simple starting point - no full creative team required.</p></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {FEATURES.map(([icon, t, d], i) => (
            <Reveal key={t} delay={(i % 3) * 80} style={{ height: "100%" }}>
              <div className="card hover-pop" style={{ padding: 22, height: "100%" }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>
                <div style={{ fontSize: 16.5, fontWeight: 800, marginBottom: 6 }}>{t}</div>
                <div style={{ fontSize: 13.5, ...muted, lineHeight: 1.55 }}>{d}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 22px 20px" }}>
        <Reveal><h2 style={{ textAlign: "center", fontSize: "clamp(24px,5vw,34px)", fontWeight: 900, margin: "0 0 30px" }}>From idea to campaign in three steps</h2></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {STEPS.map(([n, t, d], i) => (
            <Reveal key={n} delay={i * 90}>
              <div className="card hover-pop" style={{ padding: 22, height: "100%" }}>
                <div style={{ fontSize: 14, fontWeight: 900, ...blueGrad }}>{n}</div>
                <div style={{ fontSize: 17, fontWeight: 800, margin: "8px 0 6px" }}>{t}</div>
                <div style={{ fontSize: 13.5, ...muted, lineHeight: 1.55 }}>{d}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Feature showcase with media */}
      <section style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 22px 20px", display: "flex", flexDirection: "column", gap: 30 }}>
        {([
          ["studio", "Your AI creative studio is always ready", "Copy, AI images and real AI video - avatar/UGC or cinematic - generated together and labeled for compliance. The work that usually needs a copywriter, designer and editor, in one place.", "Open the studio"],
          ["url", "Paste a URL. Get a campaign.", "Your website already holds the raw material for stronger ads. Drop in a product, service or offer page and AdSpark scrapes it, writes the brief, and produces the creative - what you sell, who it's for, the hooks, the angles, the variations.", "Turn my URL into ads"],
          ["insights", "Test smarter. Learn faster.", "Every asset is auto-tagged by hook, format and vertical, so your wins compound into a benchmark only you have. Refresh tired ads, test new audiences, and adapt one idea across every platform.", "See how it learns"],
        ] as const).map(([kind, t, d, cta], i) => (
          <Reveal key={kind}>
            <div className="feature-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, alignItems: "center" }}>
              <div style={{ order: i % 2 === 1 ? 2 : 1 }}>
                <h3 style={{ fontSize: "clamp(20px,3.6vw,28px)", fontWeight: 900, margin: "0 0 12px", lineHeight: 1.12 }}>{t}</h3>
                <p style={{ fontSize: 14.5, ...muted, lineHeight: 1.62, margin: "0 0 16px" }}>{d}</p>
                <a href="/login" className="btn-ghost btn" style={{ padding: "10px 18px", fontSize: 14 }}>{cta} →</a>
              </div>
              <div style={{ order: i % 2 === 1 ? 1 : 2 }}><FeatureMock kind={kind} /></div>
            </div>
          </Reveal>
        ))}
      </section>

      {/* AI ad variations */}
      <section style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 22px 20px" }}>
        <Reveal><h2 style={{ textAlign: "center", fontSize: "clamp(22px,4.6vw,32px)", fontWeight: 900, margin: "0 0 10px" }}>More ad variations, without more work</h2></Reveal>
        <Reveal delay={60}><p style={{ textAlign: "center", ...muted, maxWidth: 600, margin: "0 auto 24px", lineHeight: 1.6 }}>The best campaign is rarely the first version. Generate multiple angles to test different ways to sell the same offer.</p></Reveal>
        <Reveal delay={100}>
          <div className="card" style={{ padding: 22, display: "flex", flexWrap: "wrap", gap: 9, justifyContent: "center" }}>
            {VARIATIONS.map((v) => <span key={v} className="chip">{v}</span>)}
          </div>
        </Reveal>
      </section>

      {/* Honest performance / trust band */}
      <section style={{ maxWidth: 1040, margin: "0 auto", padding: "30px 22px" }}>
        <Reveal>
          <div className="card" style={{ padding: 22, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, textAlign: "center" }}>
            {[["Copy · Images · Video", "one studio"], ["Meta · TikTok · Google", "native launch"], ["Minutes", "not days or shoots"], ["$0", "fees on your ad spend"]].map(([a, b]) => (
              <div key={a}><div style={{ fontSize: "clamp(15px,2.4vw,19px)", fontWeight: 900 }}>{a}</div><div style={{ fontSize: 12, ...muted, marginTop: 4 }}>{b}</div></div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={80}>
          <p style={{ textAlign: "center", fontSize: 12.5, color: "#6b7690", maxWidth: 640, margin: "16px auto 0", lineHeight: 1.6 }}>
            Ad results depend on your offer, audience, budget, landing page and platform setup - no tool can guarantee performance. AdSpark gives you stronger creative, faster, so you have more to test and more ways to learn.
          </p>
        </Reveal>
      </section>

      {/* Use cases */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "30px 22px 20px" }}>
        <Reveal><h2 style={{ textAlign: "center", fontSize: "clamp(22px,4.6vw,32px)", fontWeight: 900, margin: "0 0 8px" }}>Built for better ads without a bigger team</h2></Reveal>
        <Reveal delay={60}><p style={{ textAlign: "center", ...muted, margin: "0 0 28px" }}>Whoever you are, you bring the product - AdSpark brings the campaign.</p></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {USE_CASES.map(([icon, t, d], i) => (
            <Reveal key={t} delay={(i % 3) * 80} style={{ height: "100%" }}>
              <div className="card hover-pop" style={{ padding: 20, height: "100%" }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: 15.5, fontWeight: 800, marginBottom: 5 }}>{t}</div>
                <div style={{ fontSize: 13, ...muted, lineHeight: 1.55 }}>{d}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ maxWidth: 1040, margin: "0 auto", padding: "44px 22px 24px" }}>
        <Reveal><h2 style={{ textAlign: "center", fontSize: "clamp(24px,5vw,34px)", fontWeight: 900, margin: "0 0 8px" }}>Choose the plan that fits your growth stage</h2></Reveal>
        <Reveal delay={60}><p style={{ textAlign: "center", ...muted, marginTop: 0, marginBottom: 30 }}>Start free. Every plan includes copy, images and video. No spend fees, cancel anytime.</p></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {PLAN_LIST.map((p, i) => (
            <Reveal key={p.id} delay={i * 80} style={{ height: "100%" }}>
              <div className={`card hover-pop${p.id === "pro" ? " gborder" : ""}`} style={{ padding: 22, position: "relative", height: "100%", boxShadow: p.id === "pro" ? "0 0 44px #8b5cff22" : undefined }}>
                {p.id === "pro" && <div style={{ position: "absolute", top: -10, left: 22, background: "var(--grad-spark)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20 }}>MOST POPULAR</div>}
                <div style={{ fontSize: 15, fontWeight: 800 }}>{p.name}</div>
                <div style={{ fontSize: 32, fontWeight: 900, margin: "6px 0" }}>${p.priceUsd}<span style={{ fontSize: 13, color: "#8b97b3", fontWeight: 600 }}>{p.priceUsd ? "/mo" : ""}</span></div>
                <div style={{ fontSize: 12.5, ...muted, minHeight: 34, lineHeight: 1.4 }}>{p.blurb}</div>
                <ul style={{ listStyle: "none", padding: 0, margin: "12px 0", fontSize: 13, color: "#c7d0e6", display: "flex", flexDirection: "column", gap: 6 }}>
                  <li>✓ {p.quota.toLocaleString()} generations / mo</li>
                  <li>✓ {p.variants} copy variations each</li>
                  <li>✓ {p.images} AI image{p.images > 1 ? "s" : ""} each</li>
                  <li>✓ {p.videos} AI video{p.videos > 1 ? "s" : ""} / mo</li>
                </ul>
                <a href="/login" className={`btn${p.id === "pro" ? " btn-spark" : ""}`} style={{ width: "100%", background: p.id === "pro" ? undefined : "#1a2138" }}>{p.priceUsd ? `Choose ${p.name}` : "Start free"}</a>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120}><p style={{ textAlign: "center", fontSize: 12.5, color: "#6b7690", marginTop: 18 }}>Simple plans. No confusing setup. Start small, create fast, and scale when you are ready.</p></Reveal>
      </section>

      {/* Done-for-you - the opt-in upgrade (two-sided model) */}
      <section style={{ maxWidth: 1040, margin: "0 auto", padding: "10px 22px 44px" }}>
        <Reveal>
          <div className="gborder" style={{ borderRadius: 18, padding: 1 }}>
            <div className="glass" style={{ borderRadius: 18, padding: "20px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
              <div style={{ maxWidth: 640 }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Prefer we run it?</div>
                <div style={{ fontSize: 15.5, color: "#e7ecf5", fontWeight: 700, marginBottom: 4 }}>Switch on the full done-for-you suite and we run everything end-to-end.</div>
                <div style={{ fontSize: 13.5, ...muted, lineHeight: 1.55 }}>We build the creative, launch and optimize on Meta, TikTok and Google, and send weekly reports - flat monthly price, no percentage of your ad spend. You track it all in your portal.</div>
              </div>
              <a href="/done-for-you" className="btn-ghost btn" style={{ padding: "11px 18px", fontSize: 14, whiteSpace: "nowrap" }}>Explore done-for-you →</a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 780, margin: "0 auto", padding: "10px 22px 50px" }}>
        <Reveal><h2 style={{ textAlign: "center", fontSize: "clamp(22px,5vw,30px)", fontWeight: 900, margin: "0 0 24px" }}>Questions before you spark your first campaign?</h2></Reveal>
        {[
          ["Do I need marketing experience?", "No. Describe your product or paste a URL and AdSpark moves you from a blank page to clear copy, visuals, hooks and campaign variations. You don't need to be a copywriter or designer."],
          ["Does it really create images and video?", "Yes - real, generated assets. AI images (with one-click enhancement) plus actual rendered video ads: avatar/UGC talking-head or cinematic product video. Not just scripts or storyboards."],
          ["Can I create ads for multiple platforms?", "Yes - Meta (Facebook/Instagram), TikTok, Google, YouTube, LinkedIn, Pinterest and more, each adapted to how that platform works."],
          ["Can I paste my website URL?", "Yes. Drop in a product, service, landing or offer page and AdSpark turns it into a brief, then into copy, hooks, visuals and platform variations automatically."],
          ["Do you charge a percentage of my ad spend?", "Never. Plans are flat monthly. (A spend fee is the #1 complaint about tools like Zeely - we don't do it.) Cancel anytime."],
          ["Can you run the ads for me instead?", "Yes - the full done-for-you suite is an option you switch on from your account. We build, launch and report end-to-end, and you track it all in your portal."],
          ["Will the ads be ready to run?", "AdSpark generates ready-to-use campaign assets, but always review final copy, visuals, targeting and claims against each platform's requirements before launching."],
          ["Does AdSpark guarantee better results?", "No tool can guarantee ad results - performance depends on your offer, audience, budget, targeting and landing page. AdSpark helps you create stronger creative faster, so you have more ideas to test and improve."],
        ].map(([q, a], i) => (
          <Reveal key={q} delay={i * 40}>
            <div className="card" style={{ padding: 18, marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>{q}</div>
              <div style={{ fontSize: 13.5, ...muted, lineHeight: 1.6 }}>{a}</div>
            </div>
          </Reveal>
        ))}
      </section>

      {/* Final CTA band */}
      <section style={{ maxWidth: 1040, margin: "0 auto", padding: "10px 22px 60px" }}>
        <Reveal>
          <div className="gborder" style={{ borderRadius: 22, padding: 1 }}>
            <div style={{ position: "relative", overflow: "hidden", borderRadius: 22, padding: "clamp(30px,5vw,52px) 22px", textAlign: "center", background: "radial-gradient(120% 140% at 50% 0%, #14193180, #0d1120)" }}>
              <Sparks />
              <h2 style={{ fontSize: "clamp(24px,5vw,38px)", fontWeight: 900, margin: "0 0 10px", position: "relative" }}>Your next campaign doesn't have to start from <span style={grad} className="grad-animate">scratch</span></h2>
              <p style={{ ...muted, fontSize: 15, margin: "0 0 22px", position: "relative" }}>Give AdSpark your product, URL or idea - get copy, creative, video and platform variations. Five free generations, no card.</p>
              <a href="/login" className="btn btn-spark shine-cta" style={{ padding: "15px 32px", fontSize: 16, position: "relative" }}>Create my first campaign →</a>
              <div style={{ fontSize: 12.5, color: "#6b7690", marginTop: 14, position: "relative" }}>No blank pages. No creative bottlenecks. No spend fees.</div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer style={{ borderTop: "1px solid #161c2e", padding: "28px 22px", maxWidth: 1040, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "space-between" }}>
        <Logo size={16} />
        <div style={{ fontSize: 12.5, color: "#8b97b3", display: "flex", gap: 16, flexWrap: "wrap" }}>
          <a href="#features" style={{ color: "#8b97b3" }}>Features</a>
          <a href="#pricing" style={{ color: "#8b97b3" }}>Pricing</a>
          <a href="/done-for-you" style={{ color: "#8b97b3" }}>Done-for-you</a>
          <a href="/login" style={{ color: "#8b97b3" }}>Sign in</a>
          <a href="/terms" style={{ color: "#8b97b3" }}>Terms</a>
          <a href="/privacy" style={{ color: "#8b97b3" }}>Privacy</a>
        </div>
        <div style={{ fontSize: 12, color: "#5b6680", width: "100%", textAlign: "center", marginTop: 6 }}>© 2026 AdSpark AI · Better ads. Faster launches. More confident marketing.</div>
      </footer>
    </main>
  );
}
