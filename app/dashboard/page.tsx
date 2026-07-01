"use client";
// app/dashboard/page.tsx - the signed-in customer's home. Usage at a glance, quick
// actions, recent creations, latest news, and resource highlights (from /api/content).
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { CustomerNav } from "@/lib/CustomerNav";

export default function DashboardPage() {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  useEffect(() => { if (user) load(); }, [user]); // eslint-disable-line

  async function load() {
    try {
      const t = await getToken(); if (!t) return;
      const h = { Authorization: `Bearer ${t}` };
      const [mj, nj, gj] = await Promise.all([
        fetch("/api/me", { headers: h }).then(r => r.json()).catch(() => ({})),
        fetch("/api/content?type=news&limit=3", { headers: h }).then(r => r.json()).catch(() => ({})),
        fetch("/api/content?type=guide&limit=4", { headers: h }).then(r => r.json()).catch(() => ({})),
      ]);
      if (mj.ok) setMe(mj);
      if (nj.ok) setNews(nj.items || []);
      if (gj.ok) setGuides(gj.items || []);
    } catch { /* */ } finally { setLoaded(true); }
  }

  if (loading || !user || !loaded) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#8b97b3" }}>Loading…</main>;

  const plan = me?.plan, used = me?.used ?? 0, quota = plan?.quota ?? 0, remaining = me?.remaining ?? 0;
  const pct = quota ? Math.min(100, Math.round((used / quota) * 100)) : 0;
  const history = me?.history || [];
  const firstName = (me?.displayName || user.email || "").split("@")[0].split(" ")[0];

  const stat = (label: string, value: any, sub?: string) => (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 11, color: "#8b97b3", textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: "#8b97b3", marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <main style={{ minHeight: "100vh" }}>
      <div className="aurora" aria-hidden="true" />
      <CustomerNav active="dashboard" remaining={remaining} planName={plan?.name} />

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "26px 20px 60px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 4px", textTransform: "capitalize" }}>Welcome back{firstName ? `, ${firstName}` : ""}</h1>
        <div style={{ color: "#9aa6c2", fontSize: 14, marginBottom: 22 }}>Here&apos;s your studio at a glance.</div>

        {/* Usage + quick stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 12 }}>
          {stat("Plan", plan?.name || "Free")}
          {stat("Generations left", remaining, `of ${quota} this month`)}
          {stat("Used", `${used}/${quota}`)}
          {stat("Service", (me?.serviceStatus && me.serviceStatus !== "none") ? me.serviceStatus : "self-serve")}
        </div>
        <div className="card" style={{ padding: 16, marginBottom: 24 }}>
          <div style={{ height: 8, background: "#1a2138", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "var(--grad-spark)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "#8b97b3" }}>
            <span>{remaining} generations remaining</span>
            {remaining <= 3 && <a href="/account" style={{ color: "#8b5cff", fontWeight: 700 }}>Upgrade for more →</a>}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 28 }}>
          {[
            ["⚡", "New ad set", "Copy + images in seconds", "/app"],
            ["🎬", "Make a video", "Avatar/UGC or cinematic", "/app"],
            ["🖼️", "My Creations", "Revisit & re-download", "/creations"],
            ["📚", "Resources", "Guides, deploy how-tos", "/resources"],
          ].map(([icon, t, d, href]) => (
            <a key={t as string} href={href as string} className="card hover-pop" style={{ padding: 18, textDecoration: "none", display: "block" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{t}</div>
              <div style={{ fontSize: 12.5, color: "#8b97b3", marginTop: 3 }}>{d}</div>
            </a>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 22, alignItems: "start" }}>
          {/* Recent creations */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Recent creations</div>
              <a href="/creations" style={{ fontSize: 12.5, color: "#8b5cff", fontWeight: 700 }}>View all →</a>
            </div>
            {history.length === 0 ? (
              <div className="card" style={{ padding: 24, color: "#8b97b3", fontSize: 13.5 }}>No ad sets yet - <a href="/app" style={{ color: "#8b5cff" }}>create your first one</a>.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10 }}>
                {history.slice(0, 6).map((g: any) => (
                  <a key={g.id} href="/creations" className="card hover-pop" style={{ padding: 0, overflow: "hidden", textDecoration: "none" }}>
                    {g.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.images[0]} alt="" style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }} />
                    ) : <div style={{ height: 100, display: "grid", placeItems: "center", background: "#0a0e1c", color: "#6b7690" }}>✨</div>}
                    <div style={{ padding: "7px 9px", fontSize: 11, color: "#aab7cf", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.brief?.product || "Ad set"}</div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* News + resources */}
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>News &amp; updates</div>
            {news.length === 0 ? (
              <div className="card" style={{ padding: 18, color: "#8b97b3", fontSize: 13 }}>No updates yet - check back soon.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {news.map((n: any) => (
                  <a key={n.id} href={`/resources?slug=${n.slug}`} className="card hover-pop" style={{ padding: 14, textDecoration: "none", display: "block" }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>{n.coverEmoji} {n.title}</div>
                    {n.excerpt && <div style={{ fontSize: 12, color: "#8b97b3", marginTop: 4, lineHeight: 1.45 }}>{n.excerpt}</div>}
                  </a>
                ))}
              </div>
            )}
            {guides.length > 0 && (
              <>
                <div style={{ fontSize: 16, fontWeight: 800, margin: "6px 0 12px" }}>Learn</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {guides.map((g: any) => (
                    <a key={g.id} href={`/resources?slug=${g.slug}`} className="card hover-pop" style={{ padding: "10px 14px", textDecoration: "none", display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 18 }}>{g.coverEmoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{g.title}</span>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
