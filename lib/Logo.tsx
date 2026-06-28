import React from "react";

// Standalone AdSpark brand mark (spark glyph + animated wordmark).
export function Logo({ size = 22, wordmark = true }: { size?: number; wordmark?: boolean }) {
  const s = size + 6;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontWeight: 900, fontSize: size, lineHeight: 1 }}>
      <svg width={s} height={s} viewBox="0 0 64 64" aria-hidden="true" style={{ flexShrink: 0 }}>
        <defs>
          <linearGradient id="adspark-logo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7c5cff" />
            <stop offset="1" stopColor="#4f8cff" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="60" height="60" rx="16" fill="#0d1120" stroke="url(#adspark-logo)" strokeWidth="3" />
        <path d="M35 10 L18 36 H30 L27 54 L46 26 H33 Z" fill="url(#adspark-logo)" />
      </svg>
      {wordmark && (
        <span className="grad-animate" style={{ background: "linear-gradient(135deg,#7c5cff,#4f8cff,#7c5cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AdSpark AI</span>
      )}
    </span>
  );
}
