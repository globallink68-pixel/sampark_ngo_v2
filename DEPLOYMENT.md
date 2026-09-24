# Deployment checklist

## Phase 3 staging sequence

A. Run `npm run lint`, `npm test`, `npm run build`, and `npm run check:env` locally. B. Create a Supabase project. C. Apply every migration with `supabase db push`. D. Verify `gallery` and `members` buckets and policies. E. create the first Auth user then manually promote its profile. F. deploy `create-order`, `verify-payment`, `razorpay-webhook`, and `contact-submit` with `supabase functions deploy <name>`. G. set server secrets with `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=... RAZORPAY_KEY_SECRET=... RAZORPAY_WEBHOOK_SECRET=... TURNSTILE_SECRET_KEY=...`. H. configure Razorpay TEST keys and J. configure Turnstile test keys. K. deploy `dist/` to a temporary free-hosting URL. L. perform end-to-end staging payments, webhooks, Turnstile, uploads, and RLS checks. Only then M. add `samparkacademy.org`, N. set Hostinger DNS, O. verify HTTPS, P. configure Razorpay LIVE credentials/webhook, and Q. repeat production smoke tests.

1. Create a Supabase project and run `supabase/migrations/202609240001_initial.sql`.
2. Create buckets if the migration was not applied by an owner; verify both are public-read, admin-write only.
3. Create the first administrator in Supabase Auth, then promote its profile in the SQL Editor as documented in `supabase/README.md`.
4. Add frontend variables to the static host: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_RAZORPAY_KEY_ID`. These are public configuration, not secrets.
5. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` only with `supabase secrets set`; deploy the Edge Functions. Never add them to Vite variables.
6. Configure Razorpay test mode and point its webhook to the deployed `razorpay-webhook` Edge Function. Test valid, invalid and repeated payment events before production.
7. Deploy the Vite `dist/` directory to any static host on a free tier. Verify SPA fallback redirects paths to `index.html`.
8. In Hostinger DNS, point `@` and `www` to the selected static host per that host’s documented DNS records. Do not use a Hostinger VPS. Add both `samparkacademy.org` and `www.samparkacademy.org`, choose one canonical URL, and verify automatic SSL.
9. Add the Razorpay production webhook only after production credentials, domain, HTTPS and signature tests pass.
10. Smoke-test mobile navigation, public gallery/members, admin authorization, image upload constraints, contact submission, payment signature verification, webhook replay handling, and backup restoration.

Remaining risks: free-tier limits can change; public contact forms can attract abuse; a webhook implementation must persist idempotent payment status using a service-role client only after HMAC verification; use audit logs and payment reconciliation before relying on donation reporting.
