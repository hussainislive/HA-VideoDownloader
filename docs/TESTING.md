# Testing

Use Node.js 24 LTS (`nvm use` reads `.nvmrc`) and install exact dependencies with `npm install` or `npm ci`.

## Required gate

```sh
npm run check
```

This is the definition-of-done gate. It runs strict TypeScript checks, ESLint with zero warnings, Prettier verification, Vitest, a production build, and Playwright Electron E2E. The E2E prehook also verifies all supplied binaries.

## Focused commands

| Command                        | Purpose                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `npm run typecheck`            | Check node/preload and renderer TypeScript projects                          |
| `npm run lint`                 | Enforce correctness, a11y, imports, hooks, and component color rules         |
| `npm run format:check`         | Verify repository formatting                                                 |
| `npm test`                     | Run unit and component tests once                                            |
| `npm run test:watch`           | Run Vitest in watch mode                                                     |
| `npm run test:coverage`        | Generate V8 coverage                                                         |
| `npm run test:e2e`             | Verify binaries, build, and run non-live Electron tests                      |
| `npm run test:e2e:live`        | Run opt-in tests tagged `@live`, including real-site latency                 |
| `npm run test:e2e:performance` | Measure startup, resources, and the 5,000-row Library                        |
| `npm run verify:binaries`      | Check presence, versions, architecture, permissions, and macOS signing state |
| `npm run verify:bundle`        | Enforce the 350 KiB gzip renderer-JavaScript budget after a build            |

## Unit and integration coverage

Unit tests cover:

- byte, duration, and speed formatting;
- URL normalization and validation helpers;
- class-name composition;
- zod IPC schemas;
- the external-link allowlist;
- startup window-fade cleanup, including the rapid-close regression.

Component tests cover Button state, Switch behavior, Select keyboard selection, and SegmentedControl roles and interaction.

Phase 3 component and renderer-store tests additionally cover:

- idle, probing, ready, and error URL-card states plus the keep-link shortcut;
- source-gated 8K availability, selection, size estimation, IPC validation, and generic-selector fallback;
- queued, starting, downloading, processing, paused, completed, failed, and canceled cards;
- completed file actions and normalized-store object identity;
- a React Profiler assertion showing one changed job re-renders its subscriber while an untouched job renders zero times.

Phase 4 unit and integration tests additionally cover:

- Library search across title, uploader, and platform plus all sort/filter modes and Unicode-safe matching;
- settings schema-v1 migration, corrupt-settings quarantine/default restoration, and persisted keep-on-top state;
- batched missing-file status, history-only deletion, optional file deletion, close-guard active-state counting, and the download-manager shutdown path.

Phase 5 unit and integration tests additionally cover architecture-specific
binary resolution, missing native inputs, Windows system `taskkill` resolution,
reserved/trailing/Unicode filenames, redacted diagnostics, recursive log
redaction, and the one-source icon/package verifiers.

The 1.0.1 latency fix adds writable macOS-runtime reuse, private probe-cache
expiry and cleanup, stale-source fallback, immediate first progress, and
canonical-URL reuse regressions. The deterministic Electron test confirms the
Queue says **Preparing source…** until genuine progress arrives.

Phase 2 unit and integration tests additionally cover:

- streaming UTF-8/CRLF splitting, huge output, exit codes, and process-tree killing including a grandchild;
- lenient probes, quality tiers, vertical shorter-side mapping, size estimates, exact argument arrays, progress aggregation, phases, and captured error mapping;
- legal/illegal job transitions, restart recovery, atomic stores, migrations, corruption quarantine, safe filenames, and scoped partial cleanup;
- successful engine updates, invalid-update rollback, failed-update repair, and raw-stderr isolation;
- fake-engine success, pause/resume, idempotent cancel, manual retry accounting, crash, one stall retry, disk full, MP4→MKV fallback, and 50 queued jobs with a measured concurrency ceiling of two.

Electron E2E covers:

