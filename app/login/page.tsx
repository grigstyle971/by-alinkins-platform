"use client";

import Link from "next/link";
import { FormEvent, useCallback, useState } from "react";
import { getSupabase } from "@/lib/supabase-browser";
import Turnstile from "@/components/Turnstile";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 60 * 1000;
const LOGIN_GUARD_KEY = "by-alinkins-login-guard";

type LoginGuard = { failures: number; lockedUntil: number };

function readLoginGuard(): LoginGuard {
  if (typeof window === "undefined") return { failures: 0, lockedUntil: 0 };
  try {
    const saved = window.localStorage.getItem(LOGIN_GUARD_KEY);
    if (!saved) return { failures: 0, lockedUntil: 0 };
    const guard = JSON.parse(saved) as LoginGuard;
    // Keep counting failed attempts until a lock expires. Previously, an unlocked
    // guard was reset here, so it could never reach the fifth failed attempt.
    const now = Date.now();
    if (guard.lockedUntil && guard.lockedUntil <= now) return { failures: 0, lockedUntil: 0 };
    // Shorten locks that were stored by the earlier 15-minute setting.
    if (guard.lockedUntil > now + LOCK_DURATION_MS) return { failures: 0, lockedUntil: now + LOCK_DURATION_MS };
    return guard;
  } catch {
    return { failures: 0, lockedUntil: 0 };
  }
}

function saveLoginGuard(guard: LoginGuard) {
  window.localStorage.setItem(LOGIN_GUARD_KEY, JSON.stringify(guard));
}

export default function LoginPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaVersion, setCaptchaVersion] = useState(0);
  const onCaptchaTokenChange = useCallback((token: string | null) => setCaptchaToken(token), []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const guard = readLoginGuard();
    const secondsLeft = Math.ceil((guard.lockedUntil - Date.now()) / 1000);
    if (secondsLeft > 0) {
      setMessage(`Too many attempts. Try again in ${Math.ceil(secondsLeft / 60)} minute(s).`);
      return;
    }
    if (!captchaToken) { setMessage("Please complete the bot protection check."); return; }
    setLoading(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const { error } = await getSupabase().auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")), options: { captchaToken } });
    setCaptchaToken(null);
    setCaptchaVersion((version) => version + 1);
    if (error) {
      const failures = guard.failures + 1;
      const nextGuard = failures >= MAX_FAILED_ATTEMPTS
        ? { failures: 0, lockedUntil: Date.now() + LOCK_DURATION_MS }
        : { failures, lockedUntil: 0 };
      saveLoginGuard(nextGuard);
      setMessage(nextGuard.lockedUntil
        ? "Too many attempts. Try again in 1 minute."
        : "Email or password is incorrect.");
    } else {
      window.localStorage.removeItem(LOGIN_GUARD_KEY);
      window.location.assign("/my-programs");
    }
    setLoading(false);
  };
  const resetPassword = async () => {
    const email = (document.querySelector('input[name="email"]') as HTMLInputElement | null)?.value;
    if (!email) { setMessage("Enter your email above first."); return; }
    if (!captchaToken) { setMessage("Please complete the bot protection check."); return; }
    setLoading(true); setMessage("");
    const response = await fetch("/api/account-recovery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, captchaToken }) });
    setCaptchaToken(null);
    setCaptchaVersion((version) => version + 1);
      if (!response.ok) {
        setMessage("We couldn't send a reset email right now. Please wait a few minutes and try again.");
      } else {
        window.location.assign(`/set-password?setup=code-v2&type=recovery&email=${encodeURIComponent(email)}`);
        return;
      }
    setLoading(false);
  };

  return (
    <main className="auth-page">
      <Link className="logo" href="/home#workout-programs">by.alinkins</Link>
      <section className="auth-card">
        <p className="eyebrow">YOUR PROGRAMS</p>
        <h1>Welcome back</h1>
        <p>Sign in to access your purchased programs.</p>
        <form className="email-form" onSubmit={submit}>
          <label>Email<span className="auth-input"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 7 9 6 9-6"/></svg><input name="email" type="email" autoComplete="email" required placeholder="you@email.com"/></span></label>
          <label>Password<span className="auth-input"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required placeholder="Your password"/><button className="auth-password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.4-5.5 9.5-5.5S21.5 12 21.5 12 18.1 17.5 12 17.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.7"/></svg></button></span></label>
          <Turnstile key={captchaVersion} onTokenChange={onCaptchaTokenChange}/>
          <button className="button dark" disabled={loading}>{loading ? "PLEASE WAIT..." : "SIGN IN"}</button>
        </form>
        <button className="text-button auth-forgot" type="button" onClick={resetPassword} disabled={loading}>Forgot password?</button>
        {message && <p className="auth-message">{message}</p>}
        <div className="auth-divider" aria-hidden="true"><span></span><svg viewBox="0 0 24 24"><path d="M12 20.2S3.5 15.1 3.5 9.4A4.4 4.4 0 0 1 12 7.8a4.4 4.4 0 0 1 8.5 1.6c0 5.7-8.5 10.8-8.5 10.8Z"/></svg><span></span></div>
          <small>New customer? Buy a program first — we&apos;ll email you an 8-digit code to create your password.</small>
      </section>
    </main>
  );

}
