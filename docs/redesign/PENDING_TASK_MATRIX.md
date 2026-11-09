# Delivery matrix

| Requirement | Status | Implementation and evidence |
| --- | --- | --- |
| Branding | COMPLETE | Private logo, favicon and hero drafts, published header and footer logo, organisation name and tagline. Chrome publishing workflow passed. |
| Homepage | COMPLETE for configured fields | Hero image and text, primary CTA, optional impact and testimonials, FAQ, section ordering and visibility. Validated configuration uses the content draft editor. |
| NGO details | PASS | The organisation editor stages the existing profile fields and publishes a reviewed revision. About, mission, vision and history use published content settings. Registration documents use the verified certificate workflow. |
| Members | COMPLETE | Staged creation and edits with category, active flag, public visibility, ordering and private photo. MariaDB and combined Chrome workflow passed. |
| Programmes | COMPLETE | Staged records, dates, category, visibility and private media. MariaDB confirmed publication and preservation of existing image URLs. |
| Gallery | PASS | Multi-image selection, previews, album, captions, order and per-file status. Duplicate-safe retries for pending drafts, partial failure reporting and individual publication were verified. |
| Certificates | COMPLETE for image records | Verified, redacted image previews and revocable public endpoints. MariaDB checks passed. Live source copies still require academy approval. |
| Donations | COMPLETE for manual methods | Verified bank and UPI details, QR publication and withdrawal. No gateway. MariaDB checks passed. Live details require academy approval. |
| Website settings | PASS | Validated settings publish navigation, footer, FAQ, featured programmes and page descriptions. Express renders published title, description, canonical and Open Graph fields. |
| Record migrations | COMPLETE | Migrations 010 and 011 and the upgrade rehearsal passed with 17 checks. Existing IDs, data and legacy schema definitions preserved. |
| Public refresh | PASS for verified behaviors | Added route banners and breadcrumbs, dedicated detail and policy layouts, mission and vision, homepage programme selection, and mobile menu entrance. Exact reference design remains blocked. |
| Reference comparison | BLOCKED | DFLWF rendered access remains unavailable from prior HTTP 403 checks. No exact visual parity claim. |
| Combined CMS acceptance | COMPLETE for exercised workflow | Chrome verified logo, hero, member and description from private drafts to public reload without rebuild. Stale revision and protected-image checks also passed through the MariaDB integration suite. |
| Responsive verification | COMPLETE for exercised routes | 145 checks across 29 routes and 5 widths. Mobile navigation Escape, gallery dismissal, FAQ and reduced motion passed. |
| Hostinger | BLOCKED for hosted staging | A regenerated ZIP includes build, source, existing migrations, environment template and deployment instructions. An authorized isolated hPanel application and database were unavailable. |

See FINAL_ACCEPTANCE_REPORT.md for exact evidence and limitations.
