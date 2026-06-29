# Tests

The repo uses Vitest for unit/integration coverage and Playwright for browser E2E coverage.

## Vitest

```bash
npm test
npm run test:watch
npm run test:coverage
```

Coverage currently includes utilities, timing, settings serialization, Speed Racer settings, theme behavior, lesson plugin behavior, and selected DOM helpers. Vitest runs in `jsdom` by default; integration tests can opt into Node.

Vitest is not the first-pass target for full Web Audio playback, browser speech synthesis, or full Knockout rendering.

## Playwright

Playwright serves the built app from `dist/`, so build first:

```bash
npm run build
npm run test:e2e
```

First-time browser install:

```bash
npx playwright install chromium
```

Specs live in `e2e/` and cover app load, lesson pickers, settings layout, playback behavior, dark mode, mobile settings width, and accessibility.

Run the focused accessibility checks:

```bash
npx playwright test e2e/accessibility.spec.ts
```

The accessibility spec uses `@axe-core/playwright` and also asserts screen-reader-facing names/descriptions for keyboard shortcuts, Speed Racer, Voice, Tone, Input, Output, Flagged cards, Noise, RSS, and the single polite live region.

## CI

`develop2.yml` runs on `develop` pushes and PRs with Node 20:

```bash
npm ci
npm run test
npm run build --if-present
npx playwright install --with-deps chromium
npm run test:e2e
```

Fork hosting is Cloudflare Workers. Some workflow files still contain legacy GitHub Pages deploy steps; those are not the current fork preview/deploy path.
