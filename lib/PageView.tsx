"use client";
// lib/PageView.tsx - first-party client analytics. track() fires a beacon to /api/event;
// <PageView name=".."/> logs a page_view on mount. Safe to drop into any page.
import { useEffect } from "react";

export function track(name: string, props?: any) {
  try {
    const body = JSON.stringify({ name, props: props || {} });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/event", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/event", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    }
  } catch { /* analytics is best-effort */ }
}

export function PageView({ name }: { name: string }) {
  useEffect(() => { track("page_view", { page: name }); }, [name]);
  return null;
}
