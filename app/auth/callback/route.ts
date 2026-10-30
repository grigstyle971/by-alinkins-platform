import { createServerClient } from "@supabase/ssr";
import { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const requestedNext = url.searchParams.get("next") ?? "/my-programs";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/my-programs";
  const cookieStore = await cookies();
  const destination = new URL(next, url.origin);
  const response = NextResponse.redirect(destination);
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items: { name: string; value: string; options?: any }[]) => items.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
    }
  });

  let error: Error | null = null;
  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
  } else {
    error = new Error("The account link is missing or invalid.");
  }

  if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("This account link is invalid or has expired. Please contact support.")}`, url.origin));
  return response;
}
