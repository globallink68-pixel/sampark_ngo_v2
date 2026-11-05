# Node release acceptance

Decision: PASS for the executed local checks and safe synthetic-staging artifact; BLOCKED for complete feature parity and production acceptance. Local implementation remains PARTIAL.

Executed evidence: 170 unit tests, 27 MariaDB integration checks, 7 isolated production-mode checks, 126 responsive checks and 10 interactions pass. No test skips or final browser errors/failed requests. Lint and production build pass. Known dependency advisories at final clean runtime install: zero.

Preserved: existing Node tables and financial identifiers, authenticated history/filter/summary, public content/admin features and approved Flask design direction. Added: private initial application enquiries, plain-text content/policy editing, audit records for new status/content changes, programme details, public routes and stronger session/upload/payment boundaries.

Release scope is exactly the FEATURE_PARITY_MATRIX.md: 13 scoped PASS and 7 BLOCKED areas. Missing structured forms/private attachments, full audit/SEO/outbox parity, member verification, receipt/historical financial import and existing-database adoption prevent full acceptance. Missing original legal/bank/QR sources keep corresponding controls unpublished. Organisation-provided details are labelled pending source review.

Manual staging only: separate app/hostname, empty synthetic database, persistent public-image root and no production secrets. No production readiness, deployment or migration is claimed. See release/FINAL_RELEASE_VERIFICATION.md for archive size, hash and inspection evidence.

## Direct manual cutover preparation checkpoint

The user subsequently chose the existing domain as the future direct manual cutover target; a separate public staging hostname is no longer required. This does not waive any production acceptance gate or change the prior ZIP's scope.

Production read-only authentication and metadata access succeeded using existing server-side configuration. All nine baseline table definition/key sets, engines and collations match, with one harmless organisation column-order difference. Historical execution provenance remains unknown and the production ledger absent.

New isolated adoption work: **17/17** MariaDB rehearsal checks and **10/10** focused tests pass with no failures/skips. This is additional focused evidence, not a repeated or enlarged full-suite claim; the earlier 170-test release checkpoint is retained. The main application, normal migration runner and ZIP were not changed. A local-only helper records adopted-schema provenance without invented applied_at dates and preserves refusal after interruption.

Baseline strategy in isolation: PASS. Production adoption, real data/media/financial reconciliation, backup/restore and hosted runtime/persistence/rollback acceptance: BLOCKED. Full parity/source approvals remain incomplete. Direct production readiness: **NO; do not deploy**. Updated direct-domain sequence and non-destructive rollback conditions are in PRODUCTION_CUTOVER_PLAN.md.
