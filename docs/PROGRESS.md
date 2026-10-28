# Project Progress

## Phase status

| Phase                                                | Status      |
| ---------------------------------------------------- | ----------- |
| 1 — Foundation, tooling, design system, window shell | ✅ Complete |
| 2 — Engine, queue, persistence                       | ✅ Complete |
| 3 — Downloader and Queue UI                          | ✅ Complete |
| 4 — Library, Settings, About                         | ✅ Complete |
| 5 — Hardening and release                            | ✅ Complete |

## Phase 1 plan

- [x] Audit supplied binaries and every design screen.
- [x] Resolve and pin compatible stable dependency versions.
- [x] Add repository hygiene, strict tooling, scripts, and packaging scaffold.
- [x] Build the secure Electron main/preload/renderer foundation.
- [x] Implement tokens, accessible UI primitives, UI kit, and responsive shell.
- [x] Add unit, component, Electron E2E, accessibility, and visual tests.
- [x] Complete README, changelog, architecture, stack, testing, decisions, and design-audit docs.
- [x] Pass `npm run check`, build, development smoke, and host-architecture DMG smoke.
- [x] Commit and tag the completed phase locally.

## Last session

- 2026-10-28: Implemented the 1.0.2 Windows video-finalization fix: explicit UTF-8 yt-dlp output, verified nonempty media paths with exact source-ID fallback, retryable terminal failures for missing/ambiguous output and Library write errors, and a finalization race guard for Queue actions. The three reported Windows unit failures were corrected without increasing timeouts. Node 24.21.0 `npm run check` passed with 129 Vitest and 37 deterministic Electron tests. All six opt-in macOS live tests passed, including real video/audio and the owner's Facebook, Instagram, and YouTube links. Both 1.0.2 DMGs passed package and disk-image verification; the x64 DMG passed a mounted launch and real Facebook download. The arm64 DMG is static-only on this Intel host; Windows 1.0.2 runtime verification remains required on Windows.
- 2026-10-24: Added source-gated 8K (4320p) across format detection, validated IPC, settings persistence, Downloader/Settings UI, deterministic engine coverage, and user documentation while retaining 1080p as the default. `npm run check` passed with 116 Vitest and 37 Electron E2E tests.
- 2026-10-13: Completed the Phase 5 engine-latency fix on `phase-5-engine-latency`. The supplied one-file macOS yt-dlp took 26–28 seconds for `--version`; the checksum-verified official unpackaged runtime returned in 0.42 seconds after its first security scan. A five-minute main-process probe cache now reuses fresh media information, retries the ordinary URL if stale/rejected, and keeps Queue in **Preparing source…** until real progress. Canonical-URL handling was verified against Facebook/Instagram behavior.
- 2026-10-13: Node 24.21.0 `npm run check` passed (111 Vitest tests, 35 deterministic Electron E2E tests); all six opt-in live tests passed, including the owner's Facebook, Instagram, and YouTube links. Three finite performance tests passed with the documented Intel idle-memory deviation unchanged. The 1.0.1 x64 DMG passed static checks, a mounted launch, and a real packaged Facebook download; the arm64 DMG passed static checks only. Both DMGs passed `hdiutil verify` and SHA-256 verification. Only the four superseded 1.0.0 DMG/blockmap artifacts were removed; the installed v1 app and user downloads were not changed.
- 2026-10-09: Phase 1 started on `phase-1-foundation`; baseline typecheck could not run because the repository had no `package.json` yet.
- 2026-10-10: Completed the secure shell, design system, strict tooling, 27 unit/component tests, six Electron E2E tests, documentation, development smoke, x64 packaging, and read-only DMG launch smoke.
- 2026-10-10: Fixed a sandboxed-preload module mismatch and added a regression test for the rapid-close startup fade that had produced repeated main-process error dialogs.
- 2026-10-10: Implemented Phase 2 binary management, ProcessRunner, yt-dlp adapters, persistent queue/history/settings, updater, complete IPC, deterministic fake engine, and dev console harness on `phase-2-engine`.
- 2026-10-10: Captured sanitized real yt-dlp fixtures and passed four macOS live tests: vertical probe, 480p video+audio with duration verification, MP3 extraction, and process-tree kill plus byte-identical resume.
- 2026-10-10: Completed Phase 2 with 72 green unit/integration tests, eight green Electron E2E tests, a green `npm run check`, and a clean development launch smoke after removing the host-only `ELECTRON_RUN_AS_NODE` variable.
- 2026-10-10: Started Phase 3 on `phase-3-downloader-queue`; baseline strict typechecking is green and the Downloader/Queue references are under audit.
- 2026-10-11: Completed the real Downloader and Queue UI, normalized per-job renderer store, live engine status, responsive/accessible visual pass, and all deterministic Phase 3 flows.
- 2026-10-11: Fixed production-bundle development resource resolution, verified changed-job-only renders with React Profiler, held three active jobs above 55 fps, and completed the real Creative Commons UI download smoke.
- 2026-10-11: Reproduced the owner-supplied yt-dlp's 30-second startup edge, widened native-tool probe budgets, eliminated its duplicate version check, and reran the UI live path successfully.
- 2026-10-11: Completed Phase 4 on `phase-4-library-settings-about`: real Library, Settings, and About screens plus native notifications, close/recovery protection, single-instance focus, global drop, and shortcut integration.
- 2026-10-11: Exercised corrupt stores, missing folders, offline and mid-download folder loss, long Unicode titles, 500-row virtualization at 55+ frames per second, relaunch persistence, all-screen axe checks, and visual baselines at 850×600, 1280×800, and 1920×1080.
- 2026-10-11: Closed Phase 4 with a green `npm run check` (94 Vitest + 32 Electron E2E tests), a production build, clean development launch smoke, local Conventional Commit, and `v0.4.0` tag.
- 2026-10-12: Started Phase 5 on `phase-5-hardening-release`; migrated the resolver, verifier, scripts, tests, and packaging inputs to native x64/arm64 macOS folders, verified both FFmpeg 9.0.2 builds plus universal yt-dlp 2026.08.19, and passed the repaired baseline `npm run check` (97 Vitest + 32 Electron E2E tests).
- 2026-10-12: Completed the Phase 5 security, accessibility, performance, cross-platform, licensing, packaging, and release-documentation passes; five real-engine/live tests passed.
- 2026-10-12: Removed the repeated-download soak and its memory-growth threshold by owner decision; retained the one historical result in `docs/PERFORMANCE.md` and removed the executable test and all release commands.
- 2026-10-12: Closed Phase 5 with Node 24.21.0: `npm run check` passed (106 Vitest + 33 Electron E2E), finite performance checks passed with the documented Intel idle-memory deviation, production audit found zero vulnerabilities, both DMGs passed package verification, and the x64 DMG passed a mounted launch smoke.

