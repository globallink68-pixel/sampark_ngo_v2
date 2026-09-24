# Sam Park Academy

React/Vite frontend with an Express and MySQL-compatible backend for public Gallery/Members, signed-cookie administration, contact/Turnstile, filesystem uploads, and Razorpay order/verification/webhooks.

## Local setup

Copy `.env.example` to `.env.local`, install dependencies, and run `npm run dev`. Run the API with `npm start`. Validate with `npm run lint`, `npm test`, `npm run build`, and `npm run check:env`.

Public browser configuration is `VITE_API_BASE_URL`, `VITE_RAZORPAY_KEY_ID`, and `VITE_TURNSTILE_SITE_KEY`. All `VITE_*` values are public. Server-only configuration includes `APP_ORIGIN`, database credentials, `SESSION_SECRET`, Razorpay secrets, and `TURNSTILE_SECRET_KEY`.

See `HOSTINGER_MIGRATION.md` for H6 staging and deployment verification. Local tests use doubles and do not replace real Hostinger MySQL, Turnstile, or Razorpay TEST validation.
