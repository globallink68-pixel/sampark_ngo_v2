# Sampark Academy

React/Vite frontend with an Express and MySQL-compatible backend for public Gallery/Members, signed-cookie administration, contact/Turnstile, filesystem uploads, and Razorpay order/verification/webhooks.

## Local setup

Copy `.env.example` to `.env.local`, install dependencies, and run `npm run dev`. Run the API with `npm start`. Validate with `npm run lint`, `npm test`, `npm run build`, and `npm run check:env`.

Public browser configuration is `VITE_API_BASE_URL`, `VITE_RAZORPAY_KEY_ID`, and `VITE_TURNSTILE_SITE_KEY`. All `VITE_*` values are public. Server-only configuration includes `APP_ORIGIN`, `UPLOAD_ROOT`, database credentials, `SESSION_SECRET`, Razorpay secrets, and `TURNSTILE_SECRET_KEY`.

`UPLOAD_ROOT` is never supplied by the browser. When set, Express resolves it and uses its `gallery`, `members`, and `programs` subdirectories for uploads and for `/uploads` static delivery. Local development/test defaults to `./uploads` when it is blank or unset. In production, set it to a writable persistent directory outside disposable or versioned deployment files; do not assume the deployed application directory survives a redeploy.

See `HOSTINGER_MIGRATION.md` for H6 staging and deployment verification. Local tests use doubles and do not replace real Hostinger MySQL, Turnstile, or Razorpay TEST validation.