## Phase 2 plan

- [x] Install and verify a writable yt-dlp copy while keeping FFmpeg in resources.
- [x] Build and exhaustively test spawn-only process execution and tree termination.
- [x] Implement probing, formats, estimates, arguments, progress, phases, and error mapping.
- [x] Capture sanitized real landscape, vertical, audio, unavailable, unsupported, and offline fixtures.
- [x] Implement concurrency, pause/resume/cancel/retry, stall retry, MKV fallback, persistence, recovery, history, notifications, and badges.
- [x] Implement atomic schema-versioned settings, history, and queue stores plus disk/file/clipboard services.
- [x] Expose every Phase 2 operation through zod-validated typed IPC and development-only helpers.
- [x] Pass deterministic integration, relaunch recovery, and real bundled-binary live tests.
- [x] Complete the final `npm run check` and development smoke.
- [x] Create the local Conventional Commit and `v0.2.0` tag after the final repository audit.

## Phase 3 plan

- [x] Render and audit the Downloader and Queue design references at 850×600.
- [x] Build renderer stores and lifecycle-safe IPC hooks with per-job subscriptions.
- [x] Implement the functional Downloader flow, real option availability, folder selection, and user feedback.
- [x] Implement every Queue job state, controls, recovery prompt, ordering, and live badge.
- [x] Add focused component tests and deterministic Electron golden-path, failure, audio, pause/resume/cancel, accessibility, responsive, and visual tests.
- [x] Complete the fidelity and render-performance passes at required viewport sizes.
- [x] Refresh screenshots and Phase 3 documentation.
- [x] Pass `npm run check`, one live end-to-end smoke, and the development golden-path smoke.
- [x] Create the local Conventional Commit and `v0.3.0` tag after the final repository audit.

