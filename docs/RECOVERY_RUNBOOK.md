# Isolated recovery proof and future operator procedure

PASS:18/18 synthetic recovery checks, retained without repeating the completed rehearsal. Evidence: .qa/recovery/results.json. Script: scripts/rehearse-recovery.mjs. These are local synthetic fixtures only, never production backup tooling.

The rehearsal used native MariaDB dump/client tools with a consistent transactional logical dump and SHA256, restored into a fresh empty synthetic destination, compared every table's DDL/rows/identifiers/timestamps/counters, restored two synthetic public images and verified their hashes. Restored admin authentication, exact financial filters/totals/provider references, contact/application submission, private review/status/audit and retired payment paths passed. Candidate restart retained records/images. Corruption and restoring an older backup over a nonempty/newer database were refused.

Code rollback was exercised using the previously verified payment-retired local source corresponding to ZIP c0e7887a11a2e9a79a5b50593d5d84f73c2b5bcdf411c6250efc9112f1e857f4. All43 manifest source-file hashes were verified before preserving the rollback fixture. Its existing dist was copied and exercised, not independently hash-verified as a built artifact. This is **not** a proof of exact active Hostinger release recovery. No database downgrade or old backup restore was used for code rollback; newer application/audit records remained intact.

Future authorised live-backup acceptance must include:

1. Named operator, approved maintenance/consistency controls and protected backup storage. Never include secrets/private backups in the release ZIP or Git.
2. Existing schema/ledger, transactional records, original identifiers, financial amounts/provider references and persistent public/private storage appropriate to the real deployment. This run copied none of those private live records.
3. Checksums, counts/id sets, integer financial reconciliation, media references and permissions before backup; independent restore to an isolated destination with outward mail/payment operations disabled.
4. Restore verification of keys/anti-joins, timestamps, immutable receipt/refund/subscription lineage and representative authenticated workflows using authorised personnel. Record elapsed recovery and operational ownership without publishing private rows.
5. A current rollback artifact/managed version control that maintains payment retirement. Preserve every existing release; do not reset symlinks, overwrite public_html or drop additive tables/columns.
6. Treat code rollback and database restore separately. Never restore an old database over post-cutover financial/application/audit writes without an independently approved reconciliation plan. Stop on missing files, hash/id/amount differences or unverified hosting controls.

These live requirements remain critical and unverified. They do not require a separate public staging subdomain, but they cannot be waived by the local18-check result. The temporary synthetic CLI explicitly uses the non-TLS loopback QA instance; its flags/credentials are not a production connection procedure. Do not adapt it by replacing credentials or removing target restrictions.
