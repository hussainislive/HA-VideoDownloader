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

## 1.0.1 engine-latency correction

The supplied standalone macOS yt-dlp took 26.47 seconds for a simple
`--version` call on this Intel Mac and 28.42 seconds when repeated. This was a
per-process startup cost, not a large-video transfer cost. The pinned official
unpackaged runtime took 0.42 seconds for `--version` after one initial macOS
security scan. The first use of a new runtime copy can still take longer.

After preserving the pasted URL through enqueue and reusing the fresh preview
JSON for the first download attempt, the real Electron UI and the owner's three
URLs measured:

| Site      | Preview ready | Enqueue → completed file | Output check            |
| --------- | ------------: | -----------------------: | ----------------------- |
| Facebook  |        2.84 s |                   2.07 s | Non-empty MP4           |
| Instagram |        5.92 s |                   3.93 s | Non-empty MP4           |
| YouTube   |        3.86 s |                   3.90 s | Non-empty converted MP3 |

Measured on 2026-10-13 with Playwright driving the real Electron app, using
exactly the three owner-supplied links. Timings start at link entry and at the
Download Now click respectively; they are one sample each, not a benchmark
distribution or guarantee. Site throttling, geographic routing, login changes,
format availability, and file size can change them. The test's initial app
startup is excluded from the per-link preview figures.

A second full live-suite run also completed all three: Facebook 2.85 s preview
/ 1.93 s download, Instagram 4.37 s / 4.39 s, and YouTube 3.35 s / 4.92 s.
That variation is why this release does not claim a fixed two- or three-second
limit for third-party sites.

The finite 1.0.1 performance rerun passed all three cases: window shown in
1,070 ms, input interactive in 1,291 ms, idle CPU 0.322%, active CPU 1.316%,
62 progress frames per second, 13 mounted Library rows, 62 scroll frames per
second, and a 9 ms search. Idle working set was 387.76 MB, essentially flat
against the original 388.06 MB Intel baseline and still above the original
300 MB target. No soak was run.

## Changes made during the audit

- Library search now updates immediately and filters metadata before main-
  process file-status checks.
- Select and confirmation overlays use solid semantic surfaces. No list row
  contains blur, and a screen shows no more than three blurred cards.
- Tabs remain lazy chunks, Queue cards retain per-job selectors and stable
  callbacks, and Library virtualization mounts only the visible rows.
- `npm run build` enforces the 350 KiB renderer-JavaScript gzip budget.
