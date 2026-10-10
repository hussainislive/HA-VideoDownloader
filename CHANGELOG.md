# Changelog

All notable changes to this project will be documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/hussainislive/HA-VideoDownloader/compare/v0.1.0...HEAD
