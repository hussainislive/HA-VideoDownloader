# Changelog

All notable changes to this project will be documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Add source-gated 8K (4320p) video selection, settings persistence, size estimation, validated IPC, and deterministic download coverage.

### Fixed

- Keep the Downloader size estimate and metadata checkbox inside the options card with consistent bottom padding.

## [1.0.1] - 2026-10-13

### Changed

- Package yt-dlp's checksum-verified unpackaged macOS runtime for fast repeat launches and keep the original architecture-specific binary as a fallback.
- Reuse fresh preview metadata for the first download attempt while keeping time-limited media URLs private to the main process.
- Show **Preparing source…** until real transfer progress starts and emit the first progress snapshot immediately.
- Keep the user's original link through enqueue, even when a site reports a different canonical URL.

### Fixed

- Remove the repeated 26–28-second one-file yt-dlp startup cost from normal macOS preview and download actions after first-run preparation.
- Retry the ordinary source URL when cached media information has expired or is rejected.

### Verified

- Real Electron Playwright preview and download flows for the owner's Facebook reel, Instagram reel, and YouTube video; deterministic cache, fallback, and Queue-state regressions.

## [1.0.0] - 2026-10-12

### Added

- Native Intel and Apple Silicon macOS engine resolution, architecture-specific DMGs, static arm64 validation, package smoke checks, and complete binary provenance.
- One verified app-icon source for packages, windows, development Dock display, and notifications.
- Redacted Help diagnostics, local-log access, packaged GPL and third-party notices, and an About licenses action.
- Release QA, Apple Silicon, Windows, icon, security, contribution, public-repository, manual-release, and 1.0 release-note documentation.
- Automated renderer bundle budget plus finite Intel-host startup, CPU, memory, 5,000-row Library, and frame-rate measurements.
- Windows-safe taskkill resolution, reserved-filename handling, locked-partial retries, line-ending policy, and guarded platform-only tests/scripts.

### Changed

- License the application under GPL-3.0-or-later and inventory every locked runtime dependency and bundled engine with corresponding-source details.
- Search 5,000 Library items immediately without an artificial debounce, and filter before checking file status for main-process searches.
- Use solid Select and confirmation overlays so no screen exceeds three simultaneous blurred surfaces.
- Redact full URLs, home paths, nested errors, and circular objects from local logs.

### Fixed

- Resolve packaged engines from `Contents/Resources/binaries` so a mounted DMG can prepare yt-dlp and report Engine Ready instead of treating both bundled tools as unavailable.
- Resolve `taskkill.exe` through the Windows system directory and hide every spawned child process.
- Preserve Unicode code points while truncating filenames, reject Windows device names, and trim trailing dots/spaces.
- Align the HTML and response CSPs while continuing to block inline script, Node access, navigation, and unapproved external URLs.
- Ignore injected development-server URLs in packaged builds so production always loads the local renderer.

## [0.4.0] - 2026-10-11

### Added

- Real Library search, filtering, sorting, totals, missing-file detection, safe history/file deletion, and fixed-row virtualization beyond 50 entries.
- Functional Settings for download location, engine diagnostics/update feedback, defaults, live concurrency, clipboard behavior, notifications, and window priority with schema-v2 persistence.
- Complete About screen using the local developer portrait, fallback avatar, copy-email feedback, allowlisted GitHub/LinkedIn/PayPal actions, real application version, and legal notice.
- Native completion/failure notifications that focus Queue, macOS dock badges, taskbar progress, active-download close confirmation, relaunch recovery, single-instance focus, global link drop, and shortcut routing.
- Phase 4 corruption, missing-folder, offline, Unicode, 500-row performance, relaunch, notification, accessibility, and three-size visual regression coverage.

### Fixed

- Make download-manager shutdown idempotent and guard window close while work is active, preventing repeated close events from acting on destroyed Electron objects.
- Keep every nested card within its responsive grid track and cap dense workspaces on tall displays, eliminating Settings overflow and oversized About/Settings surfaces.
- Launch Electron tests from the application root so `app.getVersion()` reports the package version instead of Electron's runtime version.

## [0.3.0] - 2026-10-11

### Added

