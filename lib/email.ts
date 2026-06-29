// lib/email.ts - SERVER ONLY. Pluggable transactional email.
//   • Primary: Resend HTTP API (raw fetch, no SDK - zero extra connectors).
//   • No-op:   logs and returns ok when unconfigured, so the app runs and dev/CI
//              never send real mail. Same env-gated pattern as lib/stripe.ts.
// Activate by setting RESEND_API_KEY (+ EMAIL_FROM on a verified domain).
import { randomUUID } from "crypto";

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  idempotencyKey?: string;
}
export interface SendEmailResult { ok: boolean; id?: string; provider: "resend" | "noop"; error?: string; }

const FROM = () => process.env.EMAIL_FROM || "AdSpark AI <onboarding@resend.dev>";
const REPLY_TO = () => process.env.EMAIL_REPLY_TO || undefined;
const KEY = () => process.env.RESEND_API_KEY || "";

export const emailReady = () => !!KEY();

const htmlToText = (html: string) =>
  html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const to = Array.isArray(input.to) ? input.to : [input.to];
  const text = input.text ?? htmlToText(input.html);
  const replyTo = input.replyTo ?? REPLY_TO();

  if (!KEY()) {
    console.warn(`[email] not configured - no-op. to=${to.join(",")} subject=${JSON.stringify(input.subject)}`);
    return { ok: true, provider: "noop" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY()}`,
        "Content-Type": "application/json",
        "User-Agent": "adspark-ai/1.0",            // Resend rejects raw calls without a UA
        "Idempotency-Key": input.idempotencyKey || randomUUID(), // 24h safe-retry window
      },
      body: JSON.stringify({
        from: FROM(), to, subject: input.subject, html: input.html, text,
        ...(replyTo ? { reply_to: replyTo } : {}),
        ...(input.headers ? { headers: input.headers } : {}),
      }),
    });
    if (!res.ok) {
      const b = await res.text();
      console.error(`[email] resend ${res.status}: ${b}`);
      return { ok: false, provider: "resend", error: `${res.status} ${b}` };
    }
    const { id } = (await res.json()) as { id: string };
    return { ok: true, provider: "resend", id };
  } catch (e: any) {
    console.error("[email] threw", e);
    return { ok: false, provider: "resend", error: String(e) };
  }
}
