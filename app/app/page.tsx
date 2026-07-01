"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { CustomerNav } from "@/lib/CustomerNav";

const PLATFORMS = ["Instagram", "Facebook", "TikTok", "LinkedIn", "Google", "X (Twitter)", "Pinterest", "YouTube"];
const TONES = ["Bold & punchy", "Premium & polished", "Friendly & casual", "Urgent / scarcity", "Playful & fun", "Professional"];
const AGE_GROUPS = ["All adults (18+)", "18-24", "25-34", "35-44", "45-54", "55-64", "65+", "Teens (13-17)"];

interface Variation { headline: string; primaryText: string; caption: string; hashtags: string[]; cta: string; }
interface AdSet { variations: Variation[]; creativeBrief: string; images: string[]; }

export default function GeneratorPage() {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ brand: "", product: "", goal: "Drive conversions", platform: "Instagram", tone: "Bold & punchy", audience: "All adults (18+)" });
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<AdSet | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [planName, setPlanName] = useState("");
  const [mode, setMode] = useState<"creative" | "video">("creative");
  const [videoKind, setVideoKind] = useState<"avatar" | "product">("avatar");
  const [video, setVideo] = useState<{ status: string; url?: string } | null>(null);
  const [vbusy, setVbusy] = useState(false);
  const [enhancing, setEnhancing] = useState<number | null>(null);
  const [tip, setTip] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  useEffect(() => { if (user) refreshMe(); }, [user]); // eslint-disable-line
  useEffect(() => { try { setTip(!localStorage.getItem("adspark_tip_dismissed")); } catch { /* */ } }, []);
  function dismissTip() { try { localStorage.setItem("adspark_tip_dismissed", "1"); } catch { /* */ } setTip(false); }

  async function refreshMe() {
    try {
      const t = await getToken(); if (!t) return;
      const r = await fetch("/api/me", { headers: { Authorization: `Bearer ${t}` } });
      const j = await r.json();
      if (j.ok) { setRemaining(j.remaining); setPlanName(j.plan?.name || ""); }
    } catch { /* */ }
  }
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function importFromUrl() {
    if (!importUrl.trim()) { setErr("Paste a product or landing-page URL to import."); return; }
    setImporting(true); setErr(null);
    try {
      const t = await getToken();
      const r = await fetch("/api/scrape", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ url: importUrl }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Couldn't import that URL");
      // Auto-fill brand + product + tone + goal from the page. Audience is NOT scraped -
      // the customer picks a target age group from the dropdown.
      setForm(f => ({
        ...f,
        brand: j.brief.brand || f.brand,
        product: j.brief.product || f.product,
        tone: j.brief.tone || f.tone,
        goal: j.brief.goal || f.goal,
      }));
    } catch (e: any) { setErr(e.message); }
    finally { setImporting(false); }
  }

  async function generate() {
    if (!form.product.trim()) { setErr("Describe your product or offer."); return; }
    setBusy(true); setErr(null); setResult(null);
    try {
      const t = await getToken();
      const r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify(form) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Generation failed");
      setResult(j.adSet); setRemaining(j.remaining);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function generateVideo() {
    if (!form.product.trim()) { setErr("Describe your product or offer."); return; }
    setVbusy(true); setErr(null); setVideo(null);
    try {
      const t = await getToken();
      const r = await fetch("/api/video", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ ...form, kind: videoKind }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Video generation failed");
      const id = j.id;
      for (let i = 0; i < 75; i++) {
        await new Promise(res => setTimeout(res, 4000));
        const pr = await fetch(`/api/video/${id}`, { headers: { Authorization: `Bearer ${t}` } });
        const pj = await pr.json();
        if (pj.status === "ready") { setVideo({ status: "ready", url: pj.url }); return; }
        if (pj.status === "failed") throw new Error(pj.error || "Video generation failed");
      }
      throw new Error("Still rendering - it'll appear under your videos shortly.");
    } catch (e: any) { setErr(e.message); }
    finally { setVbusy(false); }
  }

  async function enhanceImg(i: number) {
    if (!result) return;
    setEnhancing(i); setErr(null);
    try {
      const t = await getToken();
      const r = await fetch("/api/enhance", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ imageUrl: result.images[i] }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Couldn't enhance");
      setResult(prev => prev ? { ...prev, images: prev.images.map((s, idx) => idx === i ? j.url : s) } : prev);
    } catch (e: any) { setErr(e.message); }
    finally { setEnhancing(null); }
  }

  if (loading || !user) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#8b97b3" }}>Loading…</main>;

  const label: React.CSSProperties = { fontSize: 11, color: "#8b97b3", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5, display: "block" };

  return (
    <main style={{ minHeight: "100vh" }}>
      <CustomerNav active="app" remaining={remaining} planName={planName} />

      {/* Onboarding nudge (dismissible, one-time) */}
      {tip && (
        <div style={{ maxWidth: 1100, margin: "16px auto 0", padding: "0 18px" }}>
          <div className="gborder" style={{ borderRadius: 12, padding: 1 }}>
            <div className="glass" style={{ borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, color: "#c7d0e6", flex: "1 1 320px", lineHeight: 1.5 }}>
                👋 <b>New here?</b> Set up your <a href="/settings" style={{ color: "#8b5cff" }}>Brand Kit</a> so every ad sounds like you, paste a product URL to auto-fill the brief, and find everything you make under <a href="/creations" style={{ color: "#8b5cff" }}>My Creations</a>.
              </div>
              <button onClick={dismissTip} className="btn-ghost btn" style={{ padding: "6px 12px", fontSize: 12.5, whiteSpace: "nowrap" }}>Got it</button>
            </div>
          </div>
        </div>
      )}

      {/* Mode toggle */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 18px 0", display: "flex", gap: 8 }}>
        {(["creative", "video"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} className="btn" style={{ padding: "8px 16px", fontSize: 13, background: mode === m ? undefined : "#1a2138" }}>
            {m === "creative" ? "Copy + Images" : "🎬 Video"}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 18px 60px", display: "grid", gridTemplateColumns: "380px 1fr", gap: 22, alignItems: "start" }}>
        {/* Brief form */}
        <div className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 16, margin: "0 0 14px" }}>Campaign brief</h2>
          <div style={{ marginBottom: 14, padding: 12, background: "#0a0e1c", border: "1px solid #1c2238", borderRadius: 10 }}>
            <label style={label}>Import from a URL</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="in" value={importUrl} onChange={e => setImportUrl(e.target.value)} placeholder="Paste a product or store URL…" onKeyDown={e => { if (e.key === "Enter") importFromUrl(); }} />
              <button className="btn-ghost btn" onClick={importFromUrl} disabled={importing} style={{ padding: "0 14px", fontSize: 13, whiteSpace: "nowrap" }}>{importing ? "…" : "Import"}</button>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}><label style={label}>Brand</label><input className="in" value={form.brand} onChange={e => set("brand", e.target.value)} placeholder="e.g. Lumen Skincare" /></div>
          <div style={{ marginBottom: 12 }}><label style={label}>Product / offer *</label><textarea className="in" rows={3} value={form.product} onChange={e => set("product", e.target.value)} placeholder="What you're advertising - the product, offer, key benefits…" style={{ resize: "vertical" }} /></div>
          <div style={{ marginBottom: 12 }}><label style={label}>Target age group</label><select className="in" value={form.audience} onChange={e => set("audience", e.target.value)}>{AGE_GROUPS.map(a => <option key={a}>{a}</option>)}</select></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div><label style={label}>Platform</label><select className="in" value={form.platform} onChange={e => set("platform", e.target.value)}>{PLATFORMS.map(p => <option key={p}>{p}</option>)}</select></div>
            <div><label style={label}>Tone</label><select className="in" value={form.tone} onChange={e => set("tone", e.target.value)}>{TONES.map(t => <option key={t}>{t}</option>)}</select></div>
          </div>
          <div style={{ marginBottom: 14 }}><label style={label}>Goal</label><input className="in" value={form.goal} onChange={e => set("goal", e.target.value)} placeholder="e.g. drive signups, sell the product" /></div>
          {err && <div style={{ color: "#ff6b6b", fontSize: 12.5, marginBottom: 10 }}>{err}</div>}
          {mode === "creative" ? (
            <>
              <button className="btn" onClick={generate} disabled={busy || remaining === 0} style={{ width: "100%" }}>
                {busy ? "⚡ Generating…" : remaining === 0 ? "No generations left - upgrade" : "⚡ Generate ad set"}
              </button>
              {remaining === 0 && <a href="/account" style={{ display: "block", textAlign: "center", marginTop: 10, color: "#7c5cff", fontSize: 13 }}>Upgrade your plan →</a>}
            </>
          ) : (
            <>
              <div style={{ marginBottom: 10 }}>
                <label style={label}>Video type</label>
                <select className="in" value={videoKind} onChange={e => setVideoKind(e.target.value as any)}>
                  <option value="avatar">Avatar / UGC (talking-head)</option>
                  <option value="product">Product / cinematic</option>
                </select>
              </div>
              <button className="btn" onClick={generateVideo} disabled={vbusy} style={{ width: "100%" }}>
                {vbusy ? "🎬 Rendering… (~1 - 3 min)" : "🎬 Generate video"}
              </button>
            </>
          )}
        </div>

        {/* Results */}
        <div>
          {/* Video mode */}
          {mode === "video" && (
            (!video && !vbusy) ? (
              <div className="card" style={{ padding: 40, textAlign: "center", color: "#8b97b3" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
                <div style={{ fontSize: 15, color: "#c7d0e6", fontWeight: 700 }}>Your AI video ad appears here</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Pick a video type, fill the brief, and hit Generate. Avatar/UGC and cinematic product videos render in ~1 - 3 min.</div>
              </div>
            ) : vbusy ? (
              <div className="card" style={{ padding: 40, textAlign: "center", color: "#8b97b3" }}>🎬 Rendering your video… this can take 1 - 3 minutes. Keep this tab open.</div>
            ) : video?.url ? (
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: "#8b97b3", textTransform: "uppercase", letterSpacing: 0.6 }}>AI video</div>
                  <div style={{ fontSize: 11, color: "#6b7690" }}>Labeled AI-generated for platform compliance</div>
                </div>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video src={video.url} controls style={{ width: "100%", borderRadius: 10, border: "1px solid #232a3e" }} />
                <a href={video.url} download="adspark-video.mp4" className="btn" style={{ marginTop: 10, width: "100%" }}>⬇ Download video</a>
              </div>
            ) : null
          )}

          {mode === "creative" && !result && !busy && (
            <div className="card" style={{ padding: 40, textAlign: "center", color: "#8b97b3" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
              <div style={{ fontSize: 15, color: "#c7d0e6", fontWeight: 700 }}>Your ad creative appears here</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Fill the brief and hit Generate - you'll get copy variations, captions, hashtags, and AI images.</div>
            </div>
          )}
          {mode === "creative" && busy && <div className="card" style={{ padding: 40, textAlign: "center", color: "#8b97b3" }}>⚡ Crafting your ad set… copy + images can take ~20 - 40s.</div>}
          {mode === "creative" && result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {result.images?.length > 0 && (
                <div className="card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: "#8b97b3", textTransform: "uppercase", letterSpacing: 0.6 }}>AI images</div>
                    <div style={{ fontSize: 11, color: "#6b7690" }}>Labeled AI-generated for platform compliance</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
                    {result.images.map((src, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`Ad ${i + 1}`} style={{ width: "100%", borderRadius: 10, border: "1px solid #232a3e" }} />
                        <span style={{ position: "absolute", top: 8, left: 8, background: "#0a0e1ccc", color: "#c7d0e6", fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 6, border: "1px solid #2c3450" }}>✦ AI-generated</span>
                        <div style={{ position: "absolute", bottom: 8, right: 8, display: "flex", gap: 6 }}>
                          <button onClick={() => enhanceImg(i)} disabled={enhancing === i} className="btn-ghost btn" style={{ padding: "6px 9px", fontSize: 12, background: "#0a0e1ccc" }} title="AI enhance / upscale">{enhancing === i ? "…" : "✨"}</button>
                          <a href={src} download={`adspark-${i + 1}.png`} className="btn" style={{ padding: "6px 10px", fontSize: 12 }}>⬇</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.creativeBrief && <div className="card" style={{ padding: 14, fontSize: 13, color: "#c7d0e6" }}><b style={{ color: "#9aa6c2" }}>Creative brief:</b> {result.creativeBrief}</div>}
              {result.variations.map((v, i) => (
                <div key={i} className="card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: "#7c5cff", fontWeight: 800, letterSpacing: 0.6 }}>VARIATION {i + 1}</span>
                    <button onClick={() => navigator.clipboard?.writeText(`${v.headline}\n\n${v.primaryText}\n\n${v.caption}\n\n${v.hashtags.map(h => h.startsWith("#") ? h : "#" + h).join(" ")}\n\n${v.cta}`)} className="btn-ghost btn" style={{ padding: "5px 10px", fontSize: 12 }}>Copy all</button>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{v.headline}</div>
                  <div style={{ fontSize: 13.5, color: "#cdd6ea", lineHeight: 1.55, marginBottom: 10, whiteSpace: "pre-wrap" }}>{v.primaryText}</div>
                  <div style={{ fontSize: 13, color: "#aeb9d4", lineHeight: 1.5, marginBottom: 8, whiteSpace: "pre-wrap" }}>{v.caption}</div>
                  <div style={{ fontSize: 12.5, color: "#7c5cff", marginBottom: 8 }}>{v.hashtags.map(h => (h.startsWith("#") ? h : "#" + h)).join(" ")}</div>
                  <div style={{ display: "inline-block", fontSize: 12, fontWeight: 700, background: "#7c5cff22", border: "1px solid #7c5cff55", color: "#cbbcff", borderRadius: 8, padding: "4px 10px" }}>CTA: {v.cta}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
