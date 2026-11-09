# Delivery matrix

| Requirement | Status | Implementation and evidence |
| --- | --- | --- |
| Branding | COMPLETE | Private logo, favicon and hero drafts, published header and footer logo, organisation name and tagline. Chrome publishing workflow passed. |
| Homepage | COMPLETE for configured fields | Hero image and text, primary CTA, optional impact and testimonials, FAQ, section ordering and visibility. Validated configuration uses the content draft editor. |
| NGO details | PARTIAL | Existing organisation editor manages contact, address and social fields. About, mission, vision and history use draft publishing. Organisation record as a whole still uses its existing immediate-save workflow. |
| Members | COMPLETE | Staged creation and edits with category, active flag, public visibility, ordering and private photo. MariaDB and combined Chrome workflow passed. |
| Programmes | COMPLETE | Staged records, dates, category, visibility and private media. MariaDB confirmed publication and preservation of existing image URLs. |
| Gallery | PARTIAL | Staged image, caption, album, order, visibility and public album filter. MariaDB and gallery keyboard checks passed. Batch upload remains outstanding. |
| Certificates | COMPLETE for image records | Verified, redacted image previews and revocable public endpoints. MariaDB checks passed. Live source copies still require academy approval. |
| Donations | COMPLETE for manual methods | Verified bank and UPI details, QR publication and withdrawal. No gateway. MariaDB checks passed. Live details require academy approval. |
| Website settings | PARTIAL | Validated JSON settings publish navigation, footer, FAQ and browser metadata. Existing editor covers contact and socials. Metadata overrides are browser-side. |
| Record migrations | COMPLETE | Migrations 010 and 011 and the upgrade rehearsal passed with 17 checks. Existing IDs, data and legacy schema definitions preserved. |
| Public refresh | PARTIAL | Shared styling, route entry and hover motion, reduced-motion behavior, album filter and dynamic content. Existing route layouts retained. |
| Reference comparison | BLOCKED | DFLWF rendered access remains unavailable from prior HTTP 403 checks. No exact visual parity claim. |
| Combined CMS acceptance | COMPLETE for exercised workflow | Chrome verified logo, hero, member and description from private drafts to public reload without rebuild. Stale revision and protected-image checks also passed through the MariaDB integration suite. |
| Responsive verification | COMPLETE for exercised routes | 145 checks across 29 routes and 5 widths. Mobile navigation Escape, gallery dismissal, FAQ and reduced motion passed. |
| Hostinger | LOCAL CANDIDATE | Production build, source, migration and rollback documentation, manifest and checksum. Actual hPanel staging and cutover remain unverified. |

See FINAL_ACCEPTANCE_REPORT.md for exact evidence and limitations.
