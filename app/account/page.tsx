"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { CustomerNav } from "@/lib/CustomerNav";
import { PLAN_LIST } from "@/lib/plans";

export default function AccountPage() {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [billingBusy, setBillingBusy] = useState(false);
  const [serviceBusy, setServiceBusy] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  useEffect(() => { if (user) load(); }, [user]); // eslint-disable-line
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("checkout");
    if (c === "success") setNotice("✅ Subscription updated - your new plan is active.");
    else if (c === "cancel") setNotice("Checkout canceled - no changes were made.");
  }, []);

  async function load() {
    try {
      const t = await getToken(); if (!t) return;
      const r = await fetch("/api/me", { headers: { Authorization: `Bearer ${t}` } });
      const j = await r.json();
      if (j.ok) setMe(j); else setErr(j.error);
    } catch (e: any) { setErr(e.message); }
  }

  function upgrade(planId: string) {
    // On-site embedded checkout (no redirect to Stripe) - see app/checkout/page.tsx.
    router.push(`/checkout?plan=${planId}`);
  }

  async function manageBilling() {
    setBillingBusy(true); setErr(null);
    try {
      const t = await getToken(); if (!t) return;
      const r = await fetch("/api/portal", { method: "POST", headers: { Authorization: `Bearer ${t}` } });
      const j = await r.json();
      if (j.url) { window.location.href = j.url; return; }
      setErr(j.error || "Could not open billing portal.");
    } catch (e: any) { setErr(e.message); }
    finally { setBillingBusy(false); }
  }

  async function requestService() {
    setServiceBusy(true); setErr(null);
    try {
      const t = await getToken(); if (!t) return;
      const r = await fetch("/api/service-request", { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Couldn't submit request.");
      setNotice("✅ Done-for-you requested - we'll reach out within one business day. Track it in your portal.");
      await load();
    } catch (e: any) { setErr(e.message); }
    finally { setServiceBusy(false); }
  }

  if (loading || !user) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#8b97b3" }}>Loading…</main>;

  const used = me?.used ?? 0, quota = me?.plan?.quota ?? 0;
  const pct = quota ? Math.min(100, Math.round((used / quota) * 100)) : 0;

  return (
    <main style={{ minHeight: "100vh" }}>
      <CustomerNav active="account" />

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "24px 18px 60px" }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>Account</h1>
        <div style={{ color: "#8b97b3", fontSize: 13, marginBottom: 14 }}>{user.email}</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <a href="/settings" className="btn-ghost btn" style={{ padding: "6px 12px", fontSize: 12.5 }}>⚙ Settings & brand kit</a>
          <a href="/portal" className="btn-ghost btn" style={{ padding: "6px 12px", fontSize: 12.5 }}>Client portal</a>
        </div>
        {notice && <div style={{ color: "#34d399", marginBottom: 16, fontSize: 13.5 }}>{notice}</div>}
        {err && <div style={{ color: "#ff6b6b", marginBottom: 16 }}>{err}</div>}

        {/* Plan + usage */}
        <div className="card" style={{ padding: 18, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div><div style={{ fontSize: 12, color: "#8b97b3" }}>Current plan</div><div style={{ fontSize: 20, fontWeight: 800 }}>{me?.plan?.name || " - "}</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 12, color: "#8b97b3" }}>This month</div><div style={{ fontSize: 20, fontWeight: 800 }}>{used} / {quota}</div></div>
          </div>
          <div style={{ height: 8, background: "#1a2138", borderRadius: 6, overflow: "hidden", marginTop: 12 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#7c5cff,#4f8cff)" }} />
          </div>
          <div style={{ fontSize: 12, color: "#8b97b3", marginTop: 6 }}>{me?.remaining ?? 0} generations remaining</div>
        </div>

        {/* Upgrade */}
        <div style={{ fontSize: 16, fontWeight: 800, margin: "8px 0 12px" }}>Plans</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
          {PLAN_LIST.map(p => {
            const current = me?.plan?.id === p.id;
            return (
              <div key={p.id} className="card" style={{ padding: 16, border: current ? "1.5px solid #34d399" : undefined }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{p.name}</div>
                <div style={{ fontSize: 24, fontWeight: 900, margin: "4px 0" }}>${p.priceUsd}<span style={{ fontSize: 12, color: "#8b97b3" }}>{p.priceUsd ? "/mo" : ""}</span></div>
                <div style={{ fontSize: 12, color: "#9aa6c2", marginBottom: 10 }}>{p.quota.toLocaleString()} gens · {p.variants} variations · {p.images} img</div>
                {current ? (
                  <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "#34d399" }}>✓ Current</div>
                ) : p.priceUsd ? (
                  <button className="btn" onClick={() => upgrade(p.id)} disabled={billingBusy} style={{ width: "100%", fontSize: 12.5 }}>
                    {billingBusy ? "…" : "Upgrade"}
                  </button>
                ) : (
                  <div style={{ textAlign: "center", fontSize: 12, color: "#8b97b3" }}>Free</div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
          {me?.plan?.id && me.plan.id !== "free" && (
            <button className="btn-ghost btn" onClick={manageBilling} disabled={billingBusy} style={{ fontSize: 12.5, padding: "8px 14px" }}>Manage billing</button>
          )}
          <span style={{ fontSize: 12, color: "#6b7690" }}>🔒 Secure checkout & billing by Stripe.</span>
        </div>

        {/* Full suite (done-for-you) - opt-in switch, observable status */}
        <div className="card" style={{ padding: 18, marginBottom: 28, border: "1.5px solid #2c3450", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14, background: "linear-gradient(135deg,#0d1120,#10142a)" }}>
          <div style={{ minWidth: 240, flex: "1 1 320px" }}>
            <div style={{ fontSize: 12, letterSpacing: 1.5, color: "#7c5cff", textTransform: "uppercase", fontWeight: 800, marginBottom: 6 }}>Full suite · done-for-you</div>
            {me?.serviceStatus === "active" ? (
              <>
                <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>✓ Done-for-you is active</div>
                <div style={{ fontSize: 13, color: "#9aa6c2", lineHeight: 1.5 }}>We're running your ads end-to-end. Track campaigns & reports in your portal.</div>
              </>
            ) : me?.serviceStatus === "requested" ? (
              <>
                <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>✓ Requested - we'll be in touch</div>
                <div style={{ fontSize: 13, color: "#9aa6c2", lineHeight: 1.5 }}>We'll reach out within one business day. You stay in self-serve meanwhile; track status in your portal.</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>Want us to run your ads instead?</div>
                <div style={{ fontSize: 13, color: "#9aa6c2", lineHeight: 1.5 }}>Switch on the full suite - we build, launch, and report end-to-end. Flat price, no % of ad spend. You keep self-serve until then.</div>
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
            {(me?.serviceStatus === "requested" || me?.serviceStatus === "active") ? (
              <a href="/portal" className="btn" style={{ padding: "11px 18px", fontSize: 14, whiteSpace: "nowrap" }}>Open portal →</a>
            ) : (
              <>
                <a href="/done-for-you" className="btn-ghost btn" style={{ padding: "11px 16px", fontSize: 14, whiteSpace: "nowrap" }}>See plans</a>
                <button onClick={requestService} disabled={serviceBusy} className="btn" style={{ padding: "11px 18px", fontSize: 14, whiteSpace: "nowrap" }}>{serviceBusy ? "…" : "Turn it on →"}</button>
              </>
            )}
          </div>
        </div>

        {/* History */}
        <div style={{ fontSize: 16, fontWeight: 800, margin: "8px 0 12px" }}>Recent generations</div>
        {(!me?.history || me.history.length === 0) ? (
          <div className="card" style={{ padding: 20, color: "#8b97b3", fontSize: 13 }}>No generations yet - <a href="/app" style={{ color: "#7c5cff" }}>create your first ad set</a>.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {me.history.map((h: any) => (
              <div key={h.id} className="card" style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.brief?.product || " - "}</div>
                  <div style={{ fontSize: 11.5, color: "#8b97b3" }}>{h.brief?.platform} · {h.variations?.length || 0} variations · {h.imageCount || 0} images</div>
                </div>
                <div style={{ fontSize: 11, color: "#6b7690", flexShrink: 0 }}>{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : ""}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
