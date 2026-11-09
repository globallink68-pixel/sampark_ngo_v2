# Candidate acceptance report

## Implemented

- Members, programmes and gallery use a shared staged editor with audited publication, revision checks, protected image previews, categories or albums, display order and explicit public visibility.
- Existing record IDs, public media paths and legacy API routes remain compatible. Existing records retain their prior active visibility by default. Newly staged records default to private.
- Site settings support homepage ordering and visibility, hero CTA, navigation, FAQ, footer text, impact and testimonials, mission, vision, history and client-side page metadata. Organisation contact and social fields remain in their existing editor.
- Certificates and manual donations have separate verified publishing flows. Administrators must approve the source and use a redacted certificate image. Withdrawing a record disables public access to its associated image endpoint.
- The shared public design gained an updated header and footer, card styling, entry and hover transitions, reduced-motion handling, album filtering and dynamic donation and transparency panels.

## Evidence

| Check | Result |
| --- | --- |
| Automated regression | 199 passed |
| Isolated MariaDB integration | 34 passed |
| Upgrade rehearsal including migrations 010 and 011 | 17 passed. Original records, IDs, counters and legacy schema definitions verified. |
| Chrome combined publishing workflow | Logo, hero, member and NGO description published and rendered after public reload without rebuilding. Draft privacy, member and description persistence, and audit events verified. |
| Responsive browser matrix | 145 route/viewport checks passed across 1440, 1280, 768, 390 and 360 CSS pixels. No horizontal overflow, broken loaded images or uncaught page errors were observed in the matrix. |
| Interaction smoke | Mobile Escape, FAQ, reduced motion and gallery keyboard dismissal passed. |
| Visual reference comparison | BLOCKED. Prior DFLWF access returned HTTP 403. Existing indexed evidence informed the layout. |
| React build and ESLint | Passed |
| Hostinger production | No deployment or database mutation. Actual hPanel and production migration approval remain outside local verification. |

## Limits

The design is an incremental restyling of the existing route layouts. Exact reference spacing, page compositions and interaction timing are unverified. The settings editor uses validated JSON. Metadata overrides are applied in the browser. Gallery uploads are staged one image at a time. Certificate publication supports reviewed JPEG, PNG and WebP images. Previously public legacy member images can remain available by direct URL after the corresponding profile is hidden. Live donation details, certificate copies, impact figures and testimonials require the academy's verified source material.

See HOSTINGER_DEPLOYMENT.md for staging, migrations and smoke tests. See ROLLBACK_PLAN.md for rollback and visibility compatibility. The archive includes a file manifest and has a separate SHA-256 checksum.
