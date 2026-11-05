# Manual Hostinger staging

Do not select or redeploy samparkacademy.org during staging. No live deployment was performed.

Hostinger's managed Node.js workflow supports a source ZIP and runs its build; this is not a static public_html extraction workflow. Official instructions checked 5 November 2026: https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/ and https://www.hostinger.com/support/how-to-redeploy-a-node-js-application/ . Supported runtimes include 22.x and 24.x. Local verification uses Node 24.18.0; the existing release was previously observed on 22.23.4. Select 24.x for a separate staging app; actual hPanel availability and Linux sharp installation must be confirmed there.

1. Verify the local ZIP checksum against the SHA256 file. In hPanel, Websites → Create site → Web App → Upload your website files, create a SEPARATE staging app using a temporary hosting hostname. Do not attach the production domain or change DNS. Confirm the plan has a free app slot; if it does not, stop and ask the hosting operator for an isolated staging target.
2. Upload the source ZIP. Choose Express.js (or Other with explicit entry file), root `.`, build `npm run build`, output `dist`, entry `server/server.js`, start `npm start`, package manager npm and runtime 24.x. Do not let Vite detection convert this into a static-only app.
3. Install using the lockfile (`npm ci --omit=dev` for the trimmed release manifest). Vite is a production dependency because hPanel builds the frontend. Do not bundle local node_modules. Linux native image dependencies are installed on the host.
4. Configure server-only environment NAMES: NODE_ENV, APP_ORIGIN, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, SESSION_SECRET, UPLOAD_ROOT; PORT is provided by hosting. Set NODE_ENV to production, APP_ORIGIN to the staging HTTPS origin, and use a new high-entropy SESSION_SECRET. No provider or email keys are required. Do not set VITE secrets or copy production environment values into local QA. Values are deliberately omitted here.
5. Create a separate EMPTY staging MariaDB database and least-privilege user. Run `npm run migrate` only on that empty staging database. The nonempty production database requires the separate provenance/reconciliation process in DATABASE_MIGRATION_PLAN.md; do not try to bypass the refusal guard.
6. Configure UPLOAD_ROOT as an absolute writable persistent directory outside all releases and outside public_html. It contains only authorised PUBLIC images in gallery/members/programs. Never put private documents, application files or receipts there. Applications are stored privately in MariaDB; this version accepts no private file attachments.
7. Create a synthetic staging admin with `npm run create-admin`. Supply ADMIN_EMAIL and ADMIN_PASSWORD through a temporary server-only operator environment; remove them afterwards. Do not reuse production credentials. The CLI password prompt echoes input; use protected environment injection rather than a shared terminal.
8. Start the app. Verify HTTPS `/api/health`, `/api/programs`, `/`, `/about`, `/gallery`, `/contact`, `/donate`, `/admin/login`. Check the port is host-provided and the existing Passenger startup convention is preserved. Confirm the hosting proxy records client IPs correctly; proxy-hop trust has not been inferred or enabled blindly.
9. Use synthetic data to verify admin login/logout/replay rejection, CMS policy updates, enquiries, applications, image rejection, gallery lightbox and programme details. Verify retired payment requests return 410 and historical read-only totals remain unchanged.
10. Restart and redeploy only the STAGING app, then check image hashes/URLs and records survive. Verify application logs contain no credentials or applicant/donor payloads. Test backups, recovery, quotas and TLS/cookies on the actual host.

Smoke commands (STAGING_ORIGIN is a local shell variable containing the staging HTTPS origin):

```sh
curl --fail "$STAGING_ORIGIN/api/health"
curl --fail "$STAGING_ORIGIN/api/programs"
curl --fail "$STAGING_ORIGIN/"
curl -i -X POST "$STAGING_ORIGIN/api/donations/create-order"
curl -i -X POST "$STAGING_ORIGIN/api/webhooks/razorpay"
```

Expect 200 for reads, 410 for retired mutations, 401 for anonymous `/api/admin/donations`. Do not test real payments or contact real applicants. No checkout, QR, banking coordinates or certificate publication is enabled.

NOT TESTED on Hostinger: actual build, native Linux dependency install, staging app slots, TLS/proxy topology, persistent-volume restart behavior and resource headroom. Local compatibility is not hosted acceptance.
