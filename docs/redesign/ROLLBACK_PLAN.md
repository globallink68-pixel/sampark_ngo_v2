# Rollback

Before a separately approved cutover, record the active code version, Node runtime, migration ledger, database backup and persistent upload directory. Keep the prior application package available and rehearse restoration in staging.

- If the new app fails, route traffic back to the previous verified release and restart its existing Express entry point with its original configuration.
- Leave additive tables and columns in place. Dropping them would discard drafts, approved media and audit-linked history.
- The previous application does not understand the new visibility flags or record images. Before rolling back to a build that predates migration 010, review all records that were published or hidden with the new editor and account for the visibility and image URL differences. Keep public traffic off that build until this is verified.
- If old semantics cannot safely serve the current data, use a maintenance response while restoring a consistent application and database pair to a separate staging target. Reconcile post-backup writes before any live database restore.
- Verify public and admin smoke checks, image URLs, visibility and data persistence after rollback.
