# Hostinger migration

H1-H5 are complete. The React/Vite frontend and Express/MySQL backend now own public APIs, signed-cookie administration, Contact/Turnstile, Razorpay, webhooks, and filesystem uploads. H6 is real Hostinger staging/deployment.

## H6 production-staging sequence

1. Create the Hostinger MySQL database and least-privilege database user.
2. Configure server environment variables: `NODE_ENV`, `PORT`, `APP_ORIGIN`, all `DB_*` values, `SESSION_SECRET`, `TURNSTILE_SECRET_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`.
3. Run `npm run migrate`.
4. Create the first administrator with `npm run create-admin`.
5. Deploy and start the Node Web App.
6. Verify the health/API responses.
7. Verify real MySQL-backed operations.
8. Test Gallery and Member uploads.
9. Verify their image URLs.
10. Restart or redeploy the application.
11. Confirm uploaded files still exist.
12. Test image replacement and old-file cleanup.
13. Test deletion and physical-file cleanup.
14. Configure and test Turnstile.
15. Configure Razorpay TEST credentials.
16. Configure the Razorpay TEST webhook.
17. Run a TEST donation/payment.
18. Verify webhook replay/idempotency and database state.
19. Configure the domain and HTTPS.
20. Only after staging verification, consider Razorpay LIVE.

## Important upload warning

Filesystem persistence on Hostinger is **NOT YET VERIFIED**. Do not treat filesystem uploads as persistent or production-safe until H6 proves the restart/redeploy, replacement, and deletion checks above.

## Security notes

`APP_ORIGIN` is the trusted same-origin value for authenticated admin mutations. It is required in production and must be the deployed HTTPS origin. Server secrets are never `VITE_*` values; every `VITE_*` value is public browser configuration.
