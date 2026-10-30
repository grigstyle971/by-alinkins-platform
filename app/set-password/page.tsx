"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase-browser";

type SetPasswordPageProps = {
  initialEmail?: string;
  initialSetupType?: "invite" | "recovery" | null;
};

export default function SetPasswordPage({ initialEmail = "", initialSetupType = null }: SetPasswordPageProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [setupType, setSetupType] = useState<"invite" | "recovery" | null>(null);
  const [prefilledEmail, setPrefilledEmail] = useState(initialEmail);
  const [codeVerified, setCodeVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    const checkExistingLinkSession = async () => {
      if (initialSetupType) {
        setSetupType(initialSetupType);
        setReady(true);
        return;
      }
      // Password links can use either a hash (implicit flow) or a `code`
      // query parameter (PKCE flow). A normal visit to this page must not
      // expose a password form just because somebody is already signed in.
      const url = new URL(window.location.href);
      const requestedEmail = url.searchParams.get("email");
      if (requestedEmail) setPrefilledEmail(requestedEmail);
      const requestedSetupType = url.searchParams.get("type");
      if (url.searchParams.get("setup") === "code-v2" && (requestedSetupType === "invite" || requestedSetupType === "recovery")) {
        setSetupType(requestedSetupType);
        setReady(true);
        return;
      }
      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage("This password link is invalid or has expired. Please request a new one.");
          return;
        }
        window.history.replaceState(null, "", window.location.pathname);
        setReady(true);
        return;
      }

      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) {
          setMessage("This account link is invalid or has expired. Please request a new password link.");
          return;
        }
        window.history.replaceState(null, "", window.location.pathname);
        setReady(true);
      }
    };
    void checkExistingLinkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, [initialSetupType]);

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const oneTimeCode = String(formData.get("one-time-code") ?? "").trim();
    const password = String(formData.get("password"));
    const confirmation = String(formData.get("confirmation"));
    if (password !== confirmation) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }
    const supabase = getSupabase();
    if (setupType && !codeVerified) {
      const { error: verificationError } = await supabase.auth.verifyOtp({ email, token: oneTimeCode, type: setupType });
      if (verificationError) {
        setMessage("This code is invalid or has expired. Please request a new one.");
        setLoading(false);
        return;
      }
      // Keep the authenticated session after OTP verification. If changing the
      // password fails validation, the customer can correct it and retry
      // without consuming another code.
      setCodeVerified(true);
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message.includes("different") ? "This is already your current password. Your code has been accepted — please choose a different password and submit again." : error.message);
      setLoading(false);
      return;
    }
    window.location.assign("/my-programs");
  };

  return (
    <main className="auth-page">
      <Link className="logo" href="/home#workout-programs">by.alinkins</Link>
      <section className="auth-card">
        <p className="eyebrow">ONE LAST STEP</p>
        <h1>Create your password</h1>
        <p>{ready ? (setupType ? "Enter the one-time code from your email, then choose a password." : "Choose a password to protect your personal account.") : "Open the secure link from your account setup email to create your password."}</p>
        {ready && (
          <form className="email-form" onSubmit={submitPassword}>
            {setupType && <><label>Email<span className="auth-input"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 7 9 6 9-6"/></svg><input name="email" type="email" autoComplete="email" required placeholder="you@email.com" value={prefilledEmail} onChange={(event) => setPrefilledEmail(event.target.value)} /></span></label><label>One-time code<span className="auth-input"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg><input name="one-time-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" maxLength={8} required placeholder="8-digit code" onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 8); }} /></span></label></>}
            <label>Password<span className="auth-input"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={6} required placeholder="At least 6 characters" /><button className="auth-password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.4-5.5 9.5-5.5S21.5 12 21.5 12 18.1 17.5 12 17.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.7"/></svg></button></span></label>
            <label>Confirm password<span className="auth-input"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><input name="confirmation" type={showConfirmation ? "text" : "password"} autoComplete="new-password" minLength={6} required placeholder="Confirm your password" /><button className="auth-password-toggle" type="button" aria-label={showConfirmation ? "Hide confirmation password" : "Show confirmation password"} onClick={() => setShowConfirmation((visible) => !visible)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.4-5.5 9.5-5.5S21.5 12 21.5 12 18.1 17.5 12 17.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.7"/></svg></button></span></label>
            <button className="button dark" disabled={loading}>{loading ? "PLEASE WAIT…" : "OPEN MY PROGRAMS"}</button>
          </form>
        )}
        {message && <p className="auth-message">{message}</p>}
      </section>
    </main>
  );
}
