# Sam Park Academy

React/Vite public website backed by Supabase PostgreSQL, Auth and Storage. Admin users manage gallery images and members; public images are read-only. Contact is submitted through a server-side Edge Function with honeypot and optional Cloudflare Turnstile verification. Donations use Razorpay Checkout, server-side order creation, signature verification, and idempotent webhook processing.

## Local setup

Copy `.env.example` to `.env.local`, install dependencies, then run `npm run dev`. Use `npm run lint`, `npm test`, `npm run build`, and `npm run check:env` before staging. See `DEPLOYMENT.md` for deployment stages.

## Variables

`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_RAZORPAY_KEY_ID`, and `VITE_TURNSTILE_SITE_KEY` are public browser configuration. Every `VITE_*` value is bundled into the frontend: never put secrets in one. `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, and `TURNSTILE_SECRET_KEY` belong only in Supabase Edge Function secrets.

## Testing and staging

Tests use mocks/pure behavior tests and do not replace real Supabase, Razorpay TEST, or Turnstile TEST verification. Database migrations and backup/export guidance remain in `supabase/` and `DEPLOYMENT.md`.
