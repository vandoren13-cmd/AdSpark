"use client";
// app/support/page.tsx - customer help + contact. Submits a ticket a CS agent works
// in /admin; shows the customer's own past requests and their status/replies.
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

const FAQ: [string, string][] = [
  ["How do I create an ad?", "Go to the Generator, describe your product (or paste a URL), pick a platform and tone, and hit Generate. You'll get copy variations, images, and - in Video mode - AI video ads."],
  ["Where do my past creations live?", "Everything you make is saved under My Creations - revisit, re-download, or delete any ad set or video any time."],
  ["How does billing work?", "Plans are flat monthly with no fees on your ad spend. Upgrade or cancel any time from your Account page; manage your card and invoices via Manage billing."],
  ["Can you run my ads for me?", "Yes - turn on the done-for-you suite from your Account and our team runs everything end-to-end, with weekly reports in your portal."],
];

export default function SupportPage() {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ subject: "", message: "" });
  const [tickets, setTickets] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  useEffect(() => { if (user) load(); }, [user]); // eslint-disable-line

  async function load() {
    try {
      const t = await getToken(); if (!t) return;
      const r = await fetch("/api/support", { headers: { Authorization: `Bearer ${t}` } });
      const j = await r.json();
      if (j.ok) setTickets(j.tickets || []);
    } catch { /* */ }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setNotice(null);
    if (!form.message.trim()) { setErr("Please describe how we can help."); return; }
    setBusy(true);
    try {
      const t = await getToken(); if (!t) return;
      const r = await fetch("/api/support", { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      setForm({ subject: "", message: "" });
      setNotice("✅ Got it - our team will get back to you by email. You can track it below.");
      await load();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  if (loading || !user) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#8b97b3" }}>Loading…</main>;

  const label: React.CSSProperties = { fontSize: 11, color: "#8b97b3", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5, display: "block" };
  const statusColor: Record<string, string> = { open: "#4f8cff", pending: "#f6c453", resolved: "#34d399" };

  return (
    <main style={{ minHeight: "100vh" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #1c2238" }}>
        <a href="/app" style={{ textDecoration: "none", fontWeight: 900, fontSize: 18 }}>
          <span style={{ background: "linear-gradient(135deg,#8b5cff,#4f8cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AdSpark AI</span>
        </a>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/app" className="btn-ghost btn" style={{ padding: "7px 12px", fontSize: 13 }}>Generator</a>
          <a href="/account" className="btn-ghost btn" style={{ padding: "7px 12px", fontSize: 13 }}>Account</a>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 18px 60px" }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>Help &amp; support</h1>
        <div style={{ color: "#8b97b3", fontSize: 13, marginBottom: 22 }}>Answers to common questions - or send us a message and our team will reply by email.</div>

        {/* FAQ */}
        <div style={{ marginBottom: 26 }}>
          {FAQ.map(([q, a]) => (
            <div key={q} className="card" style={{ padding: 16, marginBottom: 10 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 5 }}>{q}</div>
              <div style={{ fontSize: 13, color: "#aab7cf", lineHeight: 1.6 }}>{a}</div>
            </div>
          ))}
        </div>

        {/* Contact form */}
        <div className="card" style={{ padding: 18, marginBottom: 26 }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Contact support</div>
          {notice && <div style={{ color: "#34d399", marginBottom: 12, fontSize: 13.5 }}>{notice}</div>}
          {err && <div style={{ color: "#ff6b6b", marginBottom: 12, fontSize: 13 }}>{err}</div>}
          <form onSubmit={submit}>
            <div style={{ marginBottom: 12 }}><label style={label}>Subject</label><input className="in" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="What's this about?" /></div>
            <div style={{ marginBottom: 12 }}><label style={label}>Message *</label><textarea className="in" rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="How can we help?" style={{ resize: "vertical" }} /></div>
            <button className="btn btn-spark" type="submit" disabled={busy}>{busy ? "Sending…" : "Send message"}</button>
          </form>
        </div>

        {/* Your requests */}
        {tickets.length > 0 && (
          <>
            <div style={{ fontSize: 16, fontWeight: 800, margin: "8px 0 12px" }}>Your requests</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tickets.map(t => (
                <div key={t.id} className="card" style={{ padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t.subject}</div>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: statusColor[t.status] || "#8b97b3" }}>{t.status}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#aab7cf", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{t.message}</div>
                  {(t.replies || []).map((r: any, i: number) => (
                    <div key={i} style={{ marginTop: 8, padding: 10, background: r.from === "agent" ? "#10142a" : "#0a0e1c", border: "1px solid #1c2238", borderRadius: 8 }}>
                      <div style={{ fontSize: 10.5, color: r.from === "agent" ? "#8b5cff" : "#8b97b3", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>{r.from === "agent" ? "AdSpark support" : "You"}</div>
                      <div style={{ fontSize: 12.5, color: "#cdd6ea", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{r.text}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
