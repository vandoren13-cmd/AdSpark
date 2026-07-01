"use client";
// lib/CustomerNav.tsx - shared top navigation for the signed-in customer app.
// Persistent across Dashboard, Generator, Creations, Resources, Account, Support.
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

const LINKS: { href: string; label: string; key: string }[] = [
  { href: "/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/app", label: "Generator", key: "app" },
  { href: "/creations", label: "My Creations", key: "creations" },
  { href: "/resources", label: "Resources", key: "resources" },
  { href: "/account", label: "Account", key: "account" },
  { href: "/support", label: "Support", key: "support" },
];

export function CustomerNav({ active, remaining, planName }: { active?: string; remaining?: number | null; planName?: string }) {
  const { user, logout, getToken } = useAuth();
  const router = useRouter();
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    let done = false;
    (async () => {
      try { const t = await getToken(); if (!t || done) return; const r = await fetch("/api/me", { headers: { Authorization: `Bearer ${t}` } }); const j = await r.json(); if (j.ok && !done) setAdmin(!!j.admin); } catch { /* */ }
    })();
    return () => { done = true; };
  }, [user]); // eslint-disable-line

  return (
    <header className="cust-nav glass">
      <a href="/dashboard" style={{ textDecoration: "none", fontWeight: 900, fontSize: 18, flexShrink: 0 }}>
        <span style={{ background: "linear-gradient(135deg,#8b5cff,#4f8cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AdSpark AI</span>
      </a>
      <nav className="cust-links">
        {LINKS.map(l => <a key={l.key} href={l.href} className={`cust-link${active === l.key ? " on" : ""}`}>{l.label}</a>)}
        {admin && <a href="/admin" className="btn" style={{ padding: "7px 12px", fontSize: 13 }}>Admin</a>}
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {typeof remaining === "number" && <span style={{ fontSize: 12.5, color: "#9aa6c2" }}><b style={{ color: "#e7ecf5" }}>{remaining}</b> left{planName ? ` · ${planName}` : ""}</span>}
        <button onClick={() => { logout(); router.replace("/"); }} className="cust-link">Log out</button>
      </div>
    </header>
  );
}