- a clean launch with no renderer console errors;
- `data-platform`, all five tabs, pointer navigation, and `Cmd/Ctrl+1…5`;
- the enforced 850×600 floor;
- layout at 1024×700, 1280×800, and maximized size without horizontal overflow;
- minimize, maximize, restore, and close over the narrow preload API;
- zero serious or critical axe violations on every tab;
- a settled Electron visual snapshot at 850×600.

Phase 3 Electron E2E additionally covers:

- paste → probe → 1080p/MP4 → enqueue → progress → completion toast → spied open-folder action;
- an 8K probe → enabled 4320p selection → explicit 8K format download, while ordinary probes keep 8K disabled;
- live queue badge counts, pause/resume/cancel confirmation, failure/retry, and audio extraction;
- stale-probe cancellation and a ready engine status when launching the production bundle;
- zero serious/critical axe findings on Downloader and Queue;
- reviewed snapshots at 850×600, 1280×800, and 1920×1080 with no content scrolling;
- at least 55 requestAnimationFrame callbacks in one second while three jobs actively progress.

Phase 4 Electron E2E additionally covers:

- Library search/filter, missing-file state, Play/Open disabling, history-only deletion, and deletion with the media file;
- instant settings, live always-on-top behavior, defaults feeding Downloader, engine-update feedback, and settings/window-state persistence across a real relaunch;
- the local About photo, email copy toast, approved external destinations, and rejection of a non-allowlisted host;
- active-download close confirmation, paused-job relaunch recovery, native notification click-to-Queue, single-instance restore/focus, global link drop, and shortcut focus;
- corrupt history quarantine, offline probing, a missing output folder before enqueue, and folder removal during a live fake download;
- long Arabic/Latin/emoji titles and a 500-row Library with fewer than 25 mounted rows and at least 55 animation frames during a one-second scroll;
- axe checks on populated Library, Settings, and About states plus the existing all-five-screen shell pass;
- reviewed visual baselines for every screen at 850×600, 1280×800, and 1920×1080, with explicit root and main-content horizontal-overflow assertions.

The current gate passes 116 Vitest tests across 30 files and 37 deterministic
Electron E2E tests. All six opt-in live tests and all three finite performance
tests passed separately during the 1.0.1 release verification.

axe uses its documented legacy aggregation mode because Playwright's default blank-page aggregator cannot create a second target through Electron automation. The application has no frames, so cross-origin frame coverage is not lost.

The visual assertion waits for the BrowserWindow fade, the lazy screen, and local fonts before Playwright compares two stable frames with animations disabled. This prevents startup paint timing from creating a black or partially shifted baseline.

## Determinism and isolation

Each Electron test receives a temporary `userData` directory and removes it after shutdown. The launcher strips the ambient `ELECTRON_RUN_AS_NODE` variable before starting Electron. Failed startup waits close the app and delete their temporary profile, preventing orphan windows.

No production UI contains fake job, history, engine, storage, or throughput data. The fake engine selected through `HA_TEST_ENGINE_SCRIPT` makes automated download flows deterministic without reaching the network and is available only to unpackaged test builds.

The fake engine lives at `tests/fixtures/fake-engine/index.mjs`. Its magic URL
paths include `/ok`, `/slow`, `/crash`, `/stall`, `/merge-fail`,
`/disk-full`, `/fail-403`, `/private`, `/geo`, `/audio`, `/vertical`, and `/8k`.
It emits real `HA|…` progress lines and `HAFILE|…`, writes real output/partial
files, and handles SIGTERM. `HA_TEST_ENGINE_SCRIPT`, `HA_YTDLP_PATH`, and
`HA_FFMPEG_PATH` are honored only by unpackaged builds.

## Live tests

Live tests never run as part of `npm run check`. On macOS, run
`npm run test:e2e:live`; it uses the owner-supplied binaries and therefore
requires network access and permission to execute native tools.

Phase 2 fixtures and live tests use these public, freely licensed sources:

