# Performance baseline

Measured on 2026-10-12 on the owner's 16-inch 2019 Intel MacBook Pro with an
Intel Core i9-9980HK at 2.40 GHz. The host reported macOS 26.7 and `x86_64` at
measurement time. These numbers are a conservative Intel baseline, not an
Apple Silicon prediction.

## Method

`tests/e2e/performance.spec.ts` launches the production renderer through
Playwright Electron with the deterministic engine. Startup uses wall-clock time
from launch request to first window and focused URL input. Resource figures sum
Electron's `app.getAppMetrics()` processes, excluding yt-dlp/FFmpeg. Frame
counts use `requestAnimationFrame` for one second. The Library fixture contains
5,000 persisted items and measures from the input event until one matching row
is mounted.

The earlier Queue React Profiler regression also confirms that a changed job
re-renders its memoized card while an untouched card renders zero times. Bundle
size is the sum of gzip-compressed renderer JavaScript chunks after production
build.

## Results

| Metric                               |                   Measured |                        Target | Result                |
| ------------------------------------ | -------------------------: | ----------------------------: | --------------------- |
| Cold start → window shown            |                 1,590.4 ms | ≤ 2,000 ms on this Intel host | Pass                  |
| Cold start → input interactive       |                 1,812.1 ms | ≤ 3,000 ms on this Intel host | Pass                  |
| Idle CPU                             |                     0.314% |                          < 1% | Pass                  |
| Idle working set                     |                  388.06 MB |                      ≤ 300 MB | Documented Intel miss |
| App CPU with three active downloads  |                     1.336% |             < 15% of one core | Pass                  |
| Active working set                   |                  411.10 MB |             Reported baseline | Informational         |
| Frames with three live progress bars |                     61 fps |                      ≥ 55 fps | Pass                  |
| 5,000-row Library mounted rows       |                         13 |       < 30 regression ceiling | Pass                  |
| 5,000-row Library scrolling          |                     62 fps |                        60 fps | Pass                  |
| 5,000-row search                     |                     5.7 ms |                      < 100 ms | Pass                  |
| Renderer JavaScript                  | 254.1 KiB gzip / 22 chunks |                     ≤ 350 KiB | Pass                  |

The 88.06 MB idle-memory miss is retained visibly. Per the Phase 5 addendum,
an Intel-baseline miss is not a release failure unless it indicates a
regression; the automated test keeps a wider 500 MB ceiling while continuing
to report whether the original 300 MB target is met. Apple Silicon and Windows
must establish separate native baselines during their hardware checklists.

## Retired soak measurement

Before the owner removed the soak test from Phase 5 and all future release
gates, one 30-minute run increased Electron's working set from 407.27 MB to
463.42 MB (13.79%) while completing an unrealistic 931 batches / 2,793 fake
downloads. The result is retained here for transparency, but the test and its
threshold are no longer release requirements and must not be run again.

## Changes made during the audit

- Library search now updates immediately and filters metadata before main-
  process file-status checks.
- Select and confirmation overlays use solid semantic surfaces. No list row
  contains blur, and a screen shows no more than three blurred cards.
- Tabs remain lazy chunks, Queue cards retain per-job selectors and stable
  callbacks, and Library virtualization mounts only the visible rows.
- `npm run build` enforces the 350 KiB renderer-JavaScript gzip budget.
