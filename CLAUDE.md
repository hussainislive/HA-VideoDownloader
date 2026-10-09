# CLAUDE.md — HA Premium Video Downloader

This file is loaded automatically at the start of every session. It is the **short, always-on rulebook**. The full specification is in **`master-prompt.md`** — read it completely before doing any phase work.

## 1. Project in one paragraph

**HA Premium Video Downloader**: a free, open-source desktop app (macOS Intel + Apple Silicon, Windows 10/11) that wraps `yt-dlp` and `ffmpeg` in a polished GUI. Electron + electron-vite + React 19 + TypeScript (strict) + Tailwind CSS v4 + Motion + Zustand + zod. Dark obsidian-glass design with emerald accent `#0FD920`. Compact resizable window (min 850×600), custom frameless title bar, 5 tabs: **Downloader · Queue · Library · Settings · About**. Owner/developer: Hussain Ahmed (`hussainislive`). No terminal windows ever; no telemetry ever.

## 2. How we work

- The owner runs the project in **5 phases** (details in `master-prompt.md` §9): 1 Foundation · 2 Engine · 3 Downloader + Queue UI · 4 Library, Settings, About · 5 Hardening & release.
- Commands you will receive: `Execute Phase N`, `Continue Phase N`, `Fix: …`, `Review Phase N`, `Status`.
- Do **only** the requested phase. Loop for every task: **PLAN → IMPLEMENT → VERIFY → DOCUMENT → REPORT**.
- **Session start:** `git status` → read `docs/PROGRESS.md` and `docs/DECISIONS.md` → `npm run typecheck` for a baseline.
- **Session end:** all gates green → docs updated → phase report (format in `master-prompt.md` §14.4).
- Branch per phase (`phase-N-slug`), Conventional Commits, commit locally. **Never push, merge, force-push, or rewrite history unless asked.**

## 3. Sources of truth (highest wins)

1. Owner's latest instruction → 2. `master-prompt.md` → 3. `design/<screen>-screen/code.html` (layout/copy/spacing) → 4. `design/DESIGN.md` (tokens/components/motion; its layout section is superseded) → 5. PNGs.
`design/` and `binaries/` are **read-only for you** — never modify, delete, or commit their contents (binaries are git-ignored).

## 4. Commands

```
npm run dev              # Electron with HMR
npm run check            # THE GATE: typecheck + lint + format:check + unit + e2e (fake engine)
npm run test:e2e:live    # real yt-dlp/ffmpeg, opt-in (phases 2, 5, engine changes)
npm run verify:binaries  # presence, +x, arch, versions
npm run render:design    # renders design/*/code.html → design/_renders/*.png
npm run dist:mac | dist:win
```
Node 24 LTS, npm only, exact-pinned dependencies (resolve real latest-stable versions with `npm view` in Phase 1; record in `docs/STACK.md`).

## 5. Architecture rules (summary of §4–5, §8)

- Three processes: **main** (owns downloads/settings/history/engine), **preload** (`contextBridge` only, narrow typed `window.api`), **renderer** (React, sandboxed, no Node).
- Layout: `src/shared` (pure TS, imported by all) · `src/main/{window,ipc,engine,downloads,services,security}` · `src/preload` · `src/renderer/src/{components/ui,components/shell,features/*,store,hooks,lib,styles}` · `tests/{unit,e2e,fixtures}` · `docs/` · `scripts/`.
- Renderer never imports `main/`; `shared/` imports nothing from the others. One responsibility per file: target ≤ 250 lines, hard cap 400.
- Process execution = `child_process.spawn` with an **argument array**, `shell: false`, **`windowsHide: true`**, wrapped by `ProcessRunner`. URLs are passed after `--`. Tree-kill on cancel/pause (process group on macOS, `taskkill /T /F` on Windows).
- yt-dlp runs from a **writable copy in `userData`** (so `-U` never touches the app bundle). ffmpeg is passed via `--ffmpeg-location`.
- Pause = terminate + keep `.part`; resume = restart with `--continue`. Queue persists across restarts.
- Progress from main is throttled to ≤ 5 Hz and batched; renderer uses per-job selectors and memoized cards.
- Persistence = zod-validated JSON with atomic writes, schema versions, corruption quarantine. No native modules in v1.

## 6. Security rules (non-negotiable)