## Phase 4 plan

- [x] Build Library search, filter, sort, virtualization, missing-file handling, real totals, and both delete paths.
- [x] Build Settings location, real engine update states, effective preferences, defaults, and saved feedback.
- [x] Build About with the local developer photo, fallback, copy-email feedback, allowlisted links, real version, and legal copy.
- [x] Complete system integration for notification routing, badges/progress, active-download close/recovery, window state, single instance, drag/drop, and shortcuts.
- [x] Exercise corrupt stores, missing folders, offline failures, Unicode/long titles, and a 500-row history.
- [x] Add deterministic component and Electron tests, axe checks, and five-screen visual coverage.
- [x] Complete the cross-screen fidelity, accessibility, responsiveness, and React quality passes.
- [x] Refresh all five screenshots and Phase 4 documentation.
- [x] Pass `npm run check`, build, and the development smoke.
- [x] Create the local Conventional Commits and `v0.4.0` tag after the final repository audit.

## Phase 5 plan

- [x] Migrate binary resolution, verification, tests, scripts, and packaging to native `macos-x64` and `macos-arm64` inputs with no legacy fallback.
- [x] Run the repaired baseline gates, then complete full fake-engine and live regression coverage.
- [x] Audit and harden security, accessibility, cross-platform paths/processes, Windows cleanup semantics, and line-ending/tooling portability.
- [x] Implement diagnostics and packaged-license access, final icon plumbing/verification, and GPL-3.0-or-later compliance notices.
- [x] Measure startup, bundle, memory, CPU, and 5,000-row performance on the Intel Mac baseline; document deviations honestly.
- [x] Produce and smoke-check separate macOS x64 and arm64 artifacts, with static-only arm64 checks clearly identified.
- [x] Complete release, platform-test, QA, open-source, README, changelog, architecture, testing, and provenance documentation.
- [x] Pass `npm run check`, live tests, build/package smoke, audit, and the complete Phase 5 Definition of Done.

## Phase 5 engine-latency fix plan

- [x] Measure the bundled engine and the official unpackaged macOS alternative, then select a verified runtime path.
- [x] Keep preview metadata in the main process for the download and provide a safe fresh-URL fallback.
- [x] Report preparation, transfer, and post-processing accurately in the Queue, with immediate first progress.
- [x] Add focused regression tests and run deterministic Electron Playwright plus opt-in live checks of the owner's three links.
- [x] Run all quality gates, build and verify new versioned macOS DMGs, then retire only superseded release artifacts.
- [x] Update README, performance and architecture documentation, decisions, testing notes, changelog, and release checksums.

## Known issues

- The Intel baseline uses 388.06 MB idle working-set memory versus the original 300 MB target; the addendum classifies this measured Intel-only deviation as non-blocking.
- `npm audit` reports eight moderate development-only transitive findings in electron-builder and zero production, high, or critical findings.

## Owner verification

- The 1.0.2 Windows installer, video merge/finalization, Queue/Library agreement, and real UI smoke require a native Windows run.
- Apple Silicon runtime behavior requires the owner's friend to follow the Phase 5 test guide.
- Windows installers cannot be built on this macOS host under the project's native-host rule.
- Run the public-release checklist before changing the repository from private to public.
