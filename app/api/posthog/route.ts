import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ??
  "phc_oQNYRcvDy3nZnsDt5ReU9AFLiZYXTZzQUdo7HC57j3F3";
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

type AnalyticsEvent = {
  event?: unknown;
  distinctId?: unknown;
  properties?: unknown;
};

/** First-party proxy keeps analytics working when browser tracker blocking is enabled. */
export async function POST(request: Request) {
  let body: AnalyticsEvent;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.event !== "string" || typeof body.distinctId !== "string") {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const properties = body.properties && typeof body.properties === "object" ? body.properties : {};
  const upstream = await fetch(`${POSTHOG_HOST}/i/v0/e/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: POSTHOG_KEY,
      event: body.event,
      properties: {
        ...properties,
        distinct_id: body.distinctId,
        $lib: "by-alinkins-web",
        $current_url: request.headers.get("referer") ?? "",
      },
      timestamp: new Date().toISOString(),
    }),
    cache: "no-store",
  });

  return new NextResponse(null, { status: upstream.ok ? 204 : 502 });
}
