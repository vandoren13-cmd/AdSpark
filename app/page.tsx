import React from "react";
import { PLAN_LIST } from "@/lib/plans";
import { PageView } from "@/lib/PageView";
import { Reveal } from "@/lib/Reveal";
import { Logo } from "@/lib/Logo";

const grad = { background: "linear-gradient(135deg,#7c5cff,#4f8cff,#7c5cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } as React.CSSProperties;
const PLATFORMS = ["Meta", "Instagram", "TikTok", "Facebook", "Google", "YouTube", "LinkedIn", "Pinterest"];
const muted: React.CSSProperties = { color: "#9aa6c2" };

// ── Mock product "media" (CSS/SVG — depicts the real product, no external assets) ──
function HeroMock() {
  return (
    <div className="gborder float" style={{ borderRadius: 18, padding: 1 }}>
      <div className="glass" style={{ borderRadius: 18, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <span style={{ width: 9, height: 9, borderRadius: 9, background: "#ff5f57" }} />
          <span style={{ width: 9, height: 9, borderRadius: 9, background: "#febc2e" }} />
          <span style={{ width: 9, height: 9, borderRadius: 9, background: "#28c840" }} />
          <span style={{ marginLeft: 8, fontSize: 11, color: "#6b7690" }}>AdSpark · generate</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: "#8b97b3", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Brief</div>
            <div className="shimmer-line" style={{ height: 9, marginBottom: 7 }} />
            <div className="shimmer-line" style={{ height: 9, width: "80%", marginBottom: 7 }} />
            <div className="shimmer-line" style={{ height: 9, width: "60%", marginBottom: 14 }} />
            <div style={{ display: "flex", gap: 6 }}>
              <span className="chip" style={{ padding: "5px 10px", fontSize: 11 }}>Instagram</span>
              <span className="chip" style={{ padding: "5px 10px", fontSize: 11 }}>Bold</span>
            </div>
          </div>
          <div className="card" style={{ padding: 10, position: "relative" }}>
            <div className="mock-img" style={{ height: 96, borderRadius: 8, position: "relative" }}>
              <span style={{ position: "absolute", top: 6, left: 6, fontSize: 9, fontWeight: 700, color: "#c7d0e6", background: "#0a0e1ccc", border: "1px solid #2c3450", borderRadius: 5, padding: "2px 6px" }}>✦ AI</span>
              <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 22 }}>🎬</span>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 800, margin: "9px 0 5px" }}>Glow that lasts all day ✨</div>
            <div className="shimmer-line" style={{ height: 7, marginBottom: 5 }} />
            <div className="shimmer-line" style={{ height: 7, width: "70%", marginBottom: 9 }} />
            <div style={{ display: "inline-block", fontSize: 10.5, fontWeight: 700, background: "#7c5cff22", border: "1px solid #7c5cff55", color: "#cbbcff", borderRadius: 7, padding: "3px 9px" }}>Shop now →</div>
          </div>
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
      <div className="in" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#9aa6c2" }}><span style={{ color: "#7c5cff" }}>🔗</span> yourstore.com/product</div>
      <div style={{ textAlign: "center", color: "#7c5cff", fontSize: 18, margin: "8px 0" }}>↓</div>
      <div className="card" style={{ padding: 12 }}>
        <div style={{ fontSize: 11, color: "#8b97b3", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 7 }}>Brief — auto-filled</div>
        <div className="shimmer-line" style={{ height: 8, marginBottom: 6 }} />
        <div className="shimmer-line" style={{ height: 8, width: "85%", marginBottom: 6 }} />
        <div className="shimmer-line" style={{ height: 8, width: "55%" }} />
      </div>
    </div></div>
  );
  return (
    <div className="gborder" style={{ borderRadius: 16, padding: 1 }}><div className="glass" style={{ borderRadius: 16, padding: 16 }}>
      <div style={{ fontSize: 11, color: "#8b97b3", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>ROAS by hook</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120 }}>
        {[["UGC", 92], ["Social proof", 74], ["Urgency", 58], ["Curiosity", 40]].map(([l, h]) => (
          <div key={l as string} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: `${h as number}%`, borderRadius: "6px 6px 0 0", background: "linear-gradient(180deg,#7c5cff,#4f8cff)" }} />
            <div style={{ fontSize: 10, color: "#8b97b3", marginTop: 6 }}>{l}</div>
          </div>
        ))}
      </div>
    </div></div>
  );
}

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
          <a href="#pricing" className="btn-ghost btn hide-sm" style={{ padding: "8px 14px", border: "none" }}>Pricing</a>
          <a href="/done-for-you" className="btn-ghost btn hide-sm" style={{ padding: "8px 14px" }}>Done-for-you</a>
          <a href="/login" className="btn-ghost btn" style={{ padding: "8px 14px" }}>Sign in</a>
          <a href="/login" className="btn" style={{ padding: "8px 16px" }}>Start free</a>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "clamp(36px,7vw,72px) 22px 30px", display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 40, alignItems: "center" }}>
        <div>
          <div className="anim anim-1 chip" style={{ marginBottom: 18 }}>✨ Copy · Images · Video — in seconds</div>
          <h1 className="anim anim-2" style={{ fontSize: "clamp(34px,6vw,58px)", lineHeight: 1.05, margin: "0 0 18px", fontWeight: 900, letterSpacing: -0.5 }}>
            Scroll-stopping ads,<br /><span style={grad} className="grad-animate">on autopilot</span>
          </h1>
          <p className="anim anim-3" style={{ fontSize: "clamp(15px,2.2vw,18px)", color: "#9aa6c2", lineHeight: 1.6, maxWidth: 520, margin: "0 0 26px" }}>
            Describe your product — or paste a URL — and AdSpark generates platform-native copy, AI images and <b style={{ color: "#c7d0e6" }}>AI video ads</b> instantly. Ship to Meta, TikTok and Google, or let us run it all for you.
          </p>
          <div className="anim anim-4" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="/login" className="btn shine-cta" style={{ padding: "14px 26px", fontSize: 16 }}>Start with 5 free generations →</a>
            <a href="/done-for-you" className="btn-ghost btn" style={{ padding: "14px 22px", fontSize: 16 }}>See done-for-you</a>
          </div>
          <div className="anim anim-5" style={{ fontSize: 12.5, color: "#6b7690", marginTop: 14 }}>No credit card · no spend fees · cancel anytime</div>
        </div>
        <div className="anim anim-3"><HeroMock /></div>
      </section>

      {/* Platform marquee */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "10px 22px 40px" }}>
        <div style={{ textAlign: "center", fontSize: 12, color: "#6b7690", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>Generate &amp; ship to every platform</div>
        <div className="marquee">
          <div className="marquee-track">
            {[...PLATFORMS, ...PLATFORMS].map((p, i) => <span key={i} className="chip">{p}</span>)}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "30px 22px 20px" }}>
        <Reveal><h2 style={{ textAlign: "center", fontSize: "clamp(24px,5vw,34px)", fontWeight: 900, margin: "0 0 30px" }}>Three steps to a campaign</h2></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {[
            ["01", "Describe or paste a URL", "Tell AdSpark your product, or drop a link and it builds the brief for you."],
            ["02", "Generate the creative", "Copy, images and video — multiple variations, auto-tagged, ready to ship."],
            ["03", "Launch & learn", "Ship to Meta/TikTok/Google and see what actually converts — or let us run it."],
          ].map(([n, t, d], i) => (
            <Reveal key={n} delay={i * 90}>
              <div className="card hover-pop" style={{ padding: 22, height: "100%" }}>
                <div style={{ fontSize: 13, fontWeight: 900, ...grad as any, background: "linear-gradient(135deg,#7c5cff,#4f8cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{n}</div>
                <div style={{ fontSize: 17, fontWeight: 800, margin: "8px 0 6px" }}>{t}</div>
                <div style={{ fontSize: 13.5, ...muted, lineHeight: 1.55 }}>{d}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Feature showcase with media */}
      <section id="features" style={{ maxWidth: 1000, margin: "0 auto", padding: "30px 22px 20px", display: "flex", flexDirection: "column", gap: 26 }}>
        {([
          ["studio", "A full creative studio", "Copy, AI images, and AI video — avatar/UGC or cinematic — generated together and labeled for compliance. Enhance any image in one click."],
          ["url", "Paste a URL → ready-to-run ads", "Drop in a product or store link and AdSpark scrapes it, writes the brief, and produces the creative automatically."],
          ["insights", "Know what actually converts", "Every asset is tagged by hook, format and vertical, so your results compound into a benchmark only you have."],
        ] as const).map(([kind, t, d], i) => (
          <Reveal key={kind}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26, alignItems: "center" }}>
              <div style={{ order: i % 2 === 1 ? 2 : 1 }}>
                <h3 style={{ fontSize: "clamp(20px,3.6vw,26px)", fontWeight: 900, margin: "0 0 10px" }}>{t}</h3>
                <p style={{ fontSize: 14.5, ...muted, lineHeight: 1.6 }}>{d}</p>
              </div>
              <div style={{ order: i % 2 === 1 ? 1 : 2 }}><FeatureMock kind={kind} /></div>
            </div>
          </Reveal>
        ))}
      </section>

      {/* Capability stats */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "30px 22px" }}>
        <Reveal>
          <div className="card" style={{ padding: 22, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, textAlign: "center" }}>
            {[["Copy · Images · Video", "one studio"], ["Meta · TikTok · Google", "native launch"], ["Seconds", "not days or shoots"], ["$0", "fees on your ad spend"]].map(([a, b]) => (
              <div key={a}><div style={{ fontSize: "clamp(15px,2.4vw,19px)", fontWeight: 900 }}>{a}</div><div style={{ fontSize: 12, ...muted, marginTop: 4 }}>{b}</div></div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ maxWidth: 1000, margin: "0 auto", padding: "30px 22px 24px" }}>
        <Reveal><h2 style={{ textAlign: "center", fontSize: "clamp(24px,5vw,34px)", fontWeight: 900, margin: "0 0 8px" }}>Simple, scalable pricing</h2></Reveal>
        <Reveal delay={60}><p style={{ textAlign: "center", ...muted, marginTop: 0, marginBottom: 30 }}>Start free. Every plan includes copy, images and video.</p></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {PLAN_LIST.map((p, i) => (
            <Reveal key={p.id} delay={i * 80} style={{ height: "100%" }}>
              <div className={`card hover-pop${p.id === "pro" ? " gborder" : ""}`} style={{ padding: 22, position: "relative", height: "100%", boxShadow: p.id === "pro" ? "0 0 44px #7c5cff22" : undefined }}>
                {p.id === "pro" && <div style={{ position: "absolute", top: -10, left: 22, background: "linear-gradient(135deg,#7c5cff,#4f8cff)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20 }}>MOST POPULAR</div>}
                <div style={{ fontSize: 15, fontWeight: 800 }}>{p.name}</div>
                <div style={{ fontSize: 32, fontWeight: 900, margin: "6px 0" }}>${p.priceUsd}<span style={{ fontSize: 13, color: "#8b97b3", fontWeight: 600 }}>{p.priceUsd ? "/mo" : ""}</span></div>
                <div style={{ fontSize: 12.5, ...muted, minHeight: 34, lineHeight: 1.4 }}>{p.blurb}</div>
                <ul style={{ listStyle: "none", padding: 0, margin: "12px 0", fontSize: 13, color: "#c7d0e6", display: "flex", flexDirection: "column", gap: 6 }}>
                  <li>✓ {p.quota.toLocaleString()} generations / mo</li>
                  <li>✓ {p.variants} copy variations each</li>
                  <li>✓ {p.images} AI image{p.images > 1 ? "s" : ""} each</li>
                  <li>✓ {p.videos} AI video{p.videos > 1 ? "s" : ""} / mo</li>
                </ul>
                <a href="/login" className="btn" style={{ width: "100%", background: p.id === "pro" ? undefined : "#1a2138" }}>{p.priceUsd ? "Choose" : "Start free"}</a>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Done-for-you — secondary, observable */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 22px 40px" }}>
        <Reveal>
          <div className="card" style={{ padding: "16px 20px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontSize: 13.5, ...muted }}><b style={{ color: "#c7d0e6" }}>Rather not DIY?</b> Switch on the full suite from your account and we run everything end-to-end — flat price, no spend fees.</div>
            <a href="/done-for-you" className="btn-ghost btn" style={{ padding: "9px 16px", fontSize: 13.5, whiteSpace: "nowrap" }}>Explore done-for-you →</a>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "10px 22px 50px" }}>
        <Reveal><h2 style={{ textAlign: "center", fontSize: "clamp(22px,5vw,28px)", fontWeight: 900, margin: "0 0 24px" }}>Questions</h2></Reveal>
        {[
          ["What can I make on a self-serve plan?", "Platform-native ad copy, AI images, and AI video ads (avatar/UGC or cinematic) — plus paste-a-URL brief import and one-click image enhancement. Everything downloads ready to ship."],
          ["Do you charge a percentage of my ad spend?", "Never. Plans are flat monthly. (A spend fee is the #1 complaint about tools like Zeely — we don't do it.)"],
          ["Can you run the ads for me instead?", "Yes — the full done-for-you suite is an option you switch on from your account. We build, launch and report end-to-end, and you track it all in your portal."],
          ["Which platforms do you support?", "Meta (Facebook/Instagram), TikTok and Google — native integrations. Copy via Claude, images and video via the latest models."],
          ["Is the AI creative compliant?", "Every asset is labeled AI-generated and carries a compliance record, built to meet current FTC and platform disclosure requirements."],
        ].map(([q, a], i) => (
          <Reveal key={q} delay={i * 50}>
            <div className="card" style={{ padding: 18, marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>{q}</div>
              <div style={{ fontSize: 13.5, ...muted, lineHeight: 1.6 }}>{a}</div>
            </div>
          </Reveal>
        ))}
      </section>

      {/* Final CTA band */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "10px 22px 60px" }}>
        <Reveal>
          <div className="gborder" style={{ borderRadius: 20, padding: 1 }}>
            <div style={{ borderRadius: 20, padding: "clamp(28px,5vw,46px) 22px", textAlign: "center", background: "radial-gradient(120% 140% at 50% 0%, #14193180, #0d1120)" }}>
              <h2 style={{ fontSize: "clamp(24px,5vw,36px)", fontWeight: 900, margin: "0 0 10px" }}>Make your first ad in <span style={grad} className="grad-animate">60 seconds</span></h2>
              <p style={{ ...muted, fontSize: 15, margin: "0 0 22px" }}>Five free generations. No card. No spend fees.</p>
              <a href="/login" className="btn shine-cta" style={{ padding: "14px 30px", fontSize: 16 }}>Start free →</a>
            </div>
          </div>
        </Reveal>
      </section>

      <footer style={{ borderTop: "1px solid #161c2e", padding: "28px 22px", maxWidth: 1000, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "space-between" }}>
        <Logo size={16} />
        <div style={{ fontSize: 12.5, color: "#8b97b3", display: "flex", gap: 16, flexWrap: "wrap" }}>
          <a href="/done-for-you" style={{ color: "#8b97b3" }}>Done-for-you</a>
          <a href="/login" style={{ color: "#8b97b3" }}>Sign in</a>
          <a href="/terms" style={{ color: "#8b97b3" }}>Terms</a>
          <a href="/privacy" style={{ color: "#8b97b3" }}>Privacy</a>
        </div>
        <div style={{ fontSize: 12, color: "#5b6680", width: "100%", textAlign: "center", marginTop: 6 }}>© 2026 AdSpark AI · AI ad creative, on autopilot.</div>
      </footer>
    </main>
  );
}
