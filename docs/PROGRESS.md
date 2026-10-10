# Project Progress

## Phase status

| Phase                                                | Status         |
| ---------------------------------------------------- | -------------- |
| 1 — Foundation, tooling, design system, window shell | ✅ Complete    |
| 2 — Engine, queue, persistence                       | ✅ Complete    |
| 3 — Downloader and Queue UI                          | 🟨 In progress |
| 4 — Library, Settings, About                         | ⬜ Not started |
| 5 — Hardening and release                            | ⬜ Not started |

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

- 2026-10-09: Phase 1 started on `phase-1-foundation`; baseline typecheck could not run because the repository had no `package.json` yet.
- 2026-10-10: Completed the secure shell, design system, strict tooling, 27 unit/component tests, six Electron E2E tests, documentation, development smoke, x64 packaging, and read-only DMG launch smoke.
- 2026-10-10: Fixed a sandboxed-preload module mismatch and added a regression test for the rapid-close startup fade that had produced repeated main-process error dialogs.
- 2026-10-10: Implemented Phase 2 binary management, ProcessRunner, yt-dlp adapters, persistent queue/history/settings, updater, complete IPC, deterministic fake engine, and dev console harness on `phase-2-engine`.
- 2026-10-10: Captured sanitized real yt-dlp fixtures and passed four macOS live tests: vertical probe, 480p video+audio with duration verification, MP3 extraction, and process-tree kill plus byte-identical resume.
- 2026-10-10: Completed Phase 2 with 72 green unit/integration tests, eight green Electron E2E tests, a green `npm run check`, and a clean development launch smoke after removing the host-only `ELECTRON_RUN_AS_NODE` variable.
- 2026-10-10: Started Phase 3 on `phase-3-downloader-queue`; baseline strict typechecking is green and the Downloader/Queue references are under audit.

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

- [ ] Render and audit the Downloader and Queue design references at 850×600.
- [ ] Build renderer stores and lifecycle-safe IPC hooks with per-job subscriptions.
- [ ] Implement the functional Downloader flow, real option availability, folder selection, and user feedback.
- [ ] Implement every Queue job state, controls, recovery prompt, ordering, and live badge.
- [ ] Add focused component tests and deterministic Electron golden-path, failure, audio, pause/resume/cancel, accessibility, responsive, and visual tests.
- [ ] Complete the fidelity and render-performance passes at required viewport sizes.
- [ ] Refresh screenshots and Phase 3 documentation.
- [ ] Pass `npm run check`, one live end-to-end smoke, and the development golden-path smoke.
- [ ] Create the local Conventional Commit and `v0.3.0` tag after the final repository audit.

## Known issues

- Native Apple Silicon packaging is blocked by the owner-supplied x86_64-only FFmpeg. The current x64 app can use Rosetta on Apple Silicon.
- Phase 2 intentionally leaves the title-bar engine pill as setup pending; Phase 4 will bind the already-real `engine.getStatus` IPC result to that UI.
- `npm audit` reports eight moderate transitive findings and zero high/critical findings; the formal zero high/critical release gate is Phase 5.

## Owner verification

- Windows 10/11 behavior and packaging will require owner or CI verification.
- Intel macOS behavior requires Intel hardware or owner verification.
- Confirm the MIT placeholder license, final app icon, and intended GitHub repository visibility before public release.
