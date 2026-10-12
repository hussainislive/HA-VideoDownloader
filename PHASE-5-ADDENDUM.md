# PHASE 5 ADDENDUM — Owner decisions of 2026-10-12

> **Read this together with `master-prompt.md` before "Execute Phase 5".** Where this file and `master-prompt.md` conflict, **this file wins** (it is the owner's latest instruction). Everything in master-prompt §9 "PHASE 5" still applies unless changed below. Record every significant choice as a new ADR (continue numbering after ADR-016). ADR-007 ("x64 until native FFmpeg") is **superseded** by section 1.

---

## 1. Native Apple Silicon support (required in v1.0)

The owner will supply a native arm64 FFmpeg. The owner's development machine is an **Intel MacBook Pro (2019, macOS 26.6)**, so arm64 binaries and the arm64 app **cannot be executed here**; they are verified statically here and tested later on a friend's Apple Silicon Mac.

### 1.1 Binary layout (replaces `binaries/macos/`)

```text
binaries/
├── README.md                 (tracked) provenance, versions, SHA-256, how to obtain each file
├── macos-x64/    ffmpeg (x86_64)      yt-dlp (universal2 "yt-dlp_macos", renamed)
├── macos-arm64/  ffmpeg (arm64)       yt-dlp (same universal2 file)
└── win/          ffmpeg.exe           yt-dlp.exe
```

Contents stay git-ignored; `binaries/README.md` stays tracked.

### 1.0 Current state (already done by the owner BEFORE Phase 5 starts)

- The three folders above exist and are filled. The owner ran `lipo -info`: `macos-arm64/ffmpeg` = arm64, `macos-x64/ffmpeg` = x86_64; `chmod +x` and `xattr -dr com.apple.quarantine binaries/` were applied.
- **FFmpeg for both macOS architectures comes from Martin Riedl's static builds** (same provider for both, so versions should match). `yt-dlp` in both macOS folders is the universal "yt-dlp_macos" release binary. Windows binaries are `yt-dlp.exe` and `ffmpeg.exe` (x64).
- **The old `binaries/macos/` folder was deleted.** There is **no legacy fallback**: remove every reference to `binaries/macos/` from code, scripts, tests, `electron-builder.yml`, README, `binaries/README.md` and docs. Do not keep a fallback path.
- **Important:** the Phase 4 code still expects `binaries/macos/`, so until you fix it, `npm run verify:binaries`, the engine status in `npm run dev`, the E2E prehook and the live tests **will fail**. That is expected. Do tasks 1 and 2 of section 1.2 **first**, then run the baseline gates (`npm run check`) and only then continue with the rest of Phase 5.
- Record provenance in `binaries/README.md`: for each file the provider (Martin Riedl for macOS FFmpeg; the official yt-dlp GitHub release for yt-dlp; the Windows FFmpeg source filled in by the owner in the Phase 5 kickoff message), the version, the download date, and its SHA-256 (`shasum -a 256`).

### 1.2 Required work

1. **Resolver:** choose `macos-arm64` or `macos-x64` by `process.arch` (dev and packaged). If the matching folder is missing, report `ENGINE_NOT_FOUND` with a clear message. Keep the existing Rosetta/bad-architecture detection as a safety net (an x64 build running on an M-chip Mac through Rosetta must still work).
2. **`verify:binaries`:** check each folder for presence, executable bit, `lipo -info` architecture, `codesign -dv` signature state, and `--version` **only when the binary can run on the host** (on an Intel host, arm64 binaries get static checks only: print "static check only — cannot execute on this host"). Fail if an arm64 folder contains an x86_64-only ffmpeg or vice-versa. For macOS binaries also run `otool -L` and **fail if any dependency is outside `/usr/lib` or `/System/`** (a build linked against e.g. `/opt/homebrew` libraries would crash on other users' Macs). When a binary cannot execute on the host, read its version and `configure` flags statically (for example `strings <file> | grep -m1 "ffmpeg version"`) and confirm the x64 and arm64 FFmpeg versions match; report any mismatch. Print the ffmpeg `configure` flags (`--enable-gpl`, `--enable-version3`, etc.) for the license notices.
3. **Packaging:** `electron-builder` produces **two separate DMGs**: `HA-Premium-Video-Downloader-<ver>-mac-x64.dmg` and `…-mac-arm64.dmg`. Each bundles only its own arch folder via per-arch `extraResources`. Scripts: `dist:mac:x64`, `dist:mac:arm64`, and `dist:mac` (both). Building the arm64 app on this Intel Mac must work (cross-build). The `afterPack` hook must **ad-hoc sign** both bundled binaries in every build (arm64 binaries will not execute unsigned). After each build, verify inside the produced `.app`: `lipo -info` and `codesign -dv` of the bundled ffmpeg/yt-dlp, executable bits, and the app executable's architecture.
4. **Tests:** unit tests for the resolver covering `arm64`, `x64`, and a missing arch folder (mock `process.arch` and the filesystem); a packaging smoke script that fails the build if the wrong arch binary is inside a package.
5. **Docs:** replace every "x64 only / blocked by FFmpeg" statement (README Install and FAQ, PROGRESS known issues, ARCHITECTURE packaging, TESTING) with the new truth. README Install must explain **how users choose** the DMG: Apple menu → About This Mac → "Chip: Apple M…" means arm64; "Processor: Intel…" means x64. Mention that the x64 DMG also runs on Apple Silicon through Rosetta, but the arm64 DMG is recommended there.
6. **`docs/APPLE-SILICON-TEST-GUIDE.md`:** a step-by-step checklist a friend can follow on an M-chip Mac: install the arm64 DMG (unsigned-app steps), confirm "Engine Ready", run `uname -m`, download one video and one MP3, pause/resume, check Activity Monitor shows the process kind as **Apple** (not Intel), use **Help → Copy diagnostic info** (implement this menu item if it does not exist yet: app version, OS, arch, engine versions/paths, last error codes, redacted) and send the result back.

---

## 2. Windows: aligned now, tested later

The owner will clone the repo onto a Windows laptop **after** all five phases. Phase 5 must not require Windows, but must make that later test smooth and likely to pass.

1. **Cross-platform hygiene audit (do it, fix findings, list them in the report):** path handling uses `node:path` only; no POSIX-only shell calls in app code or **in tests/scripts** (`ps`, `chmod`, `xattr`, `lipo` must be guarded by `process.platform` and tests that need them must be skipped on Windows, with a visible skip reason); no assumptions about `/` separators, home dirs, case-sensitive file systems, or `.part` file locking (Windows locks open files — verify delete/rename behavior in pause/cancel cleanup); `windowsHide: true` on **every** spawn; `taskkill` path verified; long path and unicode path handling; reserved Windows filenames (`CON`, `NUL`, trailing dots/spaces) covered by the filename sanitizer and tests.
2. **Line endings:** add `.gitattributes` (`* text=auto eol=lf`, binary patterns for images/fonts/archives) and set Prettier `endOfLine: "lf"`, so a Windows clone does not produce CRLF lint/format failures or break shell scripts.
3. **Scripts run on Windows:** every npm script and `scripts/*.ts` must work from PowerShell (no `rm -rf`, no `$VAR` env syntax — use `cross-env` or Node). `npm run check` must be runnable on Windows (platform-specific tests skipped, not failing).
4. **Windows packaging config:** NSIS x64 config finalized per master-prompt §13. **Do not cross-build the Windows installer on macOS**; the owner builds it on the Windows laptop with `npm run dist:win`.
5. **`docs/WINDOWS-TEST-GUIDE.md`:** exact steps for a fresh Windows machine: install Git and Node 24, clone, place `binaries\win\yt-dlp.exe` and `ffmpeg.exe`, `npm ci`, `npm run verify:binaries`, `npm run check`, `npm run dev`, `npm run dist:win`, install the produced `.exe`, then a manual checklist (window controls and maximize, Snap layouts, taskbar progress, notifications, **no console window flashes during probe/download/merge/update**, long/unicode paths, SmartScreen and Windows Defender behavior, uninstall leaves downloads intact).

---

## 3. Icon (owner supplies the final file)

Do **not** design or replace the icon. The owner will overwrite `resources/icon.png` (1024×1024 PNG, square, ~10% transparent margin) later.

- Make sure **every** icon use derives from that one file: macOS app/DMG icon and Windows exe/installer/uninstaller/shortcuts via electron-builder; the Windows `BrowserWindow` `icon` option; the macOS dock icon in **development** (`app.dock?.setIcon`); notification icon.
- Add `scripts/verify-icon.ts` (wired into `verify:binaries` or its own script) that checks the file exists, is a PNG, is square, and is ≥ 512×512 (warn below 1024).
- Keep the in-app title-bar logo glyph as a **separate** SVG asset (`src/renderer/src/assets/logo.svg`) so replacing the app icon never breaks the UI.
- Write `docs/ICON.md`: required spec, every place the icon is used, how to replace it, how to regenerate a build.

---

## 4. License: GNU GPL v3 (replaces the MIT placeholder)

1. Replace `LICENSE` with the **official, unmodified GPL-3.0 text** (https://www.gnu.org/licenses/gpl-3.0.txt). Set `"license": "GPL-3.0-or-later"` in `package.json`. (If the owner prefers "v3 only", the SPDX id is `GPL-3.0-only` — default to `or-later` and mention this in the report.)
2. README: swap the license badge and License section; remove every "MIT placeholder" mention (README, PROGRESS owner-verification list, anywhere else). Add the standard short GPL notice in the License section.
3. `THIRD_PARTY_NOTICES.md` (complete it from the **real** dependency license data): yt-dlp (Unlicense), FFmpeg (state the exact version, the provider (Martin Riedl for macOS; the Windows source given by the owner), the exact `configure` flags from `ffmpeg -version`, the GPL/LGPL status, and **where the corresponding FFmpeg source can be obtained** — the provider's source link plus the upstream https://ffmpeg.org/ source), Electron, React and every runtime dependency with SPDX id. Include a short "written offer" paragraph for FFmpeg source. Confirm all runtime dependency licenses are GPLv3-compatible; flag anything that is not.
4. Package the license files: `LICENSE` and `THIRD_PARTY_NOTICES.md` must be inside both installers and reachable from the app (Help menu item "Licenses", and the About footer link/button).
5. **Disclaimer (README, prominent, directly under the hero; also repeated under "Legal notice"):**

   > **Disclaimer.** HA Premium Video Downloader is a local utility intended for personal and educational use. It does not host, store, or distribute any content. You are responsible for making sure you have the right to download any content, and for complying with the terms of the sites you use and with applicable copyright law. The developer accepts no liability for misuse. This project is not affiliated with or endorsed by YouTube, Google, or any other platform, nor by the yt-dlp or FFmpeg projects.

   Update the About screen's one-line legal notice to a short version of the same message ("Local utility for personal and educational use. Download only content you have the right to download.").
6. Do not add per-file license headers (not required). Do add the license name to the repository metadata fields (`package.json`, electron-builder `copyright`).

---

## 5. Releases are manual (no CI in Phase 5)

Skip the optional `.github/workflows/ci.yml` from master-prompt Phase 5 task 8. Instead write **`docs/RELEASING.md`**, the exact manual process: pre-release checklist (`npm run check`, live tests, audit, QA checklist), bump version in `package.json`, update `CHANGELOG.md`, `git tag vX.Y.Z`, build `dist:mac` on the MacBook (x64 + arm64) and `dist:win` on the Windows laptop, compute `SHA256SUMS`, smoke-install each artifact, create a **draft GitHub Release** from the tag, upload the DMGs, the Windows installer and `SHA256SUMS`, paste notes from `docs/RELEASE-NOTES-TEMPLATE.md` (include the unsigned-app instructions per OS and the "which download is for me" table), link the corresponding source tag, publish. Also create `docs/RELEASE-NOTES-1.0.0.md` from the template. Artifact names: `HA-Premium-Video-Downloader-<version>-mac-x64.dmg`, `…-mac-arm64.dmg`, `…-win-x64.exe`.

---

## 6. Open-source preparation (repository stays **private** for now)

Prepare everything so flipping the repo to public later is safe and tidy: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1), `SECURITY.md` (private vulnerability reporting via the owner's email), `.github/ISSUE_TEMPLATE/` (bug report asking for the "Copy diagnostic info" output, feature request), `.github/pull_request_template.md`, and `docs/PUBLIC-RELEASE-CHECKLIST.md` (scan the **entire git history** for secrets with a scanner such as gitleaks and list the exact command; confirm no personal data or private paths; review `design/` contents; set repo description, topics, and license in GitHub; enable private vulnerability reporting; review the README for any claim not yet true). Add a `binaries/README.md` section "Getting binaries for building from source" that is accurate for each platform. Do not guess download URLs: automate (`scripts/fetch-binaries.ts`) only what you can verify, such as the official yt-dlp GitHub release assets with checksum verification, and document the FFmpeg sources manually.

---

## 7. Measuring performance on this machine

Budgets in master-prompt §12.4 assumed Apple Silicon. Measure on the owner's **Intel MacBook Pro 2019 16" (i9, macOS 26.6)**, record the real numbers and the machine in `docs/PERFORMANCE.md` as the **conservative baseline**, and relax startup budgets to ≤ 2.0 s (window shown) / ≤ 3.0 s (interactive) for this machine only. Do not treat Intel-baseline misses as failures unless they indicate a real regression; explain them.

---

## 8. Report additions

The Phase 5 report must also list: which checks are **static only** because the host is Intel (arm64 app) or macOS (Windows), the exact files the owner must still verify on Apple Silicon and Windows, and a table of all produced artifacts with sizes and SHA-256.

