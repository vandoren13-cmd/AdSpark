"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

export default function LoginPage() {
  const { user, loading, signIn, signUp, signInGoogle, resetPassword } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && user) router.replace("/dashboard"); }, [user, loading, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setNotice(null); setBusy(true);
    try {
      if (mode === "reset") {
        if (!email.trim()) throw new Error("Enter your email to reset your password.");
        await resetPassword(email.trim());
        setNotice("Check your inbox - we've sent a password reset link.");
      } else {
        mode === "in" ? await signIn(email, pw) : await signUp(email, pw);
        router.replace("/dashboard");
      }
    }
    catch (e: any) { setErr(e?.message?.replace("Firebase:", "").trim() || "Failed"); }
    finally { setBusy(false); }
  }
  async function google() {
    setErr(null); setNotice(null); setBusy(true);
    try { await signInGoogle(); router.replace("/dashboard"); }
    catch (e: any) { setErr(e?.message?.replace("Firebase:", "").trim() || "Failed"); }
    finally { setBusy(false); }
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="card" style={{ width: "100%", maxWidth: 400, padding: 28 }}>
        <a href="/" style={{ textDecoration: "none", fontWeight: 900, fontSize: 20, letterSpacing: 0.5 }}>
          <span style={{ background: "linear-gradient(135deg,#7c5cff,#4f8cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AdSpark AI</span>
        </a>
        <h1 style={{ fontSize: 20, margin: "16px 0 4px" }}>{mode === "in" ? "Welcome back" : mode === "up" ? "Create your account" : "Reset your password"}</h1>
        <p style={{ color: "#8b97b3", fontSize: 13, marginTop: 0 }}>{mode === "in" ? "Sign in to generate ads." : mode === "up" ? "Start with 5 free generations - no card." : "Enter your email and we'll send you a reset link."}</p>

        {mode !== "reset" && (
          <>
            <button className="btn" onClick={google} disabled={busy} style={{ width: "100%", background: "#fff", color: "#1a1a2e", marginTop: 14 }}>
              Continue with Google
            </button>
            <div style={{ textAlign: "center", color: "#5b6680", fontSize: 12, margin: "14px 0" }}>or</div>
          </>
        )}

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: mode === "reset" ? 14 : 0 }}>
          <input className="in" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          {mode !== "reset" && <input className="in" type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} required minLength={6} />}
          {err && <div style={{ color: "#ff6b6b", fontSize: 12.5 }}>{err}</div>}
          {notice && <div style={{ color: "#34d399", fontSize: 12.5 }}>{notice}</div>}
          <button className="btn" type="submit" disabled={busy} style={{ width: "100%" }}>{busy ? "…" : mode === "in" ? "Sign in" : mode === "up" ? "Create account" : "Send reset link"}</button>
        </form>

        {mode === "in" && (
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <button onClick={() => { setMode("reset"); setErr(null); setNotice(null); }} style={{ background: "none", border: "none", color: "#8b97b3", cursor: "pointer", fontSize: 12.5 }}>Forgot password?</button>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "#8b97b3" }}>
          {mode === "reset" ? (
            <button onClick={() => { setMode("in"); setErr(null); setNotice(null); }} style={{ background: "none", border: "none", color: "#7c5cff", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>← Back to sign in</button>
          ) : (
            <>
              {mode === "in" ? "New here? " : "Already have an account? "}
              <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(null); setNotice(null); }} style={{ background: "none", border: "none", color: "#7c5cff", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                {mode === "in" ? "Create one" : "Sign in"}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
