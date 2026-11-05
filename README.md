# Sampark Skill Academy — local Node upgrade

React + Vite + Express + MariaDB. Implementation is PARTIAL. The source ZIP is for isolated synthetic staging review; it is not approved for production cutover.

Start with docs/SAMPARK_IMPLEMENTATION_STATE.md and docs/FEATURE_PARITY_MATRIX.md. See release/HOSTINGER_MANUAL_DEPLOYMENT.md for the source-ZIP managed Node.js workflow. Never extract the release over production public_html or run migrations against the current database.

Local verification: npm ci, npm test, npm run lint and npm run build. Run the server only with an explicitly configured local synthetic database. server/server.js uses the host-provided PORT. Payment mutation routes are unconditionally retired; no payment or email credentials are needed.

The integration helper scripts/verify-integration.mjs is intentionally hardcoded to an isolated loopback MariaDB on port 33379 with synthetic-only credentials. It creates a NEW database for every run. It must never be adapted to production. Synthetic MariaDB installation/start instructions and available local evidence are described in docs/SAMPARK_IMPLEMENTATION_STATE.md. Browser script uses the installed Windows Chrome executable; adjust that local test path when using a different test machine. Runtime source remains platform independent.

Private application records, databases, environment values and uploads stay outside Git and release archives. No production deployment was performed.
