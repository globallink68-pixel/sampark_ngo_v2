# Node MariaDB baseline adoption and reconciliation

Updated 5 November 2026. Direct production readiness: **NO**. No production files, environment, records, schema or ledger were changed. The normal migration refusal guard and application source are unchanged.

## Verified schema and connection evidence

Read-only metadata captured at 2026-11-05 13:21:43 UTC: MariaDB 11.8.9; nine InnoDB tables; no `schema_migrations` ledger. Authentication and metadata access PASS using the existing live application's server-side configuration. The earlier helper's 1045 / SQLSTATE 28000 failure supplied no password: SSH had no DB_* values and the expected .env did not exist. No credentials were emitted, exported, reset or changed. Earlier successful discovery also used the running application configuration; the exact earlier command was not retained, so no literal command equivalence is claimed.

Saved evidence: original workspace `.qa/production-checkpoint/database-diagnostic.json` and `schema-comparison.json`. Only metadata was fetched in this inspection; counts/financial data/media were not re-queried or re-exported.

## Exact differences

| Comparison | Finding | Classification |
|---|---|---|
| Existing column names, types, nullability, defaults, primary/unique/index/FK definitions | 9/9 table-definition sets match the observed baseline represented by migrations 001–005 | PASS, scoped structural comparison; not proof of execution history |
| Engine and table collation | 9/9 InnoDB, utf8mb4_uca1400_ai_ci, same as local reference | PASS; no cross-environment table-collation difference |
| organisation column order | Production tail: linkedin_url, google_maps_url, website_url, created_at, updated_at, threads_url, x_url. Migration 005 tail: linkedin_url, threads_url, x_url, google_maps_url, website_url, created_at, updated_at | Harmless for existing named-column SQL and object-field access; no reordering proposed |
| MariaDB formatting | Quoted identifiers, int display widths, boolean→tinyint(1), explicit NULL/default formatting and omitted default RESTRICT syntax | Normalized engine representation; no observed structural conflict |
| Auto-increment counters | Production counters are data-dependent; excluded only from schema fingerprint equality | Must be preserved and reconciled independently; not reset or treated as migration evidence |
| Migration 006 | applications, content_pages and audit_events are absent in production | Expected three additive tables, not a baseline mismatch |
| Migration 007 | admins.active and admins.role are absent | Expected two additive columns; existing fields and identifiers retained |
| Migration history | No ledger; physical column order differs from migration 005 | Historical execution remains UNKNOWN; do not invent applied_at dates or assert 001–005 executed |

Database default collation is utf8mb4_unicode_ci, while existing tables use utf8mb4_uca1400_ai_ci. This is an existing database-vs-table distinction, not a difference between the compared tables. The fixture preserves the observed DDL verbatim except volatile counters. Observed SQL mode is IGNORE_SPACE,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION. Production session timezone SYSTEM currently resolves to UTC; this does not establish historical Flask timestamp semantics.

## Non-destructive adoption strategy

1. Require an independently reviewed schema snapshot, the exact checksums of migration files 001–005, a named review reference and explicit acceptance of the organization_settings column-order difference. Similarity alone never authorises adoption.
2. Freeze the reviewed baseline fingerprint over all nine original table definitions, engines and collations. Ignore only auto-increment counter values; do not ignore unexpected tables, financial types, keys, defaults, collation changes or unapproved ordering changes.
3. Preserve every original table and row. Do not run migrations 001–005, reorder columns, regenerate identifiers or rewrite financial/provider references.
4. Record five **adopted_schema** ledger entries with checksum, baseline fingerprint, review reference and adopted_at. Set **applied_at to NULL**: these entries explicitly attest an observed schema, not known historical execution. Later migrations default to provenance **executed** with actual execution timestamps.
5. Prepare a complete ledger under `schema_migrations_pending_review`; insert all five records transactionally. Only after successful validation/commit rename that ledger atomically to `schema_migrations` while holding the migration advisory lock. Until then, the unchanged migration runner must refuse the database. MariaDB DDL is not transactionally rolled back; a leftover pending table is an operator-review blocker, never an instruction to weaken the guard.
6. Run the unchanged runner only against an approved adopted target. It verifies file checksums, skips the explicitly covered baseline, and executes additive 006–007. Repeating it must change no data or ledger rows. An adoption rerun is supported before upgrade; after upgrade, use the normal migration runner and a new schema-drift review, not an attempt to re-adopt the old snapshot.
7. Perform independent record, financial, media and recovery reconciliation before any real cutover. Fail closed on unexpected differences.

The executable demonstration is deliberately restricted to TCP loopback port 33379 and database names `sampark_adoption_<digits>`; socket-path and custom-stream overrides are rejected before queries. **It is not a production adoption command. Do not edit out these restrictions or rename a production database to satisfy them.** A separately reviewed and authorised production operator procedure/tool is still required. No ledger was created or altered in production.

## Isolated rehearsal evidence

PASS: **17/17** real MariaDB rehearsal checks; **10/10** focused unit checks (eight new adoption checks and two existing migration-safety checks); zero failures/skips. Evidence: `.qa/adoption-rehearsal/results.json` and `focused-tests.json`. Script: `scripts/rehearse-baseline-adoption.mjs`; metadata-only fixture: `tests/fixtures/observed-baseline-schema.json`.

The fixture uses the observed nine-table DDL, engine/collation, database default collation, observed non-strict SQL mode and UTC-equivalent session timezone. Every data row, identifier, financial amount/provider reference and image is explicitly synthetic. It is not a private production database clone.

Verified: all original values/identifiers/timestamps/auto-increment positions and column/key/FK definitions preserved; synthetic historical financial values/provider identifiers unchanged; public image hash unchanged; existing admin hash preserved with documented active/admin defaults; adoption idempotent before upgrade; 006–007 execute once; second migration run changes no rows; unknown financial type and changed migration checksum refuse adoption before ledger creation. Injected interruption rolls back pending ledger rows, exposes no normal ledger and leaves the unchanged runner refusing the database.

Independent review found and resolved a socket/custom-stream isolation loophole; regression tests observed failure before the guard fix and pass afterwards. The reviewer confirmed the fix with no further important findings.

## Remaining gates

PASS locally: structural schema comparison, explicit non-fabricated baseline semantics, isolated adoption/preservation/idempotency/failure rehearsal.

BLOCKED for production: approved production adoption operation, actual row/financial/provider/media reconciliation, independently recoverable backup/restore evidence, Linux candidate runtime/persistence acceptance, verified hosting rollback control and outstanding feature/source approvals. Schema-only rehearsal cannot close these gates. Receipt/refund/subscription import and member verification still require independent source/identity/consent records. Keep all payment mutations retired and unverified legal/bank/QR documents unpublished.

The previous 170 unit / 27 database / 126 responsive / 10 browser / 7 production-smoke checkpoint remains historical verified release evidence and was not repeated. No application runtime code or release ZIP was changed by this rehearsal work.
