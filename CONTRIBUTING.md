# Contributing

Thanks for helping make HA Premium Video Downloader better. The project values
small, focused changes that keep the application private, predictable, and
pleasant to use.

## Before you start

- Open an issue before a large change so effort is not duplicated.
- Keep v1 scope intact: no playlists, cookie import, subtitles UI, app
  auto-update, telemetry, or unrelated platform work.
- Never commit engine binaries, secrets, logs, downloaded media, or generated
  release artifacts.
- Read `AGENTS.md`, `CLAUDE.md`, and the relevant architecture and testing docs.

## Development setup

Use Node.js 24 LTS and npm 11 or newer. Obtain the platform tools described in
`binaries/README.md`, then run:

```sh
npm ci
npm run verify:binaries
npm run dev
```

Create a focused branch, use Conventional Commits, and add a regression test
for every bug fix. Keep TypeScript strict, route privileged work through
validated IPC, and use semantic color tokens rather than literals in JSX.

Before opening a pull request, run:

```sh
npm run check
```

Engine changes also require `npm run test:e2e:live`. Platform-specific behavior
must be tested on that platform or clearly marked for maintainer verification.

By contributing, you agree that your contribution is licensed under
GPL-3.0-or-later and that you will follow `CODE_OF_CONDUCT.md`.
