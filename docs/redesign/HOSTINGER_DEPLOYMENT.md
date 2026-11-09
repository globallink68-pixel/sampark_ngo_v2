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

## Reverse proxy and live image-settings incident

The app trusts only the immediate TCP peer when its IP is in the comma-separated TRUSTED_PROXY_PEERS allowlist. This keeps direct requests keyed on the socket address and uses the last X-Forwarded-For value for requests from a trusted peer. Express rate-limit validation stays enabled.

Before redeploying, confirm the immediate Express peer IPs or narrowly scoped CIDRs with Hostinger. Verify those peers overwrite or append the actual client IP and sanitize forwarded host and protocol on every ingress path, including temporary hostnames and any origin path. Leave TRUSTED_PROXY_PEERS unset until verified. With no allowlist, proxy traffic shares its socket IP for rate limits. Do not configure a wildcard, a hop count alone, or a shared ingress range that accepts unsanitized forwarding headers.

Live read-only observations on 9 November 2026:

- /api/health and /api/organization returned 200.
- /api/site-images, /api/members, /api/programs and /api/verified-certificates returned 400. The response for site-images was the generic Express error body.
- Unauthenticated /api/admin/site-images/logo, /favicon and /hero requests returned 401 as expected.

The public image index performs a SELECT against site_image_slots from migration 009. The authenticated settings reads use the same table after session authorization. Reads do not use UPLOAD_ROOT. Images in these slots are stored in MariaDB, while the older gallery, member and programme upload paths use UPLOAD_ROOT. Member and programme queries use columns added in 010, and the certificate query reads the table added in 011. Migration 008 defines content drafts and is separate from image slots.

The failure pattern and previously documented baseline without a migration ledger point to missing schema upgrades or privileges for the live application DB user. The specific SQL error was not accessible from public responses. Check the application logs and inspect the active database with read-only access. Check the ledger for 008 through 011, verify the image tables and three seed slots, verify 010 visibility and categorization columns and 011 tables, and check the application account's privileges. If the ledger is absent or incomplete, follow the repository's reviewed database migration plan, backup and stage first. Keep the migration provenance guard intact. After an approved repair, smoke-test the public image index and the authenticated reads for all three slots before testing uploads.
