# Security verification

PASS: 170 unit tests; 27 real MariaDB integration checks; 7 isolated production-mode smoke checks; lint and production build. Runtime-only clean installation audited 123 packages with zero known npm advisories. The full development dependency update also reported zero advisories. This is not a penetration-test certification.

Verified controls: bcrypt password comparison; signed eight-hour cookies with per-login random nonce; stored SHA256 session-token comparison; active/admin role enforcement; logout revocation; production Secure/HttpOnly/SameSite=Lax cookies; same-origin authenticated mutations; rate limits; parameterised SQL; Helmet/CSP/HSTS; small JSON limits; raster decoding/re-encoding, pixel/size limits and randomized filenames; upload traversal restriction; plain-text React output; private application records; no payment SDK or checkout script in the shipped source graph.

Payment retirement is unconditional, independent of environment keys. Production-mode tests and synthetic financial row comparisons verify that create-order, verification and webhook requests cannot mutate history. No email integration is enabled. Public images contain no applicant attachments or private legal records.

Review: an independent read-only reviewer found activity-route mapping and application-pagination defects. Both were fixed and covered by focused tests and database/browser journeys. The reviewer confirmed those fixes and found no remaining critical changed-code blocker within that review's scope.

Unresolved: complete legacy CRUD audit coverage; historical finance/receipt mapping; member verification/consent reconciliation; private attachment workflow; real hosting proxy/client-IP behavior; TLS/persistent-volume acceptance; complete SEO/accessibility/retention review. Application endpoints collect initial enquiries, not every field/file from Flask. No additional roles beyond the existing admin authority are claimed.

The archive is built with a source allowlist and excludes environment files, credentials, production uploads/exports, private documents, donor records, databases, .git, QA data, caches, node_modules and test tooling. Archive verification details are in release/FINAL_RELEASE_VERIFICATION.md.

## Final local candidate checkpoint

191 regression tests plus7 focused readiness tests pass in separate executed runs;27 MariaDB integration checks,126 responsive checks,14 browser interactions and7 exact-candidate production-mode smoke checks pass. Zero final failures/skips/browser errors/failed requests/known npm advisories. Retained recovery18/18 and adoption17/17 were not repeated. SEO/status/social metadata and startup-harness issues are resolved. The candidate source-only ZIP is regenerated only after these gates, with the previous ZIP preserved. Direct production readiness remains NO; classifications C1-C6, B1-B3 and D1-D2 are in PRODUCTION_BLOCKERS.md. No public staging hostname is required and no deployment occurred.
