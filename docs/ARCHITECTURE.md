# Architecture

This document describes the Phase 4 application boundary. The main process owns the real engine, persisted data, filesystem checks, and native integration; all five responsive screens consume only the narrow validated preload API.

## Process model

```mermaid
flowchart LR
  OS[macOS / Windows] --> Main[Electron main]
  Main --> Window[BrowserWindow]
  Window --> Preload[Sandboxed preload]
  Preload --> API[window.api]
  API --> Renderer[React renderer]
  Renderer --> Mirrors[Normalized Zustand mirrors]
  Mirrors --> Screens[Downloader / Queue / Library / Settings / About]
  Main --> Logs[Local rotating logs]
  Main --> State[Validated window-state JSON]
  Main --> Manager[Download manager]
  Manager --> Engine[yt-dlp / FFmpeg]
  Manager --> Stores[Atomic JSON stores]
```

The main process owns operating-system capabilities, application state, navigation policy, external links, and window lifecycle. The renderer has no Node.js access. Its only privileged surface is the typed API exposed by the context-isolated preload.

## Security boundary

- `contextIsolation`, Chromium sandboxing, and web security are enabled.
- Node integration and insecure mixed content are disabled.
- The preload exposes explicit methods rather than raw `ipcRenderer`.
- Every IPC payload is parsed with zod, including methods with no payload.
- Handlers return `Result<T, AppError>` and keep technical details out of UI copy.
- Navigation and new-window creation are blocked. Approved external destinations pass through a main-process allowlist.
- Production responses receive a strict CSP; the development policy adds only the local Vite/HMR connections.
- Logs stay local and redact query strings from URLs.

## Module map

```text
src/main/index.ts                 application lifecycle and single-instance lock
src/main/window/                  BrowserWindow creation, close guard, fade, persisted bounds
src/main/security/                CSP, navigation guards, external URL policy
src/main/ipc/                     validated system, engine, queue, and service handlers
src/main/engine/                  binary install/update, ProcessRunner, yt-dlp adapters
src/main/downloads/               pure state machine and concurrent manager
src/main/services/                JSON stores, disk, files, clipboard, notifications, OS activity
src/main/menu.ts                  native application menus
src/main/logger.ts                redacted local logging

src/preload/index.ts              narrow contextBridge implementation
src/preload/index.d.ts            renderer global API declaration

src/renderer/src/components/ui/   reusable accessible primitives
src/renderer/src/components/shell title bar, tabs, controls, boundaries
src/renderer/src/features/        five lazy screens and feature-scoped components/hooks
src/renderer/src/hooks/           lifecycle-safe application subscriptions
src/renderer/src/store/           normalized downloads, Library, settings, engine, navigation
src/renderer/src/lib/copy.ts       renderer-visible English
src/renderer/src/styles/index.css semantic tokens and global styles

src/shared/ipc/                   channel names, API types, zod schemas
src/shared/types/                 dependency-free result and error types
src/shared/utils/                 pure formatting and URL helpers
```

`shared/` imports nothing from the other processes. The renderer never imports from `main/`, and the preload does not export a generic invoke function.

## Launch sequence

```mermaid
sequenceDiagram
  participant OS
  participant Main
  participant Window
  participant Preload
  participant UI as React UI

  OS->>Main: Start application
  Main->>Main: Acquire single-instance lock
  Main->>Main: Install CSP, menu, and IPC
  Main->>Window: Create hidden opaque window
  Window->>Preload: Load sandboxed CommonJS preload
  Preload->>UI: Expose window.api
  Window->>UI: Load Vite URL or packaged HTML
  UI-->>Window: ready-to-show
  Window->>Window: Show and fade opacity to 1
  Note over Window: Closing cancels the fade timer
```

The sandboxed preload is intentionally emitted as CommonJS (`index.cjs`). Electron executes sandboxed preloads with its restricted CommonJS environment; emitting ESM would leave the bridge unavailable.

## Engine ownership

The main process is the sole owner of yt-dlp, FFmpeg, settings, queue state,
history, filesystem access, notifications, and badges. On first launch it copies
yt-dlp to `userData/engine`, makes it executable, and removes macOS quarantine
best-effort. FFmpeg stays in app resources. Only the writable yt-dlp copy can
self-update; a broken update is replaced by the bundled copy.

