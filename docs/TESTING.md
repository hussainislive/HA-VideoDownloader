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

## Phase 1 coverage

Unit tests cover:

- byte, duration, and speed formatting;
- URL normalization and validation helpers;
- class-name composition;
- zod IPC schemas;
- the external-link allowlist;
- startup window-fade cleanup, including the rapid-close regression.

Component tests cover Button state, Switch behavior, Select keyboard selection, and SegmentedControl roles and interaction.

Electron E2E covers:

- a clean launch with no renderer console errors;
- `data-platform`, all five tabs, pointer navigation, and `Cmd/Ctrl+1…5`;
- the enforced 850×600 floor;
- layout at 1024×700, 1280×800, and maximized size without horizontal overflow;
- minimize, maximize, restore, and close over the narrow preload API;
- zero serious or critical axe violations on every tab;
- a settled Electron visual snapshot at 850×600.

axe uses its documented legacy aggregation mode because Playwright's default blank-page aggregator cannot create a second target through Electron automation. The application has no frames, so cross-origin frame coverage is not lost.

The visual assertion waits for the BrowserWindow fade, the lazy screen, and local fonts before Playwright compares two stable frames with animations disabled. This prevents startup paint timing from creating a black or partially shifted baseline.

## Determinism and isolation

Each Electron test receives a temporary `userData` directory and removes it after shutdown. The launcher strips the ambient `ELECTRON_RUN_AS_NODE` variable before starting Electron. Failed startup waits close the app and delete their temporary profile, preventing orphan windows.

No Phase 1 UI contains fake job, history, engine, storage, or throughput data. The Phase 2 fake engine selected through `HA_TEST_ENGINE_SCRIPT` will make download flows deterministic without reaching the network.

## Live tests

There are no `@live` cases in Phase 1, so the live gate is not applicable. Phase 2 will add opt-in probes against documented, freely licensed URLs. Live tests must never run as part of `npm run check`.

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
npx playwright test --grep "shell baseline" --update-snapshots
```

Commit the reviewed file under `tests/e2e/visual/` and copy the current hero image to `docs/images/` when README visuals change.
