// lib/emails.ts - SERVER ONLY. Branded transactional email templates.
// Each returns { subject, html }; pass to sendEmail() from lib/email.ts.
const APP = () => process.env.NEXT_PUBLIC_APP_URL || "https://adspark.ai";

const shell = (heading: string, body: string, cta?: { label: string; href: string }) => `
<div style="background:#07080f;padding:32px 0;font-family:Inter,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#0d1120;border:1px solid #1c2238;border-radius:16px;padding:28px;color:#e7ecf5">
    <div style="font-weight:900;font-size:20px;background:linear-gradient(135deg,#7c5cff,#4f8cff);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:18px">AdSpark AI</div>
    <h1 style="font-size:20px;margin:0 0 12px">${heading}</h1>
    <div style="font-size:14px;line-height:1.6;color:#c7d0e6">${body}</div>
    ${cta ? `<a href="${cta.href}" style="display:inline-block;margin-top:20px;background:linear-gradient(135deg,#7c5cff,#4f8cff);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 18px;border-radius:10px">${cta.label}</a>` : ""}
    <div style="margin-top:26px;border-top:1px solid #1c2238;padding-top:14px;font-size:11px;color:#5b6680">AdSpark AI · AI ad creative, on autopilot</div>
  </div>
</div>`;

export function welcomeEmail() {
  return {
    subject: "Welcome to AdSpark AI 🚀",
    html: shell(
      "You're in. Let's make ads that convert.",
      `Describe your product once and AdSpark writes platform-native copy, captions, hashtags and CTAs - and generates matching ad images - in seconds. You've got <b style="color:#e7ecf5">5 free generations</b> to start.<br/><br/>Want us to run the ads end-to-end instead? Reply to this email or check out our done-for-you plans.`,
      { label: "Create your first ad set →", href: `${APP()}/app` },
    ),
  };
}

export function newLeadEmail(lead: any) {
  const rows = [
    ["Name", lead.name], ["Email", lead.email], ["Company", lead.company],
    ["Website", lead.website], ["Monthly spend", lead.monthlySpend], ["Interested in", lead.tier],
  ].filter(([, v]) => v).map(([k, v]) => `<tr><td style="padding:3px 10px 3px 0;color:#8b97b3">${k}</td><td style="color:#e7ecf5">${v}</td></tr>`).join("");
  return {
    subject: `New AdSpark lead: ${lead.company || lead.email}`,
    html: shell(
      "New done-for-you lead",
      `<table style="font-size:13px;border-collapse:collapse">${rows}</table>${lead.message ? `<br/><div style="background:#0a0e1c;border:1px solid #1c2238;border-radius:10px;padding:12px;color:#aeb9d4">${lead.message}</div>` : ""}`,
      { label: "Open the operator console →", href: `${APP()}/admin` },
    ),
  };
}

export function leadAckEmail(lead: any) {
  return {
    subject: "We got your AdSpark application",
    html: shell(
      `Thanks${lead.name ? `, ${lead.name}` : ""} - we'll be in touch.`,
      `We've received your application and we'll review it within one business day. Expect a short reply with <b style="color:#e7ecf5">3 ad concepts we'd test for you</b> - no charge, no obligation.<br/><br/>In the meantime, you can explore the self-serve generator if you'd like to see the engine in action.`,
      { label: "Try the generator →", href: `${APP()}/login` },
    ),
  };
}

export function reportReadyEmail(clientName: string, reportUrl: string, summary: string) {
  return {
    subject: "Your AdSpark performance report is ready",
    html: shell(
      `This week's report${clientName ? ` for ${clientName}` : ""}`,
      `${summary}<br/><br/>Open the full report for the campaign-by-campaign breakdown.`,
      { label: "View report →", href: reportUrl },
    ),
  };
}

export function quotaWarningEmail(planName: string, used: number, quota: number) {
  return {
    subject: "You're running low on generations",
    html: shell(
      "You've used most of your generations",
      `You've used <b style="color:#e7ecf5">${used} of ${quota}</b> generations on the ${planName} plan this month. Upgrade any time to keep creating without interruption - more generations, more variations, and more AI video.`,
      { label: "Upgrade your plan →", href: `${APP()}/account` },
    ),
  };
}

// Sent to the support inbox when a customer opens a ticket (CS agent works it in /admin).
export function supportReceivedEmail(t: { email: string; subject: string; message: string }) {
  return {
    subject: `New support request: ${t.subject || t.email}`,
    html: shell(
      "New customer support request",
      `<div style="font-size:13px"><b style="color:#e7ecf5">From:</b> ${t.email}<br/><b style="color:#e7ecf5">Subject:</b> ${t.subject || "(none)"}</div><br/><div style="background:#0a0e1c;border:1px solid #1c2238;border-radius:10px;padding:12px;color:#aeb9d4">${t.message}</div>`,
      { label: "Open Support in the console →", href: `${APP()}/admin` },
    ),
  };
}

// Sent to the customer when the CS agent replies to their ticket from /admin.
export function supportReplyEmail(subject: string, reply: string) {
  return {
    subject: `Re: ${subject || "your AdSpark support request"}`,
    html: shell(
      "A reply from AdSpark support",
      `${reply}<br/><br/><span style="color:#8b97b3">Just reply to this email if you need anything else.</span>`,
      { label: "Open AdSpark →", href: `${APP()}/app` },
    ),
  };
}
