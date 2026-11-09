# Preservation checklist

- Preserve existing public URLs, detail routing, SEO metadata, HTTP status and Express fallback behavior.
- Preserve API contracts, session revocation, admin authorization, same-origin checks and contact/application workflows.
- Preserve historical financial records and keep online checkout retired.
- Preserve MariaDB records, IDs, migration checksums and the baseline adoption guard. Rehearse additive migrations on an isolated database.
- Keep drafts, private member data and unapproved media outside public responses and public static storage.
- Keep existing media URLs working. Protect media referenced by the current published revision from draft deletion.
- Keep the Hostinger Express entry point, persistent upload root and production environment configuration outside release artifacts.
- Verify the mandatory admin publishing scenario and every module against isolated MariaDB and browser sessions before packaging.

Discovery changed no application files, database records or production configuration. Runtime acceptance checks remain pending.
