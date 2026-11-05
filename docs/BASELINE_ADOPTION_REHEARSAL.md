# Baseline adoption checkpoint

Result: **PASS in isolation; BLOCKED for production adoption/cutover**.

The schema metadata comparison found 9/9 matching baseline table definition sets, keys, engines and collations. Only organization_settings physical column order differs. No existing table, column, identifier or financial type needs destructive conversion. Migrations 006 and 007 remain additive; the ledger remains absent in production. Matching definitions do not prove historical migrations executed.

The new rehearsal utility is local-only: TCP loopback port 33379, database names sampark_adoption_<digits>, no socket or custom-stream overrides. It records baseline provenance as adopted_schema, leaves applied_at NULL for 001–005, and prepares the ledger under a pending name before atomic rename. The unchanged migration runner remains responsible for checksum checks and actual 006–007 execution.

Executed evidence: 17/17 MariaDB rehearsal checks; 10/10 focused tests, 0 failed, 0 skipped. No previous full test suite/browser/audit was repeated. Independent review's socket-override finding was fixed with failing-then-passing tests and the focused rehearsal rerun. No further important findings remained in that review.

Fixture data are explicitly synthetic. Nine original table row sets, identifiers, timestamps, auto-increment positions, financial amounts/statuses/provider ids, keys/FKs and an illustrative image hash were preserved. The fixture matched observed DDL, SQL mode and UTC-equivalent timezone. Reruns were idempotent. Financial type drift and changed migration checksums were refused. An injected interruption left the pending ledger empty, the normal ledger absent, and the unchanged migration refusal guard active.

Reproduction (isolated local MariaDB only):

```text
npm test -- tests/baseline-adoption.test.js tests/migration-safety.test.js
node scripts/rehearse-baseline-adoption.mjs
```

Evidence: `.qa/adoption-rehearsal/results.json`, `.qa/adoption-rehearsal/focused-tests.json`; metadata-only fixture `tests/fixtures/observed-baseline-schema.json`. Actual production records/uploads were not copied, inspected or reconciled during this task. Production baseline operation, backup/restore, hosted candidate/persistence and recovery verification remain independent blockers. No production deployment is recommended.
