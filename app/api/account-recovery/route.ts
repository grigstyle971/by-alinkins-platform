import { NextResponse } from "next/server";
import { createAccountSetupCode } from "@/lib/account-setup-code";

export const runtime = "nodejs";

const recentRequests = new Map<string, number>();
const MIN_REQUEST_INTERVAL_MS = 60 * 1000;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: unknown; captchaToken?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const captchaToken = typeof body?.captchaToken === "string" ? body.captchaToken : "";
  const now = Date.now();
  const lastRequestAt = recentRequests.get(email) ?? 0;
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;

  if (!turnstileSecret || !captchaToken) {
    console.warn("Password recovery code was blocked: Turnstile is not configured or was not completed.");
    return NextResponse.json({ ok: true });
  }

  const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret: turnstileSecret, response: captchaToken }),
  }).then((response) => response.json() as Promise<{ success?: boolean }>).catch(() => ({ success: false }));

  // Always return the same response: this prevents probing which emails have accounts.
  if (verification.success && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && now - lastRequestAt >= MIN_REQUEST_INTERVAL_MS) {
    recentRequests.set(email, now);
    try {
      await createAccountSetupCode(email, "recovery");
    } catch (error) {
      console.warn("Password recovery code was not sent:", error instanceof Error ? error.message : error);
    }
  }

  return NextResponse.json({ ok: true });
}
