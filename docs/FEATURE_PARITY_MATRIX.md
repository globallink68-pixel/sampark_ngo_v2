# Verified Node release scope

Status describes this local implementation, not Flask's earlier test results. Twenty scoped areas: **14 PASS, 6 BLOCKED**. PASS is scoped to the behavior explicitly named; it does not assert complete Flask equivalence.

| Area | Status | Evidence / unresolved difference |
|---|---|---|
| Approved public layout and routes | PASS | React port uses Flask CSS and illustrative asset; 21 public routes checked |
| Responsive and keyboard behavior | PASS | 126 route-width checks, 10 interactions |
| Gallery management/lightbox | PASS | Decoded/re-encoded uploads, CRUD regression and real DB/browser checks |
| Programme management/details | PASS | Existing identifiers/schema retained; API and image lifecycle checks |
| Membership identity verification | BLOCKED | No verified Node member-number/validity/consent mapping; verification remains unavailable |
| Application enquiries | PASS | Six private enquiry types, consent, status/audit transaction and pagination; not full structured Flask forms or private attachment parity |
| Organisation/content editing | PASS | Existing settings retained; plain-text pages, policies, campaigns and activities added |
| Administration security | PASS | Active admin role, stored session hash/expiry, login replacement, logout revocation, CSRF and rate limits |
| Donation/payment retirement | PASS | Provider SDK removed; mutation endpoints return 410 without DB/provider activity |
| Existing Node financial history | PASS | Read-only authenticated filters/summary; integer storage and exact integer display; synthetic rows unchanged |
| Flask financial import/refund/subscription history | BLOCKED | Identity namespaces, source snapshots, timestamps and external records require reconciliation; no importer enabled |
| Original historical receipt access | BLOCKED | No receipt schema/snapshots in inspected Node source; no receipts fabricated; public endpoint fails closed |
| Complete historical/legacy audit parity | BLOCKED | New content/application updates are audited; historical audit import and atomic audit of all legacy CRUD remain unverified |
| Approved policy editing/legal safeguards | PASS | Escaped editable policy text; no certificate previews, banking coordinates or QR publication |
| Contact and abuse controls | PASS | Validation, consent, honeypot and rate limiting; no Turnstile claim |
| Image and private-data boundaries | PASS | Raster decode/re-encode, pixel/size limits, random names; applications in private database, no file attachments |
| SEO metadata and HTTP error status | PASS | Route-specific escaped server metadata, canonical variant redirects, dynamic public sitemap/robots, real404 and synchronized client/Open Graph metadata; page body remains React-rendered |
| Synthetic MariaDB integrity | PASS | Fresh and repeated migrations, restrictive FK, transaction and financial integrity checks |
| Existing database migration adoption | BLOCKED | Local reviewed-schema strategy passes 17 rehearsal checks and 10 focused tests; production ledger remains untouched, historical execution unknown and actual adoption/reconciliation unapproved |
| Flask mail-outbox/retry parity | BLOCKED | No Node source implementation or delivery configuration; email remains disabled |

No unsupported feature is silently represented as complete. Structured Flask application fields/private attachments, legacy audit completeness, SEO and mail-outbox work remain implementation limitations in addition to the evidence-dependent historical/member blockers. This is a partial upgrade and a synthetic-staging review package, not final production acceptance.

Finalization:191 full regression tests plus7 focused readiness tests pass in separate runs;27 MariaDB checks,126 responsive checks,14 browser interactions and7 production-mode checks pass. Retained recovery18/18 and adoption17/17 were not repeated. See PRODUCTION_BLOCKERS.md for critical/business-approval/deferrable classifications. Direct production readiness remains NO.
