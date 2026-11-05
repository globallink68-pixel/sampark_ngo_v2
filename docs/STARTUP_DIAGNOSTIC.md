# Isolated production startup diagnosis

Status: PASS. No Hostinger access or production changes were made.

The original helper polled a fixed port about sixty times with 100ms sleeps, then attempted the first required check even if readiness had never been established. It did not distinguish module/application initialization, child exit, binding, stalled HTTP requests or spawn failure, and did not await child termination. The original failure had an empty child log, so its exact OS-level initiating delay cannot be reconstructed. It is not evidence of a broken application or database. An earlier 8631ms field labelled startup_elapsed_ms measured the **whole suite**, not startup; that label is superseded.

The corrected verification harness validates the candidate directory/entry/dist and production environment, restricts the database name to a synthetic fixture on loopback port33379, and performs a read-only synthetic SELECT 1 probe. A free TCP port avoids stale-process collisions. A QA-only preload records preload/listen phases, forces temporary server binding to 127.0.0.1 and verifies the actual bound address; the production entry point remains unchanged.

Readiness now has a real 30-second absolute deadline, individually aborted requests, immediate spawn/exit diagnostics and safe cleanup that awaits child exit. Thirty seconds is an upper verification bound, not a claim that startup needs thirty seconds. Expected pre-listener ECONNREFUSED is recorded separately from failures. Subsequent smoke requests also have finite deadlines.

Final instrumented run: seven checks passed; HTTP ready after 722ms, seven attempts; spawned53ms, preload121ms, listen-called642ms, listener666ms; actual bind127.0.0.1; synthetic DB probe24ms. The process remained running until deliberate cleanup and emitted only Server listening. Saved evidence: .qa/production-smoke.json. Timings are local diagnostic samples, not hosted performance certification.

Seven focused readiness tests pass: readiness after the former six-second threshold, immediate child exit, non-loopback refusal, bounded stalled requests, forced loopback listening, wildcard override and path/invalid-port refusal. Independent review's bind-isolation finding was fixed and confirmed; no outstanding important findings remain in that review's scope.

The final clean candidate install added122 production packages, audited123 packages with zero known advisories, and built successfully. The whole development audit also found zero known advisories. Final production-mode smoke uses that exact candidate. No migrations, baseline adoption, payments or production startup were executed remotely.
