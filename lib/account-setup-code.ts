import { getSupabaseAdmin } from "@/lib/supabase-admin";

const DEFAULT_FROM = "by.alinkins <hello@by-alinkins.com>";

type SetupCodeType = "invite" | "recovery";

function codeEmailHtml(code: string, type: SetupCodeType) {
  const recovery = type === "recovery";
  return `<!doctype html>
<html lang="en">
  <head><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no"></head>
  <body style="margin:0;padding:0;background:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);color:#211f1d;font-family:Arial,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="background:#ffffff;background-image:linear-gradient(#ffffff,#ffffff)"><tr><td align="center" style="padding:32px 16px;background:#ffffff;background-image:linear-gradient(#ffffff,#ffffff)">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:560px;background:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);border:1px solid #ded6cf;border-radius:16px">
        <tr><td style="padding:28px 40px 0;text-align:center;color:#211f1d;font-size:20px;letter-spacing:-.5px">by.alinkins</td></tr>
        <tr><td style="padding:28px 40px 38px;text-align:center">
          <p style="margin:0 0 15px;color:#4f4944;font-size:11px;font-weight:700;letter-spacing:2px">${recovery ? "PASSWORD RESET" : "YOUR PROGRAM IS READY"}</p>
          <h1 style="margin:0 0 17px;color:#211f1d;font-size:34px;font-weight:600;line-height:1.12">${recovery ? "Reset your password" : "Create your password"}</h1>
          <p style="margin:0 auto 22px;max-width:390px;color:#4f4944;font-size:16px;line-height:1.6">${recovery ? "Use this one-time code to choose a new password." : "Use this one-time code to create a password and access your personal program space."}</p>
          <div x-apple-data-detectors="false" style="margin:0 auto 25px;padding:17px 16px;border:1px solid #ded6cf;border-radius:10px;background:#f7f4f1;color:#211f1d;font-size:31px;font-weight:700;letter-spacing:8px;line-height:1">${code}</div>
        </td></tr>
        <tr><td bgcolor="#ffffff" style="padding:18px 32px;background:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);border-radius:0 0 16px 16px;color:#4f4944;font-size:12px;line-height:1.55;text-align:center">This code can be used once and expires in one hour. Do not share it with anyone.</td></tr>
      </table>
    </td></tr></table>
  </body>
</html>`;
}

async function sendSetupCode(email: string, code: string, type: SetupCodeType) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM,
      to: [email],
      subject: type === "recovery" ? "Reset your password" : "Create your password",
      html: codeEmailHtml(code, type),
      text: `${type === "recovery" ? "Your password reset" : "Your account setup"} code is: ${code}\n\nThis code can be used once and expires in one hour. Do not share it.`,
    }),
  });

  if (!response.ok) throw new Error(`Resend rejected the account setup email (${response.status}).`);
}

/** Generates an Invite OTP and delivers it through the branded Resend sender. */
export async function createAccountSetupCode(email: string, type: SetupCodeType = "invite") {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured.");

  const { data, error } = await getSupabaseAdmin().auth.admin.generateLink({ type, email });
  if (error || !data.user || !data.properties.email_otp) {
    throw new Error(error?.message ?? "Could not create an account setup code.");
  }

  // The URL contains no secret. Email scanners can open it safely; only the
  // code the customer enters on the page verifies the account.
  await sendSetupCode(email, data.properties.email_otp, type);
  return data.user;
}
