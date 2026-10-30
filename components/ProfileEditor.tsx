"use client";

import { FormEvent, useState } from "react";
import { getSupabase } from "@/lib/supabase-browser";

type Profile = { email: string; first_name: string; last_name: string; age: number | null };

export default function ProfileEditor({ initialProfile }: { initialProfile: Profile }) {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setMessage("");
    const supabase = getSupabase();
    const data = new FormData(event.currentTarget);
    const ageValue = String(data.get("age") || "").trim();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update({
      first_name: String(data.get("first_name") || "").trim(),
      last_name: String(data.get("last_name") || "").trim(),
      age: ageValue ? Number(ageValue) : null,
    }).eq("id", user?.id ?? "");
    setMessage(error ? error.message : "Profile saved.");
    setSaving(false);
  }

  async function changePassword() {
    setSaving(true); setMessage("");
    const { error } = await getSupabase().auth.resetPasswordForEmail(initialProfile.email, { redirectTo: `${window.location.origin}/set-password` });
    setMessage(error ? error.message : "We sent a secure password-change link to your email.");
    setSaving(false);
  }

  return <main className="profile-page"><section className="profile-card"><p className="eyebrow">YOUR ACCOUNT</p><h1>Edit profile</h1><p className="profile-intro">Keep your details up to date. We will use them only to improve your experience with your programs.</p>
    <form className="profile-form" onSubmit={save}>
      <label>Email<input value={initialProfile.email} readOnly aria-readonly="true" /></label>
      <div className="profile-grid"><label>First name<input name="first_name" defaultValue={initialProfile.first_name} autoComplete="given-name" maxLength={80} /></label><label>Last name<input name="last_name" defaultValue={initialProfile.last_name} autoComplete="family-name" maxLength={80} /></label></div>
      <label>Age<input name="age" type="number" defaultValue={initialProfile.age ?? ""} min="14" max="120" /></label>
      <button className="button dark" disabled={saving}>{saving ? "SAVING…" : "SAVE PROFILE"}</button>
    </form>
    <div className="profile-password"><h2>Password</h2><p>For security, we will email you a one-time link to choose a new password.</p><button className="profile-password-button" type="button" onClick={changePassword} disabled={saving}>CHANGE PASSWORD</button></div>
    {message && <p className="profile-message">{message}</p>}
  </section></main>;
}