`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`; strict CSP; block navigation/new windows; `shell.openExternal` only through an allowlist IPC (https hosts: github.com, linkedin.com, paypal.me, yt-dlp release page; plus the developer `mailto:`); every IPC payload validated with zod; handlers return `Result<T, AppError>`; never show raw stderr to users; never log full URLs with query strings; no eval, no remote code, no analytics.

## 7. Design system rules

- **All colors are tokens** defined once in `src/renderer/src/styles/index.css` (`@theme`). Components use semantic utilities (`bg-surface`, `text-fg-muted`, `border-line`, `text-accent`…). **No hex/rgba literals in `.tsx`** (lint-enforced). Re-theming must be a one-file change.
- Key values: accent `#0FD920` (hover `#0BB81B`, glow `#13FE27`), canvas `#090D0A→#0D120E`, glass `#141C16` @ ~60% + blur 16px, elevated `#1C261F`, text `#F0FDF4 / #DCFCE7 / #718E76`, border `rgba(15,217,32,.15)`. Radii: cards 20–24px, inputs/buttons 12px, pills full. Fonts: Plus Jakarta Sans + Inter (bundled, offline). Icons: lucide-react, 1.5 stroke.
- Animate **only transform/opacity**; tab transitions ≈180 ms ease-out-expo; honor `prefers-reduced-motion`; ≤ 3 blurred surfaces on screen; no blur inside list rows.
- The Stitch HTML is a **reference, not code to paste**: it uses CDN Tailwind/fonts, hard-coded hex, a temporary remote photo URL, a fixed 850×600 box, and may contain invented features. Rebuild it as proper React + tokens; remove anything the app cannot truthfully do (log in `docs/DESIGN-AUDIT.md`).
- Window chrome: macOS = native traffic lights on the left (no HTML min/close); Windows = custom min/max/close on the right. No transparent windows. Min size 850×600, resizable, layouts adapt to 1920×1080.

## 8. Code quality rules

TypeScript `strict` + `noUncheckedIndexedAccess`; **no `any`**, no unjustified `!`/`as`; discriminated unions + exhaustive `switch`; expected failures as `Result`, no empty `catch`; pure logic separated from I/O and unit-tested; no `console.*` (use the logger); user-facing strings in `lib/copy.ts`; no dead/commented-out code; new dependency only with an ADR; files `kebab-case.ts`, components `PascalCase.tsx`; hooks clean up IPC subscriptions; stable keys; virtualize lists > 50 rows.

## 9. Testing rules

Unit/component: Vitest + Testing Library. E2E: **Playwright with Electron** against the built app, isolated `userData` per test, deterministic **fake engine** via `HA_TEST_ENGINE_SCRIPT` (run with `ELECTRON_RUN_AS_NODE`), axe a11y on every screen, visual snapshots. `@live` tests exercise real binaries. Every bug fix gets a regression test. No sleeps — wait on conditions. A phase is not done until `npm run check` is green.

## 10. Documentation rules

Update at the end of **every** phase: `README.md` (human-written, warm, truthful feature checklist, fresh screenshots), `CHANGELOG.md`, `docs/PROGRESS.md`, plus `docs/ARCHITECTURE.md`, `docs/STACK.md`, `docs/TESTING.md` when affected. Write ADRs in `docs/DECISIONS.md` the moment you decide something significant. Docs and code never disagree.

## 11. Never

Use `shell: true`/string-built commands · commit binaries/secrets/logs · touch `design/` or `binaries/` · add features not in `master-prompt.md` or the designs (playlists, subtitles, cookies, auto-update, telemetry are **out of scope for v1**) · show fake numbers in the UI · disable or skip failing tests · leave a console window possible on Windows · push or rewrite git history unasked.

## 12. When unsure

Choose the option most consistent with `master-prompt.md` and the design, record a one-paragraph ADR, continue. Ask the owner **only** for irreversible, paid, visibly-design-changing, or legal/licensing decisions.

## 13. Owner reference (for About screen and README credits)

Name: Hussain Ahmed · Email: developer.hussain125@gmail.com · GitHub: https://github.com/hussainislive · LinkedIn: https://www.linkedin.com/in/hussainislive/ · Donate: https://paypal.me/hussainmeer · Repo: https://github.com/hussainislive/HA-VideoDownloader · Bundle id: `com.hussainislive.havideodownloader` · License default: MIT (confirm with owner).
