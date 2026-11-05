# Sampark Node release implementation plan

Goal: enhance the recovered React/Vite/Express source using the accepted Flask design and MariaDB architecture; leave production untouched.

Spec: user master autonomous prompt, existing Flask acceptance and feature-parity matrix.

Architecture: retain existing APIs and identifiers, add backwards-compatible migrations for missing workflows. Use an isolated loopback MariaDB 11.8.9 database. Payment mutations must always return 410. No provider credentials or private production files are used.

Execution: inline, as explicitly authorized by the user; no further design approval required. Existing approved design is binding.

- [x] Recover allowlisted source and run baseline tests (152 passed).
- [ ] Establish synthetic database; test original startup and public API before UI changes.
- [ ] Write failing payment retirement tests, disable provider mutation and browser checkout, verify historical reads.
- [ ] Correct migration runner; test fresh application, repeat run and foreign-key protection.
- [ ] Harden sessions, uploads, configuration and dependency vulnerabilities with regression tests.
- [ ] Port approved Flask layouts, public routes, policies and forms with editable content and private application storage.
- [ ] Verify complete API suite, production build, responsive browser matrix and synthetic admin workflows.
- [ ] Review source, archive allowlist/privacy, deployment instructions and checksum; package only if mandatory gates pass.

Review focus: missing migration provenance must refuse unsafe adoption; retired endpoints never call DB/provider; files decode before publication; unauthorized receipts remain private; synthetic data never enters release archives.
