"use client";
// app/settings/page.tsx - account settings: display name, brand kit (shapes every
// generation), and password change (email/password accounts only).
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

const PLATFORMS = ["", "Instagram", "Facebook", "TikTok", "LinkedIn", "Google", "YouTube", "Pinterest", "X (Twitter)"];

export default function SettingsPage() {
  const { user, loading, getToken, changePassword, setDisplayName } = useAuth();
  const router = useRouter();
  const [displayName, setName] = useState("");
  const [bk, setBk] = useState({ name: "", voice: "", benefits: "", avoid: "", audience: "", platform: "" });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const isPasswordUser = !!user?.providerData?.some(p => p.providerId === "password");

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  useEffect(() => { if (user) load(); }, [user]); // eslint-disable-line

  async function load() {
    try {
      const t = await getToken(); if (!t) return;
      const r = await fetch("/api/me", { headers: { Authorization: `Bearer ${t}` } });
      const j = await r.json();
      if (j.ok) {
        setName(j.displayName || user?.displayName || "");
        if (j.brandKit) setBk({ name: j.brandKit.name || "", voice: j.brandKit.voice || "", benefits: j.brandKit.benefits || "", avoid: j.brandKit.avoid || "", audience: j.brandKit.audience || "", platform: j.brandKit.platform || "" });
      }
    } catch { /* */ }
  }

  async function saveProfile() {
    setSavingProfile(true); setErr(null); setNotice(null);
    try {
      const t = await getToken(); if (!t) return;
      if (displayName.trim()) { try { await setDisplayName(displayName.trim()); } catch { /* non-fatal */ } }
      const r = await fetch("/api/profile", { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify({ displayName, brandKit: bk }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      setNotice("✅ Saved. Your brand kit will shape future generations.");
    } catch (e: any) { setErr(e.message); }
    finally { setSavingProfile(false); }
  }

  async function savePassword() {
    if (!pw.current || !pw.next) { setErr("Enter your current and new password."); return; }
    if (pw.next.length < 6) { setErr("New password must be at least 6 characters."); return; }
    setSavingPw(true); setErr(null); setNotice(null);
    try {
      await changePassword(pw.current, pw.next);
      setPw({ current: "", next: "" });
      setNotice("✅ Password updated.");
    } catch (e: any) { setErr(e?.message?.replace("Firebase:", "").trim() || "Couldn't update password."); }
    finally { setSavingPw(false); }
  }

  if (loading || !user) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#8b97b3" }}>Loading…</main>;

  const label: React.CSSProperties = { fontSize: 11, color: "#8b97b3", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5, display: "block" };

  return (
    <main style={{ minHeight: "100vh" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #1c2238" }}>
        <a href="/account" style={{ textDecoration: "none", fontWeight: 900, fontSize: 18 }}>
          <span style={{ background: "linear-gradient(135deg,#8b5cff,#4f8cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AdSpark AI</span>
        </a>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/app" className="btn-ghost btn" style={{ padding: "7px 12px", fontSize: 13 }}>Generator</a>
          <a href="/account" className="btn-ghost btn" style={{ padding: "7px 12px", fontSize: 13 }}>Account</a>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 18px 60px" }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>Settings</h1>
        <div style={{ color: "#8b97b3", fontSize: 13, marginBottom: 20 }}>{user.email}</div>
        {notice && <div style={{ color: "#34d399", marginBottom: 16, fontSize: 13.5 }}>{notice}</div>}
        {err && <div style={{ color: "#ff6b6b", marginBottom: 16 }}>{err}</div>}

        {/* Profile */}
        <div className="card" style={{ padding: 18, marginBottom: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Profile</div>
          <label style={label}>Display name</label>
          <input className="in" value={displayName} onChange={e => setName(e.target.value)} placeholder="Your name" />
        </div>

        {/* Brand kit */}
        <div className="card" style={{ padding: 18, marginBottom: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Brand kit</div>
          <div style={{ fontSize: 12.5, color: "#8b97b3", marginBottom: 14 }}>Saved once, applied to every generation so your copy sounds like you.</div>
          <div style={{ marginBottom: 12 }}><label style={label}>Brand name</label><input className="in" value={bk.name} onChange={e => setBk({ ...bk, name: e.target.value })} placeholder="e.g. Lumen Skincare" /></div>
          <div style={{ marginBottom: 12 }}><label style={label}>Brand voice / tone</label><input className="in" value={bk.voice} onChange={e => setBk({ ...bk, voice: e.target.value })} placeholder="e.g. warm, confident, no hype" /></div>
          <div style={{ marginBottom: 12 }}><label style={label}>Key benefits / proof points</label><textarea className="in" rows={3} value={bk.benefits} onChange={e => setBk({ ...bk, benefits: e.target.value })} placeholder="What makes you great - benefits, results, guarantees, social proof…" style={{ resize: "vertical" }} /></div>
          <div style={{ marginBottom: 12 }}><label style={label}>Words / claims to avoid</label><input className="in" value={bk.avoid} onChange={e => setBk({ ...bk, avoid: e.target.value })} placeholder="e.g. 'cheap', 'guaranteed', competitor names" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={label}>Default audience</label><input className="in" value={bk.audience} onChange={e => setBk({ ...bk, audience: e.target.value })} placeholder="e.g. women 25-40, clean beauty" /></div>
            <div><label style={label}>Default platform</label><select className="in" value={bk.platform} onChange={e => setBk({ ...bk, platform: e.target.value })}>{PLATFORMS.map(p => <option key={p} value={p}>{p || "—"}</option>)}</select></div>
          </div>
        </div>

        <button className="btn btn-spark" onClick={saveProfile} disabled={savingProfile} style={{ marginBottom: 28 }}>{savingProfile ? "Saving…" : "Save profile & brand kit"}</button>

        {/* Password */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Password</div>
          {isPasswordUser ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 360 }}>
              <input className="in" type="password" placeholder="Current password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} />
              <input className="in" type="password" placeholder="New password (min 6)" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} />
              <button className="btn" onClick={savePassword} disabled={savingPw} style={{ width: "fit-content" }}>{savingPw ? "Updating…" : "Update password"}</button>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "#8b97b3" }}>You sign in with Google, so there's no password to manage here.</div>
          )}
        </div>
      </div>
    </main>
  );
}