- Responsive Downloader with debounced/cancelable probing, clipboard and drag/drop input, real media preview, available quality choices, live size estimates, audio extraction options, folder/free-space display, low-disk warning, shortcuts, and actionable toasts.
- Live Queue with every job state, stable per-job subscriptions, accurate progress/speed/ETA and completed size, pause/resume/cancel/retry controls, recovery prompt, failure guidance, file actions, clear-completed behavior, and a live tab badge.
- Renderer mirrors for engine, settings, downloads, and navigation with lifecycle-safe IPC subscriptions and lazy screen chunks.
- Phase 3 component, integration, Electron flow, accessibility, visual, render-isolation, frame-rate, and real UI download coverage.
- Playwright-generated Downloader and Queue screenshots at the minimum and expanded window sizes.

### Fixed

- Resolve development engine resources correctly when Electron launches the production bundle from `out/main`, so bundled FFmpeg is found and the status pill reports the real ready state.
- Allow slow-starting signed yt-dlp binaries enough time to report versions and probe media, while reusing the resolved version to avoid a duplicate startup check.
- Preserve actual completed file sizes in queue snapshots and exclude paused work from aggregate speed.
- Cancel obsolete metadata probes and guard all delayed renderer events during rapid window shutdown.

## [0.2.0] - 2026-10-10

### Added

- Writable user-data yt-dlp installation, bundled FFmpeg resolution, version/status probes, explicit test overrides, and guarded on-demand engine updates.
- Spawn-only process runner with streaming UTF-8 line parsing, hard timeouts, process-group/taskkill tree termination, and mandatory hidden Windows processes.
- Real metadata probing, quality and size logic for landscape and vertical media, exact download arguments, progress aggregation, phase detection, and friendly error taxonomy.
- Persistent concurrent download manager with pause/resume, scoped cancel cleanup, retry, stall recovery, MP4-to-MKV fallback, relaunch recovery, history, notifications, and OS activity hooks.
- Schema-versioned atomic JSON stores with migrations, corruption quarantine, directory writability/free-space services, and a 5,000-item history cap.
- Complete typed IPC for engine, media, downloads, library, settings, dialogs, file actions, and clipboard URL extraction, with updates batched to 5 Hz.
- Deterministic fake engine, real sanitized yt-dlp fixtures, unit/integration coverage, recovery E2E, and four macOS live binary tests.

### Fixed

- Guard all main-to-renderer event delivery against destroyed windows so delayed engine updates cannot recreate the rapid-close main-process dialog.

## [0.1.0] - 2026-10-10

### Added

- Exact-pinned Electron, React, TypeScript, Tailwind, testing, and packaging toolchain.
- Secure main/preload/renderer boundary with validated IPC, strict navigation policy, CSP, local redacted logging, and single-instance behavior.
- Opaque native window shell with platform-specific chrome, persistent validated bounds, native menus, and lifecycle-safe opening fade.
- Semantic design tokens, bundled fonts, accessible shared primitives, reduced-motion behavior, and development-only UI kit.
- Five lazy Phase 1 workspaces with responsive shell navigation and truthful engine state.
- Binary audit and verifier, macOS ad-hoc signing hook, x64 app bundle, and unsigned DMG configuration.
- Unit, component, Electron E2E, axe, responsive, native-window, and visual regression coverage.
- Architecture, dependency, testing, design-audit, decision, progress, licensing, and contributor-facing documentation foundations.

### Fixed

- Emit the sandboxed preload as CommonJS so Electron can load the context bridge.
- Cancel and guard the window fade timer when a rapidly closed BrowserWindow is destroyed, preventing repeated main-process error dialogs.
- Capture Electron visual baselines through the native web contents so macOS automation records rendered pixels instead of a black surface.

[Unreleased]: https://github.com/hussainislive/HA-VideoDownloader/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/hussainislive/HA-VideoDownloader/compare/v0.4.0...v1.0.0
[0.4.0]: https://github.com/hussainislive/HA-VideoDownloader/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/hussainislive/HA-VideoDownloader/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/hussainislive/HA-VideoDownloader/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/hussainislive/HA-VideoDownloader/releases/tag/v0.1.0
