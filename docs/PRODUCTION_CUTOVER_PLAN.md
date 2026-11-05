# Direct manual production cutover — NOT READY

Updated 5 November 2026. Target remains the existing samparkacademy.org site. **A separate public staging subdomain is not required.** No production deployment, schema/ledger write, file/environment/DNS change, migration, seed or backup was performed in this preparation run.

The current gate decision is **NO: do not cut over**. This plan describes prerequisites and future operator actions; it is not approval to perform them.

| Gate | Status | Evidence or dependency |
|---|---|---|
| Existing SSH/Node/MariaDB access | PASS | Prior successful read-only checkpoints; not repeated in the adoption task |
| Production schema comparison | PASS | Nine baseline definition/key sets, engines and collations match; one documented harmless column-order difference |
| Non-destructive baseline strategy in isolation | PASS | 17 real MariaDB rehearsal checks and 10 focused unit checks; adopted-schema records do not claim historical execution |
| Production ledger adoption | BLOCKED | No existing ledger/history; reviewed production operator/tool and execution remain unapproved/unperformed. Local helper intentionally cannot target production |
| Actual records, financial references and media reconciliation | BLOCKED | No private production rows/files cloned; synthetic preservation proves mechanism, not actual reconciliation |
| Recoverable backup/restore and original release recovery | BLOCKED | Existing release identified, but recovery/restore procedure and operator evidence not verified in this task |
| Hosted candidate/native dependencies/persistence | BLOCKED | Existing runtime access is not a candidate build/start/restart test; no new production files or processes permitted in this run |
| Full feature/source/legal/financial acceptance | BLOCKED | See feature matrix; historical mappings, member consent/identity evidence and remaining audit/forms/SEO/outbox limitations persist |
| Payment/legal hold | PASS for prepared release | Retirement tests remain valid; no unverified QR, banking coordinates or certificates enabled. Future rollback must preserve the same hold |

## Future direct-domain sequence, only after every required gate passes

1. Name the authorised release/database operators, approved maintenance window, stop conditions and financial reconciliation owner. Preserve release `01a0d883-1b7a-73ef-a602-1932ca4a8f8a` and any newer active version; record which version is actually recoverable at cutover time. Do not manually overwrite release directories, public_html, .htaccess or hbuilds/current.
2. Verify a restorable database/media backup through the operator's separately approved process. This preparation did not create a backup. Reconcile current table/id sets, financial integer totals/provider identifiers, FK anti-joins and public media references/hashes without publishing private rows. Do not infer zero financial history from an older snapshot.
3. Verify the candidate in a production-like isolated environment. If Hostinger provides an unactivated-release/private-preview or isolated local-bind facility, the operator must first confirm its isolation, permissions and rollback behavior. Do not invent a facility or start a second production process during this read-only run. An external public staging hostname is optional, not a prerequisite; verified candidate hosting/persistence evidence is still mandatory.
4. Approve an explicit schema-adoption manifest and production operator procedure based on DATABASE_MIGRATION_PLAN.md. Preserve the column-order difference. Never simply fabricate five applied migration entries, run 001–005 again, bypass refusal, or remove the local helper's target restrictions. Without an approved production-capable adoption procedure, stop.
5. In the separately authorised maintenance window, prevent concurrent business writes through approved operational controls. Recheck schema/data fingerprints and media against the reviewed manifest immediately before any authorised baseline/additive migration operation; stop on drift. Keep existing identifiers, historical amounts, receipt snapshots and provider references unchanged. No guessed import mapping is allowed.
6. Upload the reviewed versioned source ZIP through the existing managed Node.js deployment workflow only when ready; preserve the current deployment and environment for recovery. Hostinger version activation can make an app live: do not click Deploy/Redeploy as a harmless preview. Confirm entry server/server.js, build/output, required server-only configuration and persistent public-image directory without copying secrets into the package.
7. Activate only after the reviewed schema procedure and all gates pass. Smoke-check home/programmes/forms/admin, logout revocation, image URLs and persistence, historical read-only totals and retired payment routes. Monitor status/error rates, database connections, authentication/rate limiting, application acknowledgements and media. Do not send real payments or enable webhooks, mandates or unverified bank/QR controls.

## Non-destructive rollback requirements

Use only the hosting operator's verified managed version-selection/redeploy control to return to the preserved known-good version. This task did not verify an actual hPanel rollback control; if unavailable or uncertain, stop and obtain Hostinger/operator evidence before cutover. No shell symlink reset, destructive overwrite or release deletion is recommended.

Leave additive tables/columns and adoption history intact during code rollback; do not drop them or restore an older database over new applications, audit events or financial records. Reconcile any writes occurring after cutover. The pre-upgrade application's explicit existing-column queries are structurally compatible with the added fields, but a real hosted rollback has not been exercised.

The original source includes payment-provider mutation routes. Rolling back to it could re-expose retired operations. A separately reviewed rollback artifact or approved operational payment hold must preserve retirement during recovery. No production controls were changed here. External mandate servicing/cancellation must remain an authorised staff/provider process; this application does not silently cancel them.

## What can close locally versus independent evidence

Local work can strengthen schema drift/refusal tests, structured forms, private upload handling, audit/SEO/outbox parity and production-like synthetic workflows. None requires modifying the live site.

Independent evidence is required for actual donor/receipt/refund/subscription lineage, cross-system identities and timestamps, member validity/consent, authenticated legal/bank/QR documents, recoverable live backup/media reconciliation, Hostinger runtime/persistence and a verified deployment/rollback operation. These cannot be manufactured from a matching schema or synthetic tests.

No new release ZIP is declared production-ready. The prior package remains unchanged and retains its earlier synthetic-staging scope. Direct production readiness: **NO**.
