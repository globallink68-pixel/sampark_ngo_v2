# Hostinger migration status

Follow docs/DATABASE_MIGRATION_PLAN.md and docs/HOSTINGER_STAGING_GUIDE.md. The runner refuses a nonempty database without a reviewed migration ledger. Do not run it against production or fabricate baseline entries. Production readiness is NO.

The managed Node.js source-ZIP workflow preserves server/server.js, builds Vite to dist and uses a persistent PUBLIC image root outside versioned releases. Verify Linux dependencies, TLS/proxy behavior and restart persistence in a separate staging app. Payment operations remain retired; historical reconciliation is manual and separately authorised. Older payment-test instructions are superseded.
