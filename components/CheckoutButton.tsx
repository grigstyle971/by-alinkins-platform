"use client";

import { useState } from "react";

export default function CheckoutButton({ courseSlug, price }: { courseSlug: string; price: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setLoading(true);
    setError("");
    try {
      const body = new FormData();
      body.set("courseSlug", courseSlug);
      const response = await fetch("/api/checkout", { method: "POST", body });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || "Could not start checkout.");
      window.location.assign(result.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not start checkout.");
      setLoading(false);
    }
  }

  return <><button type="button" disabled={loading} onClick={startCheckout}>{loading ? "OPENING CHECKOUT…" : `GET ACCESS FOR ONLY $${price}`}</button>{error && <p className="checkout-error" role="alert">{error}</p>}</>;
}
