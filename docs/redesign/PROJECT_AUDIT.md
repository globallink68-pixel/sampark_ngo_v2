# Project audit

Baseline 336bfbc on sampark-node-staging-20261105. Redesign branch redesign/sampark-public-cms preserves the pre-existing modification to docs/PRODUCTION_BLOCKERS.md.

- React 19, React Router 7 and Vite 6. Public rendering lives in src/public.jsx with Bootstrap and local reference and compatibility styles. The admin dashboard is in src/admin.jsx and src/workflows-admin.jsx.
- Express 5 and mysql2 serve the API and built React assets. server/seo.js handles metadata and status for direct route visits. server/server.js is the documented Hostinger entry point.
- Seven versioned migrations cover sessions, members, media, programmes, organisation settings, enquiries, applications, published pages and audit events. Deployment guidance and the baseline adoption rehearsal are already documented under docs.
- Admin endpoints rely on session cookies, active admin role and same-origin checks on mutations. Upload handling uses Multer and Sharp. Existing uploaded content is publicly served, so draft or private assets require separate access controls.
- Existing checks include Vitest, Supertest, Playwright browser evidence, upload security and MariaDB migration rehearsal. These are baseline assets and were not rerun during discovery.

## CMS coverage and gaps

| Module | Existing foundation | Required extension |
| --- | --- | --- |
| Branding | Bundled logo and favicon, hero content slots | Admin-controlled assets, colours and branding text |
| NGO profile | Organisation settings API and editor | Complete public profile fields and staged publishing |
| Members | Member CRUD, photos, order and active flag | Categories, safe draft photos, explicit publication |
| Homepage | Hero text slots and static sections | Structured editing, visibility, ordering, imagery and CTA validation |
| Programmes | CRUD, photos, listing and detail | Categories and drafts that preserve the live revision |
| Gallery | Image CRUD and public gallery | Batch upload, album management and safe deletion |
| Certificates | Transparency page | Verified document upload, preview and publication |
| Donations | Public manual donation page and historical donation reports | Explicit verification, staged bank details and approved QR |
| Site settings | Contact and social fields in organisation settings | Footer, navigation, and publication controls |

The current content publication flag cannot preserve an already published revision while the next revision is being edited. Audit events exist for selected workflows. The requested CMS needs draft isolation and audit coverage across every module.
