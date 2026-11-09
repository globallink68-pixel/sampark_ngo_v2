# Route inventory

Source inventory from src/public.jsx, src/main.jsx, server/seo.js, server/app.js and server/workflows.js.

| Area | Routes |
| --- | --- |
| Core public | /, /about, /transparency, /our-work, /gallery, /team, /members, /contact, /donate, /join-us, /search, /verify-member |
| Programmes | /programs, /programs/:id |
| Participation | /volunteer, /internship, /membership, /csr, /pickup, /sponsor, /sponsors |
| Published content | /campaigns, /activities, /campaigns/:slug, /activities/:slug, /pages/:slug |
| Policies | /policies/:slug with baseline SEO entries for privacy, terms, donation, refund and volunteer |
| Admin | /admin, /admin/login, /admin/gallery, /admin/members, /admin/programs, /admin/organization, /admin/messages, /admin/donations, /admin/applications, /admin/content, /admin/audit |
| Public APIs | /api/health, /api/organization, /api/members, /api/gallery, /api/programs, /api/programs/:id, /api/contact, /api/applications/:kind, /api/content, /api/content/:slug, /api/page-metadata |
| Other | /uploads, /robots.txt, /sitemap.xml and SPA fallback |

The admin API includes authentication, member/gallery/programme mutations, organisation updates, enquiry interactions, application and content management, audit review and historical donation reporting. Legacy payment endpoints retain their retired response.
