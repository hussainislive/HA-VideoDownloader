# Changelog

All notable changes to this project will be documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/hussainislive/HA-VideoDownloader/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/hussainislive/HA-VideoDownloader/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/hussainislive/HA-VideoDownloader/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/hussainislive/HA-VideoDownloader/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/hussainislive/HA-VideoDownloader/releases/tag/v0.1.0
