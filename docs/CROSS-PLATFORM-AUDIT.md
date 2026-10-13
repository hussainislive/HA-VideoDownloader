# Cross-platform hygiene audit

Audited on macOS Intel on 2026-10-12. Windows runtime conclusions marked
**static** require the owner's Windows guide.

## Findings fixed

- Native binary resolution now selects `macos-x64`, `macos-arm64`, or `win`
  through `node:path`; there is no legacy path or fallback payload.
- Every app, test-fixture, and packaging spawn has explicit `shell: false` and
  `windowsHide: true`. The sole `ps` assertion is guarded for Darwin, while
  `lipo`, `otool`, `codesign`, `chmod`, and architecture execution are guarded
  in scripts with visible static-only output elsewhere.
- Windows tree termination resolves the system `taskkill.exe` path without a
  shell. Its exact path logic has a regression test.
- Partial deletion retries Windows `EBUSY`/`EPERM` locks before failing instead
  of racing the terminating process.
- Filename sanitization covers `CON`, `PRN`, `AUX`, `NUL`, `COM1…9`,
  `LPT1…9`, trailing dots/spaces, control/forbidden characters, Unicode code
  points, and the 180-code-point title limit.
- Scripts use Node APIs and npm commands rather than POSIX shell pipelines or
  `$VAR` syntax. Platform-only commands are inside guarded TypeScript/JavaScript,
  so `npm run check` is PowerShell-compatible.
- `.gitattributes` pins text to LF and marks image/font/archive formats binary;
  Prettier also enforces LF. Paths are joined with `node:path`, not `/` string
  concatenation, and test paths include spaces/Unicode coverage.

## Packaging alignment

- macOS produces independent x64 and arm64 DMGs containing one matching engine
  folder plus the official universal unpackaged yt-dlp runtime. The Intel host
  executes x64 and statically validates arm64, including the runtime's Python
  executable, architecture, executable permissions, and ad-hoc signatures.
- Windows NSIS is per-user, allows an install-directory choice, creates desktop
  and Start Menu shortcuts, and leaves external download folders outside the
  uninstaller. It is intentionally built and exercised on Windows only.

## Static-only items

- Apple Silicon: execute the app/FFmpeg/unpackaged yt-dlp natively, Activity Monitor Kind,
  Gatekeeper flow, downloads, pause/resume, Dock, notifications.
- Windows 10/11: `npm ci`, all gates, taskkill behavior, no console flashes,
  custom controls/Snap, taskbar/notifications, long Unicode paths, Defender,
  SmartScreen, NSIS install/uninstall.
