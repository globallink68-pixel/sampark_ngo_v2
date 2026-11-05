# Future production cutover — not authorised in this run

Production readiness is NO pending existing-database migration provenance, private historical mapping, organisational content/consent review and hosted staging acceptance.

Before any separately authorised cutover, require the clean staging run, independent backup/restore evidence, financial and media reconciliation, source approval, privacy/retention review and documented responsible operators. Preserve the active release `01a0d883-1b7a-73ef-a602-1932ca4a8f8a` and every newer release. Do not overwrite release directories, public_html, .htaccess or hbuilds/current manually.

Use hPanel's managed Node.js version/deployment controls only after the hosting operator verifies how they preserve/reselect existing versions. Freeze administrative writes only through a separately approved operational window, reconcile changes since backup, and stop on any record/amount mismatch. Do not overwrite newer data with an old database backup.

After any future cutover monitor health, HTTP errors, authentication failures, rate limiting, DB connection exhaustion, persistent images, application receipt acknowledgements and financial read-only totals. Do not enable provider webhooks or payment controls. External mandates require an authorised staff/provider cancellation and reconciliation process; this application does not silently service or cancel them.

Rollback: pause cutover, use the previously verified hPanel version-selection/redeploy workflow to return to the preserved release, and verify its health/media/admin access. If no verified version rollback control exists, stop and contact Hostinger support. Added tables/columns may remain; do not drop them or restore an older database over new applications, audit events or financial records. Record and reconcile any new writes. Never reset symlinks or remove releases as a shortcut.