`ProcessRunner` always uses argument arrays, `shell: false`, and
`windowsHide: true`. macOS processes start in a dedicated process group so
SIGTERM/SIGKILL reaches FFmpeg descendants. Windows uses hidden
`taskkill /pid … /T /F`. URLs are placed after `--`, and logs redact query
strings.

## IPC contract

| Channel                      | Direction       | Input         | Result                               |
| ---------------------------- | --------------- | ------------- | ------------------------------------ |
| `system:get-version`         | renderer → main | `undefined`   | app version                          |
| `system:get-startup-notices` | renderer → main | `undefined`   | recovered-store/folder notices       |
| `system:open-external`       | renderer → main | `{ url }`     | success or allowlist error           |
| `system:navigate`            | main → renderer | tab event     | notification-driven navigation       |
| `window:minimize`            | renderer → main | `undefined`   | success                              |
| `window:toggle-maximize`     | renderer → main | `undefined`   | maximized state                      |
| `window:is-maximized`        | renderer → main | `undefined`   | maximized state                      |
| `window:close`               | renderer → main | `undefined`   | success before close                 |
| `window:maximize-changed`    | main → renderer | boolean event | unsubscribe function in preload API  |
| `engine:get-status`          | renderer → main | `undefined`   | real binary paths/versions/readiness |
| `media:probe`                | renderer → main | `{ url }`     | normalized media metadata/formats    |
| `media:cancel-probe`         | renderer → main | `undefined`   | cancels the current probe tree       |
| `downloads:*`                | both directions | typed jobs    | snapshot/actions + batched events    |
| `library:*`                  | both directions | typed queries | history/status/delete + change event |
| `settings:*`                 | both directions | typed updates | persisted settings + change events   |
| `dialog:choose-folder`       | renderer → main | `undefined`   | selected path or cancel              |
| `disk:get-free-bytes`        | renderer → main | `{ path }`    | available bytes                      |
| `clipboard:*`                | renderer → main | typed text    | URL read and safe text write         |
| `shell:*`                    | renderer → main | `{ path }`    | play/open-location result            |

Domain methods live under `window.api.engine`, `media`, `downloads`,
`library`, `settings`, `dialog`, `shell`, and `clipboard`. Every request has a
zod schema and every response is `Result<T, AppError>`. The only pushed events
are engine status, batched download snapshots, library changes, settings
changes, and maximize state. `window.__ha` is exposed only by development
preloads and delegates to the same validated API.

## Probe sequence

```mermaid
sequenceDiagram
  participant UI as Downloader
  participant IPC as Validated IPC
  participant Probe as MediaProbeService
  participant Engine as writable yt-dlp
  UI->>UI: debounce 250 ms / cancel stale probe
  UI->>IPC: media.probe(url)
  IPC->>IPC: zod + URL validation
  IPC->>Probe: normalized URL
  Probe->>Probe: session cache lookup
  Probe->>Engine: -J --no-playlist --skip-download -- URL
  Engine-->>Probe: metadata JSON
  Probe->>Probe: lenient zod parse + live rejection
  Probe-->>UI: Result<MediaInfo>
```

## Download and progress sequence

```mermaid
sequenceDiagram
  participant UI as Renderer / dev console
  participant Manager as DownloadManager
  participant Store as queue.json
  participant Engine as yt-dlp + FFmpeg
  UI->>Manager: enqueue(validated job)
  Manager->>Store: debounce atomic snapshot
  Manager->>Engine: spawn argv, URL after --
  Engine-->>Manager: HA progress lines / HAFILE path
  Manager->>Manager: aggregate + transition state
  Manager-->>UI: snapshot at most 5 Hz
  Engine-->>Manager: exit
  Manager->>Store: persist terminal state
  Manager->>Store: append history on success
  Manager-->>UI: completed path + actual file size
```

## Job state machine

