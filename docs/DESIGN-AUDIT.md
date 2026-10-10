# Design Audit

Audited on 2026-10-09 against `design/DESIGN.md` and all five screen HTML
references. The source files remain unchanged.

## Shared shell

- Keep the 44px title bar, 48px top tab row, compact typography, semantic
  emerald/obsidian palette, and 20px content padding.
- Remove the fixed 850×600 artboard, outer radius, outer border, and simulated
  page shadow. The real opaque window is resizable from 850×600 to maximized.
- Use native macOS traffic lights and three custom Windows controls. The HTML's
  two cross-platform controls are only a visual hint.
- Replace CDN Tailwind, Google Fonts, and Material Symbols with local Tailwind
  v4, bundled Fontsource fonts, and Lucide icons.
- Replace raw colors with semantic `@theme` tokens. Glass card alpha follows
  the screens at 0.62 rather than the older 0.60 design note.
- Hide the Queue badge at zero; the reference's counts are demo data.
- Bind the title-bar pill to the real binary status. It reports checking, ready,
  or problem without invented versions or health data.

## Downloader reference

- Preserve the compact URL, preview, options, location, and primary-action
  composition for Phase 3.
- Remove “Direct Stream Pipe,” “Start All,” “Studio Master,” “High Bitrate,”
  simulated progress, sample media, queue totals, and fabricated free space.
- Remove WebM, FLAC, and 192 kbps options; v1 supports MP4/MKV and
  MP3/M4A/WAV at 320/256/128 kbps.
- Native themed Select components replace the HTML `<select>` controls.
- The video and audio variants share one real option card instead of displaying
  both reference variants simultaneously. Only options applicable to the
  selected download kind are shown.
- The preview uses the probed remote thumbnail when available and an honest
  unavailable state otherwise; the reference's sample image never ships.
- Estimated size and free space come from the engine and filesystem. Unknown
  values render as unavailable rather than using the reference's sample data.

## Queue reference

- Preserve the dense card proportions and clear visual states for Phase 3.
- Remove “Simulate Empty,” fake workers, “Turbo Mode,” “Chunk #4/6,” demo
  throughput/storage, remote thumbnails, and duplicate downloader scripts.
- List rows will use solid surfaces without backdrop blur for scroll
  performance; progress fill will animate with `transform: scaleX`.
- The real queue sorts active, waiting, paused, then newest terminal jobs. It
  omits the reference's fabricated worker labels and displays only engine data.
- At 850×600 the reference's dense proportions are preserved; at wider sizes
  rows grow horizontally rather than becoming taller.

## Library reference

- Preserve search/filter/sort, compact history rows, footer summary, and empty
  state for Phase 4.
- Remove `v3.4 PRO`, hard-coded item counts/sizes/paths, sample history,
  toggle-demo control, and remote thumbnails.
- The reference is 860×640 with rectangular tabs; the higher-priority shared
  shell establishes 850×600 and pill tabs.

## Settings reference

- Preserve Download Location, Engine, and Preferences card groupings for
  Phase 4, including auto-paste, notifications, and keep-on-top.
- Remove `v2.4 PRO`, “4K ProRes • Ultra Engine,” “Dual Core,” fabricated engine
  versions/dates/codecs, free-space and RAM values, config-path telemetry,
  “Check App Updates,” and simulated update responses.
- FFmpeg licensing is not “permissive” for the supplied GPL-enabled build; the
  production copy will accurately identify third-party licensing.

## About reference

- Preserve the two-column profile/about layout, expertise chips, open-source
  card, connect/support row, and compact footer for Phase 4.
- Replace the temporary remote portrait with
  `src/renderer/src/assets/developer.jpg`, sourced from the supplied
  `design/assets/developer.PNG`.
- Correct LinkedIn to `https://www.linkedin.com/in/hussainislive/`, GitHub to
  the project repository when public, and version copy to `app.getVersion()`.
- Add the required legal sentence; route every external action through the
  main-process allowlist.
