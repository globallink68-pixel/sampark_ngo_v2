# Direct manual cutover preparation

User decision: prepare the existing domain for a future manual cutover; no public staging hostname is required. Do not deploy or mutate production. Prior verification is retained unless code changes justify focused regression.

- [ ] Capture current production schema, aggregate financial/media reconciliation and runtime facts through read-only SSH; do not export private rows or environment values.
- [ ] Compare an isolated synthetic reconstruction of the observed schema to migrations 001–005. Design evidence-based adoption that leaves the refusal guard intact and refuses unreviewed schema differences.
- [ ] Resolve feasible parity gaps (SEO/error status, current-operation audit, mail capture/retry and privacy-aware verification) using source-defined rules; preserve evidence-dependent historical blockers.
- [ ] Rehearse additive migrations, existing identifiers/data/media preservation and old/new application compatibility in isolation.
- [ ] Verify changed features, then final regression/build/production-like startup; preserve the prior release package.
- [ ] Generate a versioned local candidate and direct-domain maintenance-window cutover/rollback checklist with every gate PASS, FAIL or BLOCKED.

Critical gates cannot be marked PASS from synthetic tests alone: actual recoverable backup, production reconciliation/identity mapping, Linux runtime/persistent-storage acceptance and verified hosting rollback control require evidence. Unverified documents/payment paths remain unpublished/retired. If any required gate remains blocked, mark NOT READY and do not recommend cutover.

Focused runtime checkpoint: PASS — absolute Node 22 executable located at /opt/alt/alt-nodejs22/root/usr/bin/node (v22.23.4), and the prepared read-only helper now uses it. BLOCKED — MariaDB authentication returns ER_ACCESS_DENIED_ERROR in the standalone SSH invocation. No credential recovery, production changes or repeat local verification was attempted. See the original workspace's .qa/production-checkpoint/RUNTIME_INSPECTION.md. Per the latest user scope, stop after this focused runtime/schema attempt; remaining cutover work is not represented as completed.
