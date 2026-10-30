import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * The PostHog project token is intentionally public. Serving it at runtime
 * avoids Next.js freezing an empty NEXT_PUBLIC value into a static build.
 */
export async function GET() {
  // A PostHog project key is a public browser identifier, not a secret.
  // Keep it as a fallback in case a Vercel build omits NEXT_PUBLIC variables.
  const key =
    process.env.NEXT_PUBLIC_POSTHOG_KEY ??
    "phc_oQNYRcvDy3nZnsDt5ReU9AFLiZYXTZzQUdo7HC57j3F3";
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

  return NextResponse.json(
    { enabled: Boolean(key), key, host },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
