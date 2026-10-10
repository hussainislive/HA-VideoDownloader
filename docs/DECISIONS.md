# Architecture Decision Record

## ADR-001 — Use `child_process.spawn` instead of execa

**Status:** Accepted · **Date:** 2026-10-09

The download engine will use a small typed `ProcessRunner` around Node's
`child_process.spawn`. This keeps argument arrays, `shell: false`,
`windowsHide: true`, streaming output, timeouts, and process-tree termination
under direct control without bringing an ESM-only process layer into the main
bundle. The wrapper and its process-tree behavior will be implemented and
tested in Phase 2.

## ADR-002 — Keep the Electron window opaque

**Status:** Accepted · **Date:** 2026-10-09

The app uses an opaque OS window with an obsidian background. macOS owns its
corners and shadow; Windows owns resize behavior, while the app draws its
custom controls. Transparent windows were rejected because they undermine
resize, Snap, accessibility, and performance. The visual glass effect is
confined to internal surfaces.

## ADR-003 — Keep engine binaries out of Git

**Status:** Accepted · **Date:** 2026-10-09

yt-dlp and FFmpeg binaries are owner-provided inputs under `binaries/` and are
ignored, while `binaries/README.md` remains tracked. This avoids repository
bloat and accidental redistribution without the matching license material.
Release packaging copies verified binaries as external resources rather than
placing them in asar.

## ADR-004 — Standardize on npm

**Status:** Accepted · **Date:** 2026-10-09

npm is the only package manager for this repository. It has the least-friction
path with electron-builder, is bundled with the required Node 24 toolchain,
and gives the project one exact lockfile. Mixing lockfiles or package managers
is unsupported.

## ADR-005 — Persist app state as validated JSON

**Status:** Accepted · **Date:** 2026-10-09

Settings, queue, and history will use schema-versioned, zod-validated JSON with
atomic writes and corruption quarantine. This avoids native modules across
macOS architectures and Windows in v1. If measured Phase 5 performance shows
JSON is insufficient for the 5,000-item history cap, SQLite is the documented
upgrade path for a later release.

## ADR-006 — Exact pins favor compatibility and maturity

**Status:** Accepted · **Date:** 2026-10-09

Dependencies are exact-pinned after live npm registry and peer-range checks.
Packages published fewer than 14 days ago are avoided when a compatible mature
patch exists. Compatibility takes precedence: electron-vite 5 limits Vite to
major 7, and typescript-eslint 8.70.1 limits TypeScript below 6.1. Electron is
the exception to the age preference: major 44 stays on its newest security
patch. ESLint stays on 9.39.5 because the required JSX accessibility plugin
does not yet accept ESLint 10. Playwright 1.64 is used despite being newer than
the age preference because axe-playwright 4.13 depends on its matching core
types.

## ADR-007 — Package macOS x64 until native FFmpeg is supplied

**Status:** Accepted · **Date:** 2026-10-09

The supplied yt-dlp is universal, but FFmpeg 9.0.2-tessus is x86_64-only.
Phase 1 therefore produces a host-compatible x64 DMG and does not claim a
native Apple Silicon artifact. Adding `binaries/macos-arm64` and
`binaries/macos-x64` is required before arm64 packaging; Phase 5 will validate
both architectures.

## ADR-008 — Use a custom Windows frame

**Status:** Accepted · **Date:** 2026-10-09

Windows uses an opaque frameless BrowserWindow so the specified themed
minimize, maximize/restore, and close controls are consistent with the design.
macOS keeps native traffic lights. Windows 11 Snap Layout behavior varies for
custom frames and is explicitly reserved for physical Windows verification.

## ADR-009 — Treat the UI kit as a development-only route

**Status:** Accepted · **Date:** 2026-10-09

The primitive catalog is toggled by Cmd/Ctrl+Shift+U only in development.
There is no production navigation entry or generic renderer IPC escape hatch.
This keeps state examples and component diagnostics out of normal user flows
while preserving a fast visual regression surface for contributors.

## ADR-010 — Emit the sandboxed preload as CommonJS

**Status:** Accepted · **Date:** 2026-10-10

The package remains ESM, but electron-vite emits the sandboxed preload as
`index.cjs`. Electron's sandboxed preload environment uses a restricted
CommonJS loader; an ESM preload was rejected before `contextBridge` ran and
left the renderer without `window.api`. Keeping only this boundary in CommonJS
preserves the sandbox and a narrow preload API without changing the rest of
the module system.
