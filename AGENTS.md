# AGENTS.md — HA Premium Video Downloader

Instructions for OpenAI Codex and any other coding agent that reads `AGENTS.md`.

## MANDATORY FIRST STEPS (every session)

1. Read **`CLAUDE.md`** in full — it contains the project rulebook and applies to **all** agents, not only Claude. Wherever it says "Claude", read "you".
2. Read **`master-prompt.md`** in full — the complete specification (stack, structure, design system, engine, screens, 5 phases, testing, packaging, docs).
3. Read `docs/PROGRESS.md` and `docs/DECISIONS.md` (they may not exist before Phase 1 — create them there).
4. Run `git status` and `npm run typecheck` to learn the baseline.

Then execute **only** the phase the owner requested ("Execute Phase N", "Continue Phase N", "Fix: …", "Review Phase N", "Status"). Never start the next phase.

## THE 15 RULES THAT MATTER MOST (in case you read nothing else)

1. Loop every task: **PLAN → IMPLEMENT → VERIFY → DOCUMENT → REPORT**. Keep the app runnable after every step.
2. A phase is done only when its Definition of Done is true and `npm run check` is green. Do not claim otherwise.
3. Stack: Electron (latest stable major) + electron-vite + React 19 + **TypeScript strict** + Tailwind v4 + Motion + Zustand + zod. npm, Node 24 LTS, exact-pinned versions resolved with `npm view` (never trust remembered versions; no alpha/beta/rc).
4. Process execution: `child_process.spawn`, argument array, `shell: false`, **`windowsHide: true`**; URLs after `--`; tree-kill on cancel/pause. No terminal window may ever appear.
5. Security: `contextIsolation`, `sandbox`, no `nodeIntegration`, strict CSP, blocked navigation, allowlisted `openExternal`, zod-validated IPC, `Result` returns, no raw stderr in UI, no URLs-with-queries in logs, no telemetry.
6. All colors are **tokens** in `styles/index.css` (`@theme`); no hex/rgba in `.tsx`. Animate transform/opacity only; respect reduced motion; ≤ 3 blurred surfaces; no blur inside list rows.
7. Window: min 850×600, resizable, responsive up to 1920×1080; macOS native traffic lights (left), Windows custom min/max/close (right); no transparent windows.
8. The Stitch HTML in `design/` is a visual reference only (CDN Tailwind/fonts, hard-coded hex, temp image URL, may include invented features). Rebuild properly; log deviations in `docs/DESIGN-AUDIT.md`. **Never modify `design/` or `binaries/`; never commit binaries.**
9. Main process owns downloads/settings/history. Progress to the renderer ≤ 5 Hz, batched; memoized cards with per-job selectors.
10. Pause = kill + keep `.part`; resume = `--continue`. yt-dlp runs from a writable copy in `userData`.
11. Files ≤ 250 lines (cap 400), one responsibility each; renderer never imports `main/`; `shared/` imports nothing else. No `any`, no empty `catch`, no `console.*`, no dead code.
12. Tests: Vitest + Testing Library; **Playwright for Electron** E2E with a deterministic fake engine (`HA_TEST_ENGINE_SCRIPT`); axe on every screen; visual snapshots; `@live` tests for real binaries. Regression test for every fix.
13. Docs every phase: `README.md` (human-written, warm, honest, fresh screenshots), `CHANGELOG.md`, `docs/PROGRESS.md`, plus ARCHITECTURE/STACK/TESTING when affected. ADR the moment you decide something significant.
14. Git: branch `phase-N-slug`, Conventional Commits, commit locally, **never push/merge/force/rewrite unless asked**.
15. No scope creep: playlists, subtitles, cookies, app auto-update, telemetry are out of v1. No fake data in the UI.

## CODEX-SPECIFIC WORKING NOTES

- Work autonomously and finish the whole phase in one session when possible; do not stop after the first milestone. Checkpoint by updating `docs/PROGRESS.md` and committing at each green step so another session can resume.
- Prefer small, verifiable edits; run the relevant test file after each change and the full `npm run check` at milestones.
- If a command needs network (npm install, fetching design renders, live tests) and the sandbox blocks it, state precisely which command, then continue with everything that does not need it.
- If a sandbox/approval prompt blocks a legitimate step (e.g. launching Electron for Playwright), explain why it is needed and proceed with the least-privileged option.
- Finish every phase with the report format in `master-prompt.md` §14.4.
