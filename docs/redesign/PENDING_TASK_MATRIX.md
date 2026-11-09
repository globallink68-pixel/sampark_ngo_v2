# Remaining delivery matrix

| Requirement | Current implementation and status | Remaining files or dependencies | Validation |
| --- | --- | --- | --- |
| Branding | PARTIAL. Logo and favicon have authenticated drafts and audited publication. | src/public.jsx, src/site-image-settings.jsx. Editable tagline, footer branding and other brand settings. | Logo and favicon publication passed in Chrome. |
| Homepage | PARTIAL. Hero image and text publishing exist. | src/public.jsx and existing content editor. Structured section settings, CTAs, order and visibility. | Hero image publication passed in Chrome. |
| NGO details | PARTIAL. Organisation settings and text slots exist. | Organisation editor, public About page and draft API. Full staged organisation record. | Combined workflow NOT TESTED. |
| Members | PARTIAL. Existing editor supports public member records and photo uploads. | Member CRUD and public profiles. Add draft revisions, private media, category and explicit public visibility. | Browser publication NOT TESTED. |
| Programmes | PARTIAL. Existing CRUD, image and detail route. | Programme editor and API. Add category and staged publication. | New workflow NOT TESTED. |
| Gallery | PARTIAL. Existing image editor, gallery and lightbox. | Gallery editor and API. Add albums, multi-upload and private revisions. | New workflow NOT TESTED. |
| Certificates | MISSING. Transparency page exists. | Verified and redacted source documents, safe document storage and editor. | Publication NOT TESTED. |
| Donations | PARTIAL. Manual donation page exists. | Dedicated verified draft fields, approved QR and explicit publication. | New workflow NOT TESTED. |
| Website settings | PARTIAL. Organisation contact and social links plus text editor. | Navigation, footer, FAQ and metadata settings and rendering. | New workflow NOT TESTED. |
| Image publication | COMPLETE for logo, favicon and hero. | server/site-images.js and migration 009. Extend private workflows to record images in later modules. | MariaDB integration and Chrome passed. |
| Public redesign and motion | PARTIAL. Homepage and shared header consume published branding. | Public route components and design styles. Full visual refresh, motion and route testing. | Homepage overflow passed at five widths. |
| Reference visual comparison | BLOCKED. Prior DFLWF browser navigation returned HTTP 403. | Authorized reference captures or normal browser access. | No similarity score or visual parity result. |
| Full CMS acceptance | NOT TESTED. Branding and hero were exercised in isolation. | Member draft workflow and combined browser fixture. | Verify all four requested updates plus audit and persistence. |
| Hostinger release | PARTIAL. React build succeeds and migration runs locally. | Final integrated package, checksums, smoke tests and rollback documentation. | Production deployment was not performed. |

Migration 009 adds two tables. Images are validated and normalized to WebP before being stored. Current and historical published bytes have immutable URLs. Draft bytes are available only through authenticated, slot-bound previews. Replacing a draft removes only the previous unpublished blob, in the same transaction. Published history is retained to avoid breaking older references. Database backups include the image tables. Rolling back application code can leave these additive tables in place for later recovery.

The next implementation step is member draft revisions with protected photographs and explicit publication. Existing member records and image URLs require compatibility coverage.
