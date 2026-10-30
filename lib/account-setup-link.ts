import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSiteUrl } from "@/lib/site-url";

const DEFAULT_FROM = "by.alinkins <hello@by-alinkins.com>";

function setupEmailHtml(setupUrl: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta name="color-scheme" content="only light">
    <meta name="supported-color-schemes" content="light">
    <style>
      :root { color-scheme: only light; supported-color-schemes: light; }
      @media (prefers-color-scheme: dark) {
        body, .email-bg { background:#f5ede6 !important; color:#211f1d !important; }
        .email-card { background:#ffffff !important; }
        .email-copy { color:#4f4944 !important; }
        .email-footer { background:#f5ede6 !important; color:#4f4944 !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f5ede6;color:#211f1d;font-family:Arial,sans-serif">
    <table role="presentation" class="email-bg" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f5ede6" style="background-color:#f5ede6"><tr><td align="center" bgcolor="#f5ede6" style="padding:32px 16px;background-color:#f5ede6">
      <table role="presentation" class="email-card" width="560" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:560px;background-color:#ffffff;border:1px solid #ded6cf;border-radius:16px">
        <tr><td style="padding:28px 40px 0;text-align:center;color:#211f1d;font-size:20px;font-weight:400;letter-spacing:-.5px">by.alinkins</td></tr>
        <tr><td bgcolor="#ffffff" style="padding:28px 40px 38px;text-align:center;background-color:#ffffff">
          <p style="margin:0 0 15px;color:#4f4944;font-size:11px;font-weight:700;letter-spacing:2px">YOUR PROGRAM IS READY</p>
          <h1 style="margin:0 0 17px;color:#211f1d;font-family:Arial,sans-serif;font-size:34px;font-weight:600;line-height:1.12">Create your password</h1>
          <p class="email-copy" style="margin:0 auto 30px;max-width:390px;color:#4f4944;font-size:16px;line-height:1.6">Thank you for your purchase. Create a password to access your personal program space.</p>
          <a href="${setupUrl}" style="display:inline-block;padding:15px 23px;border-radius:7px;background:#2e2925;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:.3px;text-decoration:none">CREATE MY PASSWORD</a>
        </td></tr>
        <tr><td class="email-footer" bgcolor="#f5ede6" style="padding:18px 32px;background-color:#f5ede6;border-radius:0 0 16px 16px;color:#4f4944;font-size:12px;line-height:1.55;text-align:center">For your security, this setup link can be used once and expires in one hour.</td></tr>
      </table>
    </td></tr></table>
  </body>
</html>`;
}

async function sendSetupLink(email: string, setupUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM,
      to: [email],
      subject: "Create your password",
      html: setupEmailHtml(setupUrl),
      text: `Thank you for your purchase. Create your password here: ${setupUrl}\n\nThis one-time link expires in one hour.`,
    }),
  });
  if (!response.ok) throw new Error(`Resend rejected the account setup email (${response.status}).`);
}

/** Creates a Supabase invitation, but sends a branded link on our own domain. */
export async function createAccountSetupLink(email: string) {
  const admin = getSupabaseAdmin();
  const siteUrl = getSiteUrl();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo: `${siteUrl}/set-password` },
  });
  if (error || !data.user || !data.properties.hashed_token) {
    throw new Error(error?.message ?? "Could not create an account setup link.");
  }

  const setupUrl = `${siteUrl}/api/account-setup/link?t=${encodeURIComponent(data.properties.hashed_token)}`;
  await sendSetupLink(email, setupUrl);
  return data.user;
}