- landscape metadata: `https://commons.wikimedia.org/wiki/File:Portraits-HD.webm` (CC BY-SA 3.0);
- vertical metadata: `https://commons.wikimedia.org/wiki/File:WP25Post1.webm` (CC BY-SA 4.0);
- audio-only metadata/MP3: `https://commons.wikimedia.org/wiki/File:Example_sound_file_in_Ogg_Vorbis_format.ogg` (CC0);
- 480p video+audio and resume: `https://commons.wikimedia.org/wiki/File:Test-webM.webm` (CC BY-SA 4.0).

The captured JSON keeps only stable media/format fields; cookies, request
headers, direct media URLs, and diagnostics URLs are removed. Failure fixtures
cover an unavailable YouTube test ID, `https://example.com/` as unsupported,
and a Wikimedia probe forced through an unreachable loopback proxy. Refresh
them deliberately with `node_modules/.bin/tsx scripts/capture-ytdlp-fixtures.ts`.

The live suite probes the vertical clip, downloads the 480p video, verifies
both video and audio streams plus duration within one second using `ffmpeg -i`,
extracts MP3, interrupts a rate-limited real download, checks `ps` after the
tree kill, resumes the `.part`, and compares its final byte size with the clean
download. Phase 3 also launches the real Electron UI, probes the short
Creative Commons video, downloads it through Downloader and Queue, and verifies
the completed file exists with non-zero bytes.

The 1.0.1 live Playwright case runs the same Electron UI against the owner's
Facebook reel, Instagram reel, and YouTube video. It measures preview and
download-to-completion separately, verifies preview reuse and non-empty output,
and checks YouTube MP3 output. These URLs are live third-party services, so
results are observations, not a universal two-second service-level promise.
This opt-in test is **not** part of `npm run check`; it performs real downloads
into an isolated temporary profile. The retired 30-minute soak is not run.

## Verified yt-dlp flags

Phase 2 checked the bundled yt-dlp 2026.08.19 help and exercised the complete
argument set. All specified flags are accepted. Current help documents color
control as `--color no_color`; the specification's hidden `--no-colors` alias
was separately executed with `--version` and remains accepted. `--print
after_move:HAFILE|%(filepath)s` with `--no-simulate` emitted the final path in
both deterministic and live downloads.

## Performance

`npm run test:e2e:performance` records JSON under `test-results/` and runs the
finite startup, resource, live-progress, and 5,000-row checks. Measured release
results and documented Intel deviations live in `docs/PERFORMANCE.md`.

## Packaging smoke

Release packaging verification is:

```sh
npm run dist:mac
```

After each build, the package verifier inspects executable bits, architecture,
ad-hoc signatures, bundled licenses, and the icon under the app's
target-specific `Contents/Resources/binaries/macos-x64` or `macos-arm64`
directory, plus the unpackaged runtime and Python executable under
`Contents/Resources/mac-runtime/macos-<arch>`. `npm run smoke:package:mac:x64` mounts the x64 DMG read-only with an
isolated temporary profile, launches it, waits for the real Engine Ready state,
verifies the current package version on About, closes it, and detaches the image. This caught and now
regression-tests an incorrect packaged binary root that a static inspection
could not reveal. The arm64 application and engine receive static checks on the
Intel host and must be executed later on Apple Silicon. Windows packaging and
runtime behavior are verified on Windows.

For an opt-in real download from the mounted Intel DMG, run
`npm run smoke:package:mac:x64 -- --live-facebook`. It uses an isolated
temporary download folder and verifies the completed file is non-empty. This
passed for v1.0.1. Neither package command runs the retired soak.

## Updating visual snapshots

Only update snapshots after intentional UI changes and inspect the resulting PNG:

```sh
npm run build
npx playwright test tests/e2e/phase3-visual.spec.ts --update-snapshots
npx playwright test tests/e2e/phase4-visual.spec.ts --update-snapshots
```

The Phase 3 and Phase 4 visual tests write reviewed baselines under `tests/e2e/visual/` and current 1280×800 README captures directly into `docs/images/`.
