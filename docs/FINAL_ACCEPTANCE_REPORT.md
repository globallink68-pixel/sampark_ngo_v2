# Node release acceptance

Decision: PASS for the executed local checks and safe synthetic-staging artifact; BLOCKED for complete feature parity and production acceptance. Local implementation remains PARTIAL.

Executed evidence: 170 unit tests, 27 MariaDB integration checks, 7 isolated production-mode checks, 126 responsive checks and 10 interactions pass. No test skips or final browser errors/failed requests. Lint and production build pass. Known dependency advisories at final clean runtime install: zero.

Preserved: existing Node tables and financial identifiers, authenticated history/filter/summary, public content/admin features and approved Flask design direction. Added: private initial application enquiries, plain-text content/policy editing, audit records for new status/content changes, programme details, public routes and stronger session/upload/payment boundaries.

Release scope is exactly the FEATURE_PARITY_MATRIX.md: 13 scoped PASS and 7 BLOCKED areas. Missing structured forms/private attachments, full audit/SEO/outbox parity, member verification, receipt/historical financial import and existing-database adoption prevent full acceptance. Missing original legal/bank/QR sources keep corresponding controls unpublished. Organisation-provided details are labelled pending source review.

Manual staging only: separate app/hostname, empty synthetic database, persistent public-image root and no production secrets. No production readiness, deployment or migration is claimed. See release/FINAL_RELEASE_VERIFICATION.md for archive size, hash and inspection evidence.
