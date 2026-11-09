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

## Final completion pass

- Added bulk gallery draft upload with per-file preview, album, title, caption, order, status and retry keys.
- Added staged organisation settings with authenticated preview, revision matching, audit logging and transactional publication. The legacy API remains compatible.
- Added featured programmes and programme descriptions to published homepage settings, accessible route breadcrumbs, dedicated programme and policy layouts, and mobile menu entrance.
- Express now uses published settings for initial HTML metadata. Canonical URLs and robots rules are still controlled by the application. Optional sharing image paths are restricted to same-site static images.

| Current verification | Result |
| --- | --- |
| Final automated regression | 200 passed across 31 files |
| Isolated MariaDB integration | 36 passed, including organisation draft staleness and gallery retry idempotency |
| Browser acceptance extension | Organisation draft and publication, gallery batch partial failure and publication, homepage settings, FAQ, footer and server HTML metadata passed |
| Current responsive matrix | 145 checks passed across 29 routes at 1440, 1280, 768, 390 and 360px. 55 screenshots captured. |
| Local mobile warm navigation sample | DOMContentLoaded 60 ms, load 63 ms. This is a loopback sample, with no hosted latency measurement. |
| ESLint and production build | Passed |
| Schema | No migrations added or changed in this pass. Prior 17-check upgrade rehearsal retained as baseline evidence. |
| Actual Hostinger staging | BLOCKED pending authorized isolated application access and database |
| Production | No deployment or database mutation |

## Limits

The redesign uses the documented reference structure and retains applicable existing Sampark layouts. Exact DFLWF visual and animation parity remains unverified after the prior HTTP 403. The settings editor uses validated JSON. Mission, vision and history are managed in site settings, while contact and organisation identity use the organisation draft editor. Certificate publication supports reviewed JPEG, PNG and WebP images. Live certificate copies, payment details, impact figures and testimonials require academy-approved source material.

Browser and integration evidence use synthetic records only. Member, programme, certificate and donation scenarios verified in the previous implementation retain their prior evidence. The new browser pass targets changed workflows and public route rendering. Automated accessibility coverage covers selected behaviors and does not constitute a full conformance audit.

The regenerated archive and separate SHA-256 and manifest are delivered in the final-redesign outputs directory. See HOSTINGER_DEPLOYMENT.md for setup, migrations and smoke tests, and ROLLBACK_PLAN.md for rollback and visibility compatibility.
