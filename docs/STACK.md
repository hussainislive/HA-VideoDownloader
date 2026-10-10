# Resolved Stack

Resolved from the npm registry on 2026-10-09. Every package is exact-pinned in `package.json` and `package-lock.json`; compatibility and peer ranges take priority over an unsupported newer major.

## Toolchain and application

| Area              | Package                                  | Version | Reason                                                                |
| ----------------- | ---------------------------------------- | ------: | --------------------------------------------------------------------- |
| Tool runtime      | Node.js                                  |  24 LTS | Project baseline; enforced by `.nvmrc` and `engines`                  |
| Desktop runtime   | `electron`                               |  44.7.0 | Latest security patch in the established 44 major                     |
| Electron build    | `electron-vite`                          |   5.0.0 | Current stable release; supports Vite 5–7                             |
| Bundler           | `vite`                                   |   7.3.6 | Mature compatible major; Vite 8 is outside electron-vite's peer range |
| React transform   | `@vitejs/plugin-react`                   |   5.2.0 | Compatible stable React plugin                                        |
| Language          | `typescript`                             |   6.0.3 | Supported by typescript-eslint's `<6.1` peer range                    |
| UI                | `react`, `react-dom`                     |  19.3.0 | Current stable React 19 line                                          |
| Styling           | `tailwindcss`, `@tailwindcss/vite`       |   4.3.3 | Tailwind v4 token and Vite integration                                |
| Animation         | `motion`                                 |  13.4.4 | Stable Motion release old enough for the maturity window              |
| Icons             | `lucide-react`                           |  1.48.0 | Local SVG icon components                                             |
| State             | `zustand`                                |  5.0.15 | Selector-based feature stores from Phase 2 onward                     |
| Validation        | `zod`                                    |   4.6.5 | IPC and persisted-data boundaries                                     |
| Logging           | `electron-log`                           |   5.4.4 | Local rotating process logs                                           |
| Virtual lists     | `@tanstack/react-virtual`                | 3.14.13 | Phase 4 Library scaling                                               |
| Class composition | `clsx`                                   |   2.1.1 | Conditional semantic utilities                                        |
| Tailwind merging  | `tailwind-merge`                         |   3.7.0 | Predictable component overrides                                       |
| UI font           | `@fontsource-variable/plus-jakarta-sans` |   5.3.0 | Bundled primary font                                                  |
| Telemetry font    | `@fontsource-variable/inter`             |   5.3.0 | Bundled tabular-number font                                           |

## Quality and packaging

| Area                | Package                            | Version | Note                                          |
| ------------------- | ---------------------------------- | ------: | --------------------------------------------- |
| Unit runner         | `vitest`                           |   5.0.2 | Unit and component tests                      |
| Coverage            | `@vitest/coverage-v8`              |   5.0.2 | Matching Vitest release                       |
| DOM environment     | `jsdom`                            |  30.1.1 | Renderer component environment                |
| Component tests     | `@testing-library/react`           |  16.3.3 | React behavior tests                          |
| DOM assertions      | `@testing-library/jest-dom`        |   7.0.1 | Accessible assertions                         |
| User interactions   | `@testing-library/user-event`      |  14.6.7 | Keyboard and pointer behavior                 |
| Electron E2E        | `@playwright/test`                 |  1.64.0 | Matches axe-playwright's Playwright core line |
| Accessibility       | `@axe-core/playwright`             |  4.13.0 | Automated checks on every tab                 |
| Lint core           | `eslint`, `@eslint/js`             |  9.39.5 | JSX a11y does not yet accept ESLint 10        |
| Typed lint          | `typescript-eslint`                |  8.70.1 | Supports TypeScript below 6.1                 |
| Hook lint           | `eslint-plugin-react-hooks`        |   7.1.1 | React hooks correctness                       |
| A11y lint           | `eslint-plugin-jsx-a11y`           |  6.10.2 | Static JSX accessibility checks               |
| Import sorting      | `eslint-plugin-simple-import-sort` |  14.0.0 | Deterministic imports                         |
| Formatting          | `prettier`                         |   3.9.9 | Repository formatting                         |
| Tailwind formatting | `prettier-plugin-tailwindcss`      |   0.8.1 | Canonical utility order                       |
| Packaging           | `electron-builder`                 | 26.15.3 | DMG and future NSIS artifacts                 |
| Git hooks           | `husky`                            |   9.1.7 | Fast pre-commit hook                          |
| Staged checks       | `lint-staged`                      |  17.5.1 | Lint and format changed files                 |
| TS execution        | `tsx`                              | 4.23.15 | Repository scripts                            |
| Node types          | `@types/node`                      | 24.19.0 | Matches the Node 24 toolchain                 |
| React types         | `@types/react`, `@types/react-dom` |  19.3.0 | Matches React 19.3                            |

## Resolution notes

- Versions and build-tool peer dependencies were queried with `npm view`; prerelease tags were excluded.
- Electron 44.7.0 is the deliberate exception to the 14-day preference because current security patches take priority.
- Playwright 1.64.0 is also newer than the preference window because `@axe-core/playwright` 4.13.0 depends on the matching core types.
- The development machine's global Node was 26, so all Phase 1 gates were run with an isolated Node 24.21.0 executable. Contributors should use `.nvmrc` instead.
- The Phase 1 install reported eight moderate transitive audit findings and no high or critical findings. The release gate requires zero high/critical findings in Phase 5.
