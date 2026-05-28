# Tests (morsebrowser_dev)

## Unit and integration (Vitest)

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

- **Unit tests** live under `tests/unit/` (utils, timing, theme, lessons plugin, settings, DOM helpers).
- **Integration** `tests/integration/checklessons.test.ts` checks `wordlists.json` against `src/wordfiles/` (parity with postbuild `checklessons.js`; allows ~15% missing files like the warning script).

Vitest uses `jsdom` by default. Integration tests use `@vitest-environment node`.

### Out of scope for Vitest v1

- Web Audio / `SmoothedSoundsPlayer`
- Full `MorseViewModel` construction
- Knockout component HTML partials
- Webpack bundle smoke

## End-to-end (Playwright)

Requires a production build (served from `dist/`):

```bash
npm run build
npm run test:e2e
# or
npm run test:all   # vitest + build + e2e
```

E2E specs in `e2e/`: app load, lesson pickers, lesson options layout, playback accordion collapse, dark mode, settings field layout on a narrow viewport (`settings-layout-mobile.spec.ts`, Playwright `mobile-chrome` project).

First-time setup: `npx playwright install chromium`

## CI

`develop2.yml` (on push/PR to `develop`) runs `npm test`, `npm run build`, then `npm run test:e2e` on Node 20.

Fork hosting is **Cloudflare Workers**, not GitHub Pages; the workflow file still contains a legacy Pages deploy step that is not used for fork previews. See [docs/DEVELOPER_GUIDE.md](../docs/DEVELOPER_GUIDE.md#83-deploy-hosting).
