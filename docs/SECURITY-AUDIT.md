# Phase 5 security audit

Audited on 2026-10-12 against the production build and every main-process IPC
handler.

## Electron boundary

- `BrowserWindow` enables `contextIsolation`, `sandbox`, and `webSecurity`; it
  disables `nodeIntegration` and insecure mixed content.
- The sandboxed CommonJS preload exposes named methods only. The renderer has no
  Node imports and receives neither `ipcRenderer` nor a generic invoke escape.
- Every request, including empty requests, is zod-validated in the main process
  and returns a typed `Result`; raw engine stderr never reaches renderer copy.
- New windows and renderer navigation are denied. External URLs must be HTTPS
  on the exact GitHub/LinkedIn/PayPal allowlist, or the one exact developer
  `mailto:` address; credentials and unapproved GitHub paths are rejected.
- Packaged startup always loads the local renderer file and ignores an injected
  `ELECTRON_RENDERER_URL`; only unpackaged development may load the Vite URL.
- Production CSP permits self-hosted scripts/styles/fonts, data/self/HTTPS
  images, and no network connections. `script-src 'self'` contains no
  `unsafe-inline` or `unsafe-eval`; object, base, and frame embedding are denied.
  HTTPS images are needed only for a thumbnail returned by a user-requested
  probe. Fonts, application CSS, JavaScript, portrait, and icon are local.

## Processes, files, and privacy

- Native tools use `spawn` with argument arrays, `shell: false`, and
  `windowsHide: true`; URLs follow `--`. Cancel/pause terminates the process
  tree, and cleanup is limited to the current job's sanitized filename stem.
- The Windows process path resolves `%SystemRoot%\System32\taskkill.exe`.
  Reserved device names and trailing dots/spaces are sanitized; locked partials
  receive bounded `EBUSY`/`EPERM` retries.
- Settings, queue, and history are schema-validated, atomically written, and
  quarantine corrupt documents. The renderer cannot choose arbitrary shell
  commands or read arbitrary files.
- Logs stay local, rotate at 2 MB, and recursively replace full URLs and the
  user's home path, including nested `Error` values. Diagnostic copy contains
  versions, OS/arch, redacted engine paths, readiness, and at most ten unique
  error codes—never URLs, stderr, settings, or media contents.
- There is no telemetry, background update check, cookie import, credential
  store, remote code, or analytics endpoint.

## Supply chain

- Exact versions are locked. `npm audit --omit=dev --audit-level=high` reports
  zero vulnerabilities.
- The full `npm audit --audit-level=high` reports zero high/critical findings.
  Eight moderate development-only findings are in electron-builder's
  `global-agent → roarr → sprintf-js` chain. npm's forced fix would downgrade
  electron-builder and is not applied; this chain is not shipped in the app.
- Runtime licenses are inventoried in `THIRD_PARTY_NOTICES.md`; package outputs
  include that file and the official GPLv3 text.

## Release conclusion

No high/critical dependency finding or open application-boundary defect was
found. Physical Apple Silicon and Windows security behavior—Gatekeeper,
SmartScreen/Defender, and absence of console-window flashes—remains explicitly
assigned to the platform guides.
