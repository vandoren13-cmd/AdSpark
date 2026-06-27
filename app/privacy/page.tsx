import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

// NOTE: Template privacy policy for launch — have counsel review and tailor to your
// actual data practices and jurisdictions (GDPR/CCPA) before relying on it.
export default function Privacy() {
  const h: React.CSSProperties = { fontSize: 18, fontWeight: 800, margin: "26px 0 8px" };
  const p: React.CSSProperties = { fontSize: 14, color: "#9aa6c2", lineHeight: 1.7, margin: "0 0 10px" };
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 22px 70px" }}>
      <a href="/" style={{ textDecoration: "none", fontWeight: 900, fontSize: 18, background: "linear-gradient(135deg,#7c5cff,#4f8cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AdSpark AI</a>
      <h1 style={{ fontSize: 30, fontWeight: 900, margin: "18px 0 4px" }}>Privacy Policy</h1>
      <div style={{ color: "#6b7690", fontSize: 12.5, marginBottom: 10 }}>Last updated: June 2026</div>
      <div style={{ background: "#1a1407", border: "1px solid #4a3a12", color: "#e8c878", borderRadius: 10, padding: 12, fontSize: 12.5, marginBottom: 20 }}>⚠️ Template for launch — review with legal counsel and tailor to GDPR/CCPA before relying on it.</div>

      <h2 style={h}>1. What we collect</h2>
      <p style={p}>Account data (email, authentication identifiers via Firebase), the campaign briefs and content you submit, generated creative and its metadata, usage and quota data, and — for paid plans — billing data processed by Stripe (we do not store full card numbers). For done-for-you clients, we process the ad-account and performance data needed to run your campaigns.</p>

      <h2 style={h}>2. How we use it</h2>
      <p style={p}>To provide and improve the Service: generate creative, enforce quotas, run and report on managed campaigns, process payments, send transactional email, and maintain aggregated, de-identified performance benchmarks. We do not sell your personal data.</p>

      <h2 style={h}>3. AI model providers</h2>
      <p style={p}>Briefs and prompts are sent to AI providers (e.g. Anthropic for copy, OpenAI for images, and ad platforms for deployment) to generate and run your ads. Their processing is governed by their respective terms and privacy policies.</p>

      <h2 style={h}>4. Sharing</h2>
      <p style={p}>We share data only with service providers that help us operate (hosting, Firebase, Stripe, email, AI and ad platforms), and where required by law. We may share aggregated, non-identifying insights (e.g. "what converts" benchmarks).</p>

      <h2 style={h}>5. Retention & security</h2>
      <p style={p}>We retain data for as long as your account is active or as needed to provide the Service and meet legal obligations. Data is stored with reputable providers; access is restricted to server-side systems. No method of transmission or storage is 100% secure.</p>

      <h2 style={h}>6. Your rights</h2>
      <p style={p}>Depending on your jurisdiction (e.g. GDPR, CCPA), you may have rights to access, correct, delete, or port your data, and to object to certain processing. Contact us to exercise them.</p>

      <h2 style={h}>7. Contact</h2>
      <p style={p}>Privacy questions: privacy@adspark.ai.</p>

      <div style={{ marginTop: 30, fontSize: 12.5 }}><a href="/terms" style={{ color: "#7c5cff" }}>Terms of Service</a> · <a href="/" style={{ color: "#7c5cff" }}>Home</a></div>
    </main>
  );
}
