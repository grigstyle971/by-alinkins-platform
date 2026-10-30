import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("t");
  // Supabase can issue either a hexadecimal token or a URL-safe encoded one,
  // depending on the auth flow. It is verified by Supabase after redirect;
  // only reject clearly malformed input here.
  if (!token || token.length > 1024 || /[\s]/.test(token)) {
    return NextResponse.redirect(new URL("/set-password?error=invalid-link", getSiteUrl()));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return NextResponse.redirect(new URL("/set-password?error=configuration", getSiteUrl()));

  const verifyUrl = new URL("/auth/v1/verify", supabaseUrl);
  verifyUrl.searchParams.set("token", token);
  verifyUrl.searchParams.set("type", "invite");
  verifyUrl.searchParams.set("redirect_to", `${getSiteUrl()}/set-password`);
  return NextResponse.redirect(verifyUrl);
}
