# Testing

Use Node.js 24 LTS (`nvm use` reads `.nvmrc`) and install exact dependencies with `npm install` or `npm ci`.

## Required gate

```sh
npm run check
```

This is the definition-of-done gate. It runs strict TypeScript checks, ESLint with zero warnings, Prettier verification, Vitest, a production build, and Playwright Electron E2E. The E2E prehook also verifies all supplied binaries.

## Focused commands

| Command                   | Purpose                                                                      |
| ------------------------- | ---------------------------------------------------------------------------- |
| `npm run typecheck`       | Check node/preload and renderer TypeScript projects                          |
| `npm run lint`            | Enforce correctness, a11y, imports, hooks, and component color rules         |
| `npm run format:check`    | Verify repository formatting                                                 |
| `npm test`                | Run unit and component tests once                                            |
| `npm run test:watch`      | Run Vitest in watch mode                                                     |
| `npm run test:coverage`   | Generate V8 coverage                                                         |
| `npm run test:e2e`        | Verify binaries, build, and run non-live Electron tests                      |
| `npm run test:e2e:live`   | Run opt-in tests tagged `@live`                                              |
| `npm run verify:binaries` | Check presence, versions, architecture, permissions, and macOS signing state |

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
- queued, starting, downloading, processing, paused, completed, failed, and canceled cards;
- completed file actions and normalized-store object identity;
- a React Profiler assertion showing one changed job re-renders its subscriber while an untouched job renders zero times.

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
- live queue badge counts, pause/resume/cancel confirmation, failure/retry, and audio extraction;
- stale-probe cancellation and a ready engine status when launching the production bundle;
- zero serious/critical axe findings on Downloader and Queue;
- reviewed snapshots at 850×600 and 1280×800 with no content scrolling;
- at least 55 requestAnimationFrame callbacks in one second while three jobs actively progress.

axe uses its documented legacy aggregation mode because Playwright's default blank-page aggregator cannot create a second target through Electron automation. The application has no frames, so cross-origin frame coverage is not lost.

The visual assertion waits for the BrowserWindow fade, the lazy screen, and local fonts before Playwright compares two stable frames with animations disabled. This prevents startup paint timing from creating a black or partially shifted baseline.

## Determinism and isolation

Each Electron test receives a temporary `userData` directory and removes it after shutdown. The launcher strips the ambient `ELECTRON_RUN_AS_NODE` variable before starting Electron. Failed startup waits close the app and delete their temporary profile, preventing orphan windows.

No production UI contains fake job, history, engine, storage, or throughput data. The fake engine selected through `HA_TEST_ENGINE_SCRIPT` makes automated download flows deterministic without reaching the network and is available only to unpackaged test builds.

The fake engine lives at `tests/fixtures/fake-engine/index.mjs`. Its magic URL
paths include `/ok`, `/slow`, `/crash`, `/stall`, `/merge-fail`,
`/disk-full`, `/fail-403`, `/private`, `/geo`, `/audio`, and `/vertical`.
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

## Verified yt-dlp flags

Phase 2 checked the bundled yt-dlp 2026.08.19 help and exercised the complete
argument set. All specified flags are accepted. Current help documents color
control as `--color no_color`; the specification's hidden `--no-colors` alias
was separately executed with `--version` and remains accepted. `--print
after_move:HAFILE|%(filepath)s` with `--no-simulate` emitted the final path in
both deterministic and live downloads.

## Packaging smoke

Phase 1 packaging verification is:

```sh
npm run dist:mac
```

After the build, inspect executable bits and ad-hoc signatures under the app's `Contents/Resources/binaries/macos` directory. Mount the DMG read-only, launch the contained executable with an isolated temporary profile, wait for “Downloader workspace,” close it, and detach the image. Windows packaging and native arm64 macOS packaging require their matching platforms and binaries.

## Updating visual snapshots

Only update snapshots after intentional UI changes and inspect the resulting PNG:

```sh
npm run build
npx playwright test tests/e2e/phase3-visual.spec.ts --update-snapshots
```

The Phase 3 visual test writes reviewed baselines under `tests/e2e/visual/` and current README captures directly into `docs/images/`.
