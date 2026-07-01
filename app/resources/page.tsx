"use client";
// app/resources/page.tsx - customer Academy/Resources hub. Reads published content
// (guides, deploy how-tos, use cases, trends, news) and renders an article reader.
import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { CustomerNav } from "@/lib/CustomerNav";

const SECTIONS: { type: string; label: string; blurb: string }[] = [
  { type: "guide", label: "Guides & how-tos", blurb: "Use your creative and launch it properly" },
  { type: "usecase", label: "Best use cases", blurb: "What works, by business type" },
  { type: "trend", label: "Trends", blurb: "What's moving in paid social right now" },
  { type: "news", label: "News & updates", blurb: "The latest from AdSpark" },
];

// Render plain-text body: "## " lines -> headings, blank lines -> paragraph breaks.
function Body({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div style={{ fontSize: 14.5, color: "#c7d0e6", lineHeight: 1.7 }}>
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) return <h3 key={i} style={{ fontSize: 18, fontWeight: 800, color: "#e7ecf5", margin: "22px 0 8px" }}>{b.slice(3)}</h3>;
        return <p key={i} style={{ margin: "0 0 12px", whiteSpace: "pre-wrap" }}>{b}</p>;
      })}
    </div>
  );
}

function ResourcesInner() {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const slug = params.get("slug");
  const [items, setItems] = useState<any[]>([]);
  const [article, setArticle] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  useEffect(() => { if (user) load(); }, [user]); // eslint-disable-line
  useEffect(() => { if (user && slug) openArticle(slug); if (!slug) setArticle(null); }, [slug, user]); // eslint-disable-line

  async function load() {
    try {
      const t = await getToken(); if (!t) return;
      const r = await fetch("/api/content?limit=100", { headers: { Authorization: `Bearer ${t}` } });
      const j = await r.json();
      if (j.ok) setItems(j.items || []);
    } catch { /* */ } finally { setLoaded(true); }
  }
  const openArticle = useCallback(async (sl: string) => {
    try {
      const t = await getToken(); if (!t) return;
      const r = await fetch(`/api/content?slug=${encodeURIComponent(sl)}`, { headers: { Authorization: `Bearer ${t}` } });
      const j = await r.json();
      if (j.ok) setArticle(j.item);
    } catch { /* */ }
  }, [getToken]);

  if (loading || !user || !loaded) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#8b97b3" }}>Loading…</main>;

  return (
    <main style={{ minHeight: "100vh" }}>
      <div className="aurora" aria-hidden="true" />
      <CustomerNav active="resources" />

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "26px 20px 60px" }}>
        {article ? (
          <>
            <button onClick={() => router.push("/resources")} className="btn-ghost btn" style={{ padding: "7px 12px", fontSize: 13, marginBottom: 18 }}>← All resources</button>
            <div style={{ fontSize: 12, color: "#8b5cff", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>{article.category || article.type}</div>
            <h1 style={{ fontSize: 30, fontWeight: 900, margin: "0 0 8px", lineHeight: 1.15 }}>{article.coverEmoji} {article.title}</h1>
            <div style={{ color: "#8b97b3", fontSize: 12.5, marginBottom: 22 }}>{article.author || "AdSpark Team"}{article.updatedAt ? ` · updated ${new Date(article.updatedAt).toLocaleDateString()}` : ""}</div>
            <Body text={article.body || article.excerpt || ""} />
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 4px" }}>Resources</h1>
            <div style={{ color: "#9aa6c2", fontSize: 14, marginBottom: 24 }}>Everything you need to create great ads and launch them with confidence.</div>
            {items.length === 0 ? (
              <div className="card" style={{ padding: 30, textAlign: "center", color: "#8b97b3", fontSize: 13.5 }}>Resources are being added - check back shortly.</div>
            ) : SECTIONS.map(sec => {
              const list = items.filter(i => i.type === sec.type);
              if (list.length === 0) return null;
              return (
                <div key={sec.type} style={{ marginBottom: 30 }}>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>{sec.label}</div>
                  <div style={{ fontSize: 12.5, color: "#8b97b3", marginBottom: 12 }}>{sec.blurb}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
                    {list.map(a => (
                      <a key={a.id} href={`/resources?slug=${a.slug}`} className="card hover-pop" style={{ padding: 16, textDecoration: "none", display: "block", height: "100%" }}>
                        <div style={{ fontSize: 24, marginBottom: 8 }}>{a.coverEmoji}</div>
                        <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 4 }}>{a.title}</div>
                        {a.excerpt && <div style={{ fontSize: 12.5, color: "#8b97b3", lineHeight: 1.5 }}>{a.excerpt}</div>}
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </main>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#8b97b3" }}>Loading…</main>}>
      <ResourcesInner />
    </Suspense>
  );
}
