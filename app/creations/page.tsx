"use client";
// app/creations/page.tsx - "My Creations": the customer's saved work. Revisit past
// ad sets (copy + images) and videos, re-download any asset, or delete.
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

export default function CreationsPage() {
  const { user, loading, getToken, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"sets" | "videos">("sets");
  const [gens, setGens] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<any>(null); // generation detail modal

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  useEffect(() => { if (user) load(); }, [user]); // eslint-disable-line

  async function load() {
    try {
      const t = await getToken(); if (!t) return;
      const r = await fetch("/api/creations", { headers: { Authorization: `Bearer ${t}` } });
      const j = await r.json();
      if (j.ok) { setGens(j.generations || []); setVideos(j.videos || []); } else setErr(j.error);
    } catch (e: any) { setErr(e.message); } finally { setLoaded(true); }
  }

  async function del(type: "generation" | "video", id: string) {
    if (!confirm("Delete this permanently? This can't be undone.")) return;
    try {
      const t = await getToken(); if (!t) return;
      const r = await fetch("/api/creations", { method: "DELETE", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify({ type, id }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      if (type === "generation") { setGens(gs => gs.filter(g => g.id !== id)); setOpen(null); }
      else setVideos(vs => vs.filter(v => v.id !== id));
    } catch (e: any) { setErr(e.message); }
  }

  const copyAll = (v: any) => navigator.clipboard?.writeText(`${v.headline}\n\n${v.primaryText}\n\n${v.caption}\n\n${(v.hashtags || []).map((h: string) => h.startsWith("#") ? h : "#" + h).join(" ")}\n\n${v.cta}`);

  if (loading || !user || !loaded) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#8b97b3" }}>Loading…</main>;

  return (
    <main style={{ minHeight: "100vh" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #1c2238" }}>
        <a href="/app" style={{ textDecoration: "none", fontWeight: 900, fontSize: 18 }}>
          <span style={{ background: "linear-gradient(135deg,#8b5cff,#4f8cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AdSpark AI</span>
        </a>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/app" className="btn-ghost btn" style={{ padding: "7px 12px", fontSize: 13 }}>Generator</a>
          <a href="/account" className="btn-ghost btn" style={{ padding: "7px 12px", fontSize: 13 }}>Account</a>
          <button onClick={() => { logout(); router.replace("/"); }} className="btn-ghost btn" style={{ padding: "7px 12px", fontSize: 13 }}>Log out</button>
        </div>
      </header>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 18px 60px" }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>My Creations</h1>
        <div style={{ color: "#8b97b3", fontSize: 13, marginBottom: 18 }}>Everything you've made - revisit, re-download, or remove.</div>
        {err && <div style={{ color: "#ff6b6b", marginBottom: 16 }}>{err}</div>}

        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <button onClick={() => setTab("sets")} className="btn" style={{ padding: "8px 16px", fontSize: 13, background: tab === "sets" ? undefined : "#1a2138" }}>Ad sets ({gens.length})</button>
          <button onClick={() => setTab("videos")} className="btn" style={{ padding: "8px 16px", fontSize: 13, background: tab === "videos" ? undefined : "#1a2138" }}>🎬 Videos ({videos.length})</button>
        </div>

        {tab === "sets" && (gens.length === 0 ? (
          <div className="card" style={{ padding: 30, textAlign: "center", color: "#8b97b3", fontSize: 13.5 }}>No ad sets yet - <a href="/app" style={{ color: "#8b5cff" }}>create your first one</a>.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
            {gens.map(g => (
              <div key={g.id} className="card hover-pop" style={{ padding: 0, overflow: "hidden", cursor: "pointer" }} onClick={() => setOpen(g)}>
                {g.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.images[0]} alt="" style={{ width: "100%", height: 150, objectFit: "cover", display: "block", borderBottom: "1px solid #1c2238" }} />
                ) : (
                  <div style={{ height: 150, display: "grid", placeItems: "center", background: "#0a0e1c", color: "#6b7690", fontSize: 26 }}>✨</div>
                )}
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.brief?.product || "Ad set"}</div>
                  <div style={{ fontSize: 11.5, color: "#8b97b3", marginTop: 3 }}>{g.brief?.platform} · {g.variations?.length || 0} copy · {g.imageCount || 0} img</div>
                  <div style={{ fontSize: 11, color: "#6b7690", marginTop: 4 }}>{g.createdAt ? new Date(g.createdAt).toLocaleDateString() : ""}</div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {tab === "videos" && (videos.length === 0 ? (
          <div className="card" style={{ padding: 30, textAlign: "center", color: "#8b97b3", fontSize: 13.5 }}>No videos yet - make one in the <a href="/app" style={{ color: "#8b5cff" }}>generator's 🎬 Video mode</a>.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
            {videos.map(v => (
              <div key={v.id} className="card" style={{ padding: 12 }}>
                {v.url ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video src={v.url} controls style={{ width: "100%", borderRadius: 8, border: "1px solid #232a3e" }} />
                ) : (
                  <div style={{ height: 140, display: "grid", placeItems: "center", background: "#0a0e1c", color: "#8b97b3", fontSize: 12, borderRadius: 8 }}>{v.status === "failed" ? "Failed to render" : "Still rendering…"}</div>
                )}
                <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.brief?.product || (v.kind === "avatar" ? "Avatar/UGC video" : "Product video")}</div>
                <div style={{ fontSize: 11, color: "#6b7690", marginTop: 3, marginBottom: 8 }}>{v.kind} · {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : ""}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {v.url && <a href={v.url} download="adspark-video.mp4" className="btn" style={{ padding: "6px 12px", fontSize: 12, flex: 1, textAlign: "center" }}>⬇ Download</a>}
                  <button onClick={() => del("video", v.id)} className="btn-ghost btn" style={{ padding: "6px 12px", fontSize: 12, color: "#ff6b6b" }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Detail modal for an ad set */}
      {open && (
        <div onClick={() => setOpen(null)} style={{ position: "fixed", inset: 0, background: "#04060cd0", zIndex: 100, display: "grid", placeItems: "center", padding: 20, overflow: "auto" }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ padding: 20, maxWidth: 720, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{open.brief?.product || "Ad set"}</div>
                <div style={{ fontSize: 12, color: "#8b97b3" }}>{open.brief?.platform} · {open.createdAt ? new Date(open.createdAt).toLocaleString() : ""}{open.tags?.hook ? ` · ${open.tags.hook}` : ""}</div>
              </div>
              <button onClick={() => setOpen(null)} className="btn-ghost btn" style={{ padding: "6px 10px", fontSize: 13 }}>✕</button>
            </div>

            {open.images?.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10, marginBottom: 16 }}>
                {open.images.map((src: string, i: number) => (
                  <div key={i} style={{ position: "relative" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Ad ${i + 1}`} style={{ width: "100%", borderRadius: 8, border: "1px solid #232a3e" }} />
                    <a href={src} download={`adspark-${i + 1}.png`} className="btn" style={{ position: "absolute", bottom: 8, right: 8, padding: "5px 9px", fontSize: 12 }}>⬇</a>
                  </div>
                ))}
              </div>
            )}

            {open.creativeBrief && <div className="card" style={{ padding: 12, fontSize: 12.5, color: "#c7d0e6", marginBottom: 12 }}><b style={{ color: "#9aa6c2" }}>Creative brief:</b> {open.creativeBrief}</div>}

            {(open.variations || []).map((v: any, i: number) => (
              <div key={i} className="card" style={{ padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: "#8b5cff", fontWeight: 800, letterSpacing: 0.6 }}>VARIATION {i + 1}</span>
                  <button onClick={() => copyAll(v)} className="btn-ghost btn" style={{ padding: "5px 10px", fontSize: 12 }}>Copy all</button>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>{v.headline}</div>
                <div style={{ fontSize: 13, color: "#cdd6ea", lineHeight: 1.55, marginBottom: 8, whiteSpace: "pre-wrap" }}>{v.primaryText}</div>
                <div style={{ fontSize: 12.5, color: "#aeb9d4", lineHeight: 1.5, marginBottom: 8, whiteSpace: "pre-wrap" }}>{v.caption}</div>
                <div style={{ fontSize: 12, color: "#8b5cff", marginBottom: 8 }}>{(v.hashtags || []).map((h: string) => (h.startsWith("#") ? h : "#" + h)).join(" ")}</div>
                <div style={{ display: "inline-block", fontSize: 12, fontWeight: 700, background: "#7c5cff22", border: "1px solid #7c5cff55", color: "#cbbcff", borderRadius: 8, padding: "4px 10px" }}>CTA: {v.cta}</div>
              </div>
            ))}

            <button onClick={() => del("generation", open.id)} className="btn-ghost btn" style={{ marginTop: 6, fontSize: 12.5, color: "#ff6b6b" }}>Delete this ad set</button>
          </div>
        </div>
      )}
    </main>
  );
}
