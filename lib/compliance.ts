// lib/compliance.ts - AI-disclosure compliance. The FTC regime is functional (deception is
// the violation, not AI itself); platforms (TikTok strictest) require AI labels and auto-detect
// via provenance metadata. We attach a compliance record to every asset, surface a visible
// "AI-generated" label, and document the policy. NOTE: embedding IPTC DigitalSourceType +
// signed C2PA Content Credentials into the image bytes (what triggers platform auto-labels)
// needs an image library + a trust-listed signing cert - tracked in COMPLIANCE.md as the
// keys-required follow-up. This module covers the record + disclosure layer that ships today.

export const COMPLIANCE_POLICY_VERSION = "2026-06";
export const AI_DISCLOSURE_LABEL = "AI-generated";
export const AI_DISCLOSURE_TEXT = "Contains content generated with AI.";

export interface ComplianceRecord {
  aiGenerated: true;
  copyModel: string;
  imageEngine: string | null;
  disclosure: string;
  policyVersion: string;
}

export function complianceRecord(opts: { model?: string; imageEngine?: string; images: number }): ComplianceRecord {
  return {
    aiGenerated: true,
    copyModel: opts.model || "claude-opus-4-8",
    imageEngine: opts.images > 0 ? (opts.imageEngine || process.env.IMAGE_ENGINE || "openai-gpt-image-1") : null,
    disclosure: AI_DISCLOSURE_TEXT,
    policyVersion: COMPLIANCE_POLICY_VERSION,
  };
}
