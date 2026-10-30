import { createSign } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createMuxToken(playbackId: string, audience: "v" | "t", options: Record<string, string | number> = {}) {
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const rawPrivateKey = process.env.MUX_PRIVATE_KEY?.trim();
  const privateKey = rawPrivateKey?.includes("BEGIN")
    ? rawPrivateKey.replace(/\\n/g, "\n")
    : rawPrivateKey
      ? Buffer.from(rawPrivateKey, "base64").toString("utf8")
      : undefined;
  if (!keyId) throw new Error("MUX_SIGNING_KEY_ID is missing in Vercel.");
  if (!privateKey) throw new Error("MUX_PRIVATE_KEY is missing in Vercel.");
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    aud: audience,
    sub: playbackId,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    kid: keyId,
    ...options,
  }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();
  return `${header}.${payload}.${base64Url(signer.sign(privateKey))}`;
}

export async function GET(request: NextRequest) {
  const playbackId = request.nextUrl.searchParams.get("playbackId");
  if (!playbackId || !/^[A-Za-z0-9]+$/.test(playbackId)) {
    return NextResponse.json({ error: "Invalid video." }, { status: 400 });
  }

  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    const token = createMuxToken(playbackId, "v");
    const thumbnailToken = createMuxToken(playbackId, "t", { time: 1, width: 1280 });
    return NextResponse.json({ token, thumbnailToken }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Mux signing error.";
    console.error("Mux token signing failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
