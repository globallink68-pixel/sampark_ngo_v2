# Node MariaDB migration and reconciliation

Existing live evidence: MariaDB 11.8.9, nine tables, no schema_migrations ledger. No production migration or row write was performed. The Flask database is an independent source.

PASS: fresh isolated MariaDB migrations, repeat-run checksums, foreign-key restriction, audit/application transactions, integer donation sums and unchanged financial rows after retired mutation requests. Evidence: `.qa/integration.json`.

The runner executes reviewed DDL statements individually under a database advisory lock. MariaDB DDL commits implicitly: a partial failure requires operator review; it is not claimed to roll back DDL. Applied-file checksum mismatch refuses execution. Never edit a recorded migration.

BLOCKED for existing production adoption: missing migration provenance. The runner deliberately refuses any nonempty database lacking a ledger. Do not create a fake ledger or rerun 001–005 on production. An authorised database operator must compare SHOW CREATE TABLE on an isolated, access-controlled clone against every statement in 001–005, including keys, indexes, defaults, types and collation. Record every difference and reconcile the clone. Only after exact review may the operator establish a baseline ledger using checksums of the reviewed files, then test 006–007 on that clone. This run did not export production data or perform that operation.

006 adds private applications, editable plain-text content and audit records without modifying financial tables. 007 adds admin active/role fields with existing accounts defaulting to active admin; existing session_token/expires_at fields now enforce revocation. No new privilege types are inferred. New logins replace prior sessions; logout revokes stored sessions. Existing pre-upgrade sessions require login again.

Read-only reconciliation checklist for a future authorised cutover:

1. Preserve all existing releases, database backup and persistent uploads using the hosting operator's approved process; verify restore on isolated infrastructure.
2. Record table counts, id sets, foreign-key anti-joins, media references/hashes and schema fingerprints without publishing row data.
3. Compare integer SUM(amount) by status and currency; preserve every original order/payment id and timestamp. Never recalculate history with floating point.
4. Reconcile external provider/receipt/mandate records through authorised staff. Retired endpoints do not cancel external mandates.
5. Map Flask namespaces separately from Node ids. Receipt snapshots, refunds, subscriptions, source timezone semantics and identity collisions require explicit mapping before an importer can be enabled.
6. Recheck counts, financial totals, identifier uniqueness and media visibility after staging migrations and before any future cutover. Stop on differences.

BLOCKED: Flask financial import, private historical receipt rendering and subscription/refund history are intentionally not invented. The inspected Node schema contains no source records for those features. `/api/receipts/:id` fails closed with 404. No synthetic history is part of the migration or release package.
