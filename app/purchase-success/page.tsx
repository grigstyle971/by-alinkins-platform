import Stripe from "stripe";
import Link from "next/link";
import SetPasswordPage from "@/app/set-password/page";

type PurchaseSuccessProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function PurchaseSuccess({ searchParams }: PurchaseSuccessProps) {
  const { session_id: sessionId } = await searchParams;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (sessionId && stripeKey) {
    try {
      const stripe = new Stripe(stripeKey);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const email = session.customer_details?.email?.trim().toLowerCase();
      if (session.payment_status === "paid" && email && session.metadata?.account_setup_required === "true") {
        return <SetPasswordPage initialEmail={email} initialSetupType="invite" />;
      }
      if (session.payment_status === "paid" && session.metadata?.account_setup_required === "false") {
        return <main className="auth-page"><Link className="logo" href="/home#workout-programs">by.alinkins</Link><section className="auth-card"><p className="eyebrow">PAYMENT RECEIVED</p><h1>You&apos;re in!</h1><p>Your purchase has been added to your existing account.</p><Link href="/login" className="button dark">LOG IN</Link><small>Support: <a href="mailto:byalinkinsupport@gmail.com">byalinkinsupport@gmail.com</a></small></section></main>;
      }
    } catch {
      // A checkout session that cannot be verified must not expose its email.
    }
  }

  return <main className="auth-page"><Link className="logo" href="/home#workout-programs">by.alinkins</Link><section className="auth-card"><p className="eyebrow">PAYMENT RECEIVED</p><h1>You&apos;re in!</h1><p>Your purchase is being prepared. Please check your email for your 8-digit password setup code.</p><p>Already have an account? Your purchase will appear there automatically.</p><Link href="/login" className="button dark">LOG IN</Link><small>Can&apos;t find the email? Please check your spam folder, then contact support if needed.<br/><br/>Support: <a href="mailto:byalinkinsupport@gmail.com">byalinkinsupport@gmail.com</a></small></section></main>;
}
