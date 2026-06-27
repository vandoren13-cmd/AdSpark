import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

// NOTE: Template terms for launch — have counsel review before relying on these.
export default function Terms() {
  const h: React.CSSProperties = { fontSize: 18, fontWeight: 800, margin: "26px 0 8px" };
  const p: React.CSSProperties = { fontSize: 14, color: "#9aa6c2", lineHeight: 1.7, margin: "0 0 10px" };
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 22px 70px" }}>
      <a href="/" style={{ textDecoration: "none", fontWeight: 900, fontSize: 18, background: "linear-gradient(135deg,#7c5cff,#4f8cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AdSpark AI</a>
      <h1 style={{ fontSize: 30, fontWeight: 900, margin: "18px 0 4px" }}>Terms of Service</h1>
      <div style={{ color: "#6b7690", fontSize: 12.5, marginBottom: 10 }}>Last updated: June 2026</div>
      <div style={{ background: "#1a1407", border: "1px solid #4a3a12", color: "#e8c878", borderRadius: 10, padding: 12, fontSize: 12.5, marginBottom: 20 }}>⚠️ Template for launch — review with legal counsel before relying on it.</div>

      <h2 style={h}>1. Agreement</h2>
      <p style={p}>By accessing or using AdSpark AI (the "Service"), you agree to these Terms. If you do not agree, do not use the Service. AdSpark AI is operated by AdSpark AI ("we", "us"), a VanDoren-EMPIRE company.</p>

      <h2 style={h}>2. The Service</h2>
      <p style={p}>AdSpark provides AI-generated advertising creative (copy and images) on a self-serve basis, and an optional done-for-you ad-management service. AI output may contain errors or inaccuracies; you are responsible for reviewing all creative before publishing it.</p>

      <h2 style={h}>3. Plans, quotas & billing</h2>
      <p style={p}>Self-serve plans include a monthly generation quota that resets each billing period. Paid plans are billed in advance via Stripe and renew automatically until cancelled. Done-for-you service is billed as a flat monthly retainer, separate from your own ad spend. Fees are non-refundable except where required by law.</p>

      <h2 style={h}>4. Acceptable use</h2>
      <p style={p}>You agree not to use the Service to create deceptive, infringing, or unlawful advertising; to impersonate real people without consent; to present AI personas as real customers; or to violate any ad platform's policies. You are responsible for the legality of the ads you run and for complying with FTC and platform AI-disclosure rules.</p>

      <h2 style={h}>5. Your content & ownership</h2>
      <p style={p}>You retain ownership of the briefs you submit and, subject to your plan and the underlying model providers' terms, the creative generated for you. You grant us a license to process your content to provide and improve the Service, including aggregated, de-identified performance data.</p>

      <h2 style={h}>6. Third-party services</h2>
      <p style={p}>The Service relies on third parties (e.g. AI model providers, ad platforms, payment processors). Their availability and terms are outside our control, and your use of connected platforms is also governed by their terms.</p>

      <h2 style={h}>7. Disclaimers & liability</h2>
      <p style={p}>The Service is provided "as is" without warranties of any kind. We do not guarantee any advertising result, ROAS, or outcome. To the maximum extent permitted by law, our total liability is limited to the fees you paid in the 3 months preceding the claim.</p>

      <h2 style={h}>8. Termination</h2>
      <p style={p}>You may cancel at any time. We may suspend or terminate access for breach of these Terms. Sections that by their nature should survive termination will survive.</p>

      <h2 style={h}>9. Changes & contact</h2>
      <p style={p}>We may update these Terms; continued use after changes constitutes acceptance. Questions: support@adspark.ai.</p>

      <div style={{ marginTop: 30, fontSize: 12.5 }}><a href="/privacy" style={{ color: "#7c5cff" }}>Privacy Policy</a> · <a href="/" style={{ color: "#7c5cff" }}>Home</a></div>
    </main>
  );
}