```mermaid
stateDiagram-v2
  [*] --> queued
  queued --> starting
  starting --> downloading
  downloading --> processing
  processing --> completed
  starting --> paused
  downloading --> paused
  processing --> paused
  paused --> queued: resume
  queued --> canceled
  starting --> canceled
  downloading --> canceled
  processing --> canceled
  paused --> canceled
  starting --> failed
  downloading --> failed
  processing --> failed
  failed --> queued: retry
```

## Pause and recovery sequence

```mermaid
sequenceDiagram
  participant UI as Renderer / dev console
  participant Manager as DownloadManager
  participant Process as Process group
  participant Store as queue.json
  UI->>Manager: pause(jobId)
  Manager->>Process: SIGTERM group / taskkill tree
  Process-->>Manager: exited; .part retained
  Manager->>Store: state = paused
  Note over Manager,Store: On relaunch, active jobs recover as paused and all recoverable jobs are held
  UI->>Manager: resume(jobId)
  Manager->>Process: spawn same template with --continue
```

## Persistence and recovery

`settings.json`, `queue.json`, and `history.json` are schema-versioned and
zod-validated. Writes use a temporary file, file `fsync`, rename, and directory
`fsync`. Invalid JSON is renamed with a `.corrupt-<timestamp>` suffix and safe
defaults are recreated, with a non-technical startup notice in the renderer.
Settings schema v2 adds `keepWindowOnTop`; v1 files migrate it to `false`.
Queue writes debounce at 500 ms and settings at 300 ms.
An interrupted active job becomes paused at launch; queued and paused recovery
jobs do not start until explicitly resumed. History is newest-first and capped
at 5,000 entries.

History persists only durable media metadata. File existence is transient: the
main process checks paths with `fs.access` in batches of 32 when Library loads or
refreshes. The renderer virtualizes fixed-height rows beyond 50 items and never
writes derived missing-file state back to disk.

## Renderer state and rendering

The shell owns active-tab and visited-tab state. Screens load through
`React.lazy`; once visited they remain mounted and are hidden when inactive so
form and scroll state survive tab changes. One lifecycle hook hydrates the
settings, engine, and download mirrors and unregisters every pushed IPC event
on unmount.

The download mirror stores `orderedIds` separately from `jobsById` and reuses
unchanged job objects. Each memoized card subscribes to its own job, so a 5 Hz
progress sample updates the affected row rather than the entire list. Terminal
jobs sort newest-first after active, queued, and paused work. List rows are
solid and use `content-visibility`; progress animates by transform only.

Downloader keeps transient URL/probe/options state local. It cancels stale
main-process probes, derives quality availability and estimates from the real
media formats, persists changed defaults through settings IPC, and sends a
fully validated enqueue request. The title-bar engine pill is driven by the
same live engine mirror.

Library keeps only query/filter/sort/delete-dialog state locally; its shared
mirror refreshes on focus and history events. Settings writes through validated
IPC and applies concurrency and always-on-top state immediately. About reads
the version from `app.getVersion()` and routes every external action through the
allowlist. A shell-level integration hook handles startup notices and native
notification navigation without importing privileged modules.

## Native lifecycle and activity

The close guard intercepts BrowserWindow close while a job is starting,
downloading, or processing. A native confirmation either returns to the app or
runs one idempotent shutdown that tree-kills active work, preserves `.part`
files, flushes stores, and closes only while the window is still alive. Relaunch
offers interrupted work through the existing recovery prompt.

Completed or failed jobs may create a native notification when the preference
is enabled and the app is not focused. Clicking it shows/focuses the window and
sends a narrow `queue` navigation event. Download snapshots also drive the
macOS dock badge and BrowserWindow progress bar; no renderer polling is needed.
The single-instance handler restores and focuses the existing window.

## Window state

Normal bounds and maximized state are stored as small JSON in Electron's `userData` directory. zod validates the file, off-screen bounds are rejected against connected displays, and writes use a temporary file followed by rename. Corrupt or unavailable state falls back to a centered 850×600 window.

## Packaging

electron-builder places application code in asar and copies owner-provided binaries into `Contents/Resources/binaries/macos`. The Phase 1 hook restores executable permissions and ad-hoc signs both binaries. Because the supplied FFmpeg is x86_64-only, the current macOS artifact is x64; native arm64 packaging waits for a matching FFmpeg input.
