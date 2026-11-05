# Deployment checklist

H6 is the first Hostinger staging/deployment phase. Before deployment run `npm run lint`, `npm test`, `npm run build`, and `npm run check:env`.

Create a Hostinger MySQL database/user, configure the variables in `.env.example` as server configuration, set `APP_ORIGIN` to the final HTTPS origin, run `npm run migrate`, and create the first admin with `npm run create-admin`. Set `UPLOAD_ROOT` to a writable persistent directory outside the disposable/versioned deployment directory. Do not hard-code a Hostinger path in source: determine and verify the correct persistent path in staging. Express uses `<UPLOAD_ROOT>/gallery`, `<UPLOAD_ROOT>/members`, and `<UPLOAD_ROOT>/programs`, and serves that same root at `/uploads`. Start the Node Web App and verify public APIs, admin authentication, uploads—including persistence after a redeploy—Contact/Turnstile, and Razorpay TEST create-order, checkout, verification, and webhook flows.

Do not use Razorpay LIVE until all staging checks—including webhook replay/idempotency and uploaded-file persistence after restart/redeploy—have passed. See `HOSTINGER_MIGRATION.md` for the complete ordered checklist.
