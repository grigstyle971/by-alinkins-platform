> **Витрина кода.** Это публичная копия рабочего проекта [by-alinkins.com](https://by-alinkins.com). Фотографии и контент курсов (он хранится в базе) в неё не входят. Здесь можно посмотреть устройство кода: Next.js, Supabase (Auth, RLS, приватный bucket, миграции), Stripe с вебхуками и автоматической выдачей доступа, админка курсов, PostHog.

# by.alinkins — course platform

This is a Next.js storefront and protected-course foundation using Supabase and Stripe. It preserves the minimal, warm-white visual direction from the supplied current-site screenshots.

## Local launch

1. Copy `.env.example` as `.env.local` and add credentials.
2. Run `supabase/schema.sql` in Supabase SQL Editor.
3. Run `npm.cmd install` and `npm.cmd run dev`.

## Google + Apple sign-in

Both options are implemented through Supabase Auth at `/login`.

- In Supabase **Authentication → Providers**, enable Google and add its Google Cloud OAuth client ID/secret.
- Enable Apple, create a Service ID and private key in Apple Developer, then add its client ID, team ID, key ID and private key to Supabase.
- Add `https://YOUR_DOMAIN/auth/callback` to Supabase redirect URLs, Google authorized redirects and the Apple Return URLs list.

## Stripe access model

Checkout creates a Stripe session. The webhook must verify `checkout.session.completed`, then insert one enrollment record. The production step still needed is to add the signed-in Supabase user ID to server-generated Stripe metadata and insert the row with a service-role Supabase client. Course videos should be stored privately and delivered only after the enrollment query passes.
