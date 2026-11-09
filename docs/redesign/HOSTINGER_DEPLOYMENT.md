# Hostinger candidate deployment

Use an isolated managed Node.js staging application before any production cutover. Keep the existing Express entry point and persistent uploads. See the checked-in Hostinger staging guide for the source ZIP workflow and supported runtime configuration.

## Staging setup

1. Verify the archive SHA-256 and the per-file manifest. Extract into a new release directory or upload the ZIP as a new managed Node.js application.
2. Select Node 24, Express, build command `npm run build`, output directory `dist`, and entry point `server/server.js`. The included build can serve directly when the hosting workflow permits.
3. Configure server-only NODE_ENV, APP_ORIGIN, SESSION_SECRET, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD and UPLOAD_ROOT. Use the hosting-provided PORT. Set UPLOAD_ROOT to the existing persistent directory outside public_html and the release tree. Keep HTTPS enabled.
4. Use a separate staging MariaDB database and backup before migration. Run `npm run migrate`. Migrations 010 and 011 are additive. For any nonempty database without a trusted migration ledger, stop at the migration guard and follow the existing database migration plan.
5. Start the app and run the smoke checks below. Verify hPanel-specific runtime, image processing, proxy behavior, storage quotas and backup/restore before production approval.

## Smoke checks

- Confirm HTTPS homepage, about, programmes and detail, gallery, team, transparency, contact, donation, policy and admin pages.
- Confirm /api/health, /api/organization, /api/site-images, /api/members, /api/programs, /api/gallery and both /api/verified-* endpoints.
- Use synthetic staging content to confirm admin login, draft image privacy, explicit publication, audit history and public reload.
- Submit a synthetic enquiry and application. Verify receipt in the admin dashboard.
- Confirm no payment checkout, no unintended certificate or bank details and no production credentials or test records.
- Restart the staging app and verify prior media URLs and published revisions persist.

No live hPanel deployment was performed for this candidate.

## Managed Hostinger preflight

Hostinger documents Express ZIP deployment and Node 24 support for eligible Business and Cloud plans. See [Hostinger's Node.js deployment guide](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/). Account plan eligibility, a free staging slot, and an isolated staging database must be confirmed in hPanel.

Use hostinger-env.example.txt as a list of variable names. Configure values in hPanel. Keep SESSION_SECRET unique to staging and at least 32 characters. Verify UPLOAD_ROOT is absolute and writable by the application process. Back up the database and upload root separately, then rehearse a restoration before production approval.

The current changes reuse the existing migration schema. Run the normal checksum-gated migration command on the isolated staging database. Staging deployment is blocked until an authorized isolated Hostinger application and MariaDB target are available.
