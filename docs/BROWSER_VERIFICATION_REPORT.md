# Node browser verification

PASS: 21 routes × widths 360, 390, 768, 1024, 1440 and 1920 = 126 checks. No horizontal overflow, broken images or heading-count failures. Ten interactions pass: mobile navigation, keyboard skip link, donation keyboard tabs, gallery modal/Escape/focus restoration, contact submission, membership enquiry, admin authentication/workflow routes, activity listing/search links, application pagination and reduced motion. Final console errors: 0; failed requests/responses: 0.

Evidence: `.qa/browser/results.json`, `.qa/screenshots/`, `.qa/performance/local.json`; reproducible script `scripts/verify-browser.mjs`. Playwright uses the installed Google Chrome binary; browser version is recorded in the JSON. CDP Page.getLayoutMetrics and Accessibility.getFullAXTree were executed alongside browser navigation timing. Measurements are unthrottled local samples, not production Core Web Vitals or a comprehensive WCAG audit.

Initial defects were diagnosed rather than counted as acceptance: hidden-parent static-file rejection; optional-content 404 noise; activity mapping; pagination access. The pagination test's original literal contained an encoding error; the corrected locator passes. The skip-link test now waits for a fresh page to finish loading, avoiding the previous focus/loading race. Earlier failed runs are superseded by final evidence, not claimed as passes.

The 126-check matrix predates only the exact integer monetary formatter, whose unchanged synthetic visible output is covered by two unit tests and the final admin journey. Final production assets were separately built and smoke-tested. Full-screen screenshots cover home/about/donate/programme detail at 390/1440 and admin at 390. Private production data was never used.
