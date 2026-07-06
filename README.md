# Long Island CW Morse Practice Page

This repository contains the source for the Long Island CW Club Morse Practice Page, a browser-based Morse code trainer built with Knockout, Bootstrap, TypeScript, Webpack, and Web Audio.

The app includes LICW lesson catalogs, settings presets, card-based practice, voice recap, optional noise/RSS experiments, audio download, dark mode, keyboard shortcuts, and accessibility support for screen-reader users.

## Live App

Use the club production site for practice:

https://longislandcw.github.io/morsebrowser/index.html

Offline ZIP:

https://longislandcw.github.io/morsebrowser/download/morse.zip

## Repository And Hosting

This repo, `rdreed21/morsebrowser_dev`, is Roger's development fork.

| Target | Repository | Hosting |
|--------|------------|---------|
| Club production | `LongIslandCW/morsebrowser` | GitHub Pages |
| This fork | `rdreed21/morsebrowser_dev` | Cloudflare Workers |

Roger opens upstream PRs manually. Work in this fork should target `develop` unless a different base is requested. See [AGENTS.md](AGENTS.md) for fork-specific workflow notes.

## Local Development

```bash
npm install
npm run dev          # webpack dev server, http://localhost:3000
npm run build        # prebuild + webpack + zip/checklessons
npm test             # Vitest unit/integration tests
npm run test:e2e     # Playwright E2E tests, serves dist/
npm run test:all     # unit + build + E2E
```

First-time Playwright setup:

```bash
npx playwright install chromium
```

Deploy this fork to Cloudflare Workers:

```bash
npm run build
npm run deploy
```

`wrangler.jsonc` publishes static assets from `dist/` to the `morsebrowserdev` Worker.

## Documentation

- [docs/README.md](docs/README.md) - documentation index
- [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) - architecture, UI, build, tests, deployment
- [docs/SPEED_RACER.md](docs/SPEED_RACER.md) - Speed Racer behavior, presets, and deep links
- [tests/README.md](tests/README.md) - Vitest and Playwright guidance
- [MAINTAINERS.md](MAINTAINERS.md) - maintainer checklist and source map

## Code Orientation

- Main UI: `src/template.html`
- App entry: `src/index.js`
- Root view model: `src/morse/morse.ts`
- Lesson picker: `src/morse/lessons/morseLessonPlugin.ts`
- Settings models: `src/morse/settings/`
- Playback/audio: `src/morse/player/`
- Voice/TTS: `src/morse/voice/MorseVoice.ts`
- Tests: `tests/` and `e2e/`

After adding or removing files under `src/wordfiles/`, `src/presets/configs/`, or `src/presets/sets/`, run `npm run prebuild` or `npm run build` so the generated dynamic import maps match files on disk.

## Contributing

Bug reports and feature requests can be filed at:

https://github.com/LongIslandCW/morsebrowser/issues

For code contributions, create a feature branch from `develop`, keep the app approachable for ham tinkerers, run the tests above, and open the appropriate fork PR. The project intentionally uses Knockout and Bootstrap rather than a larger frontend framework.
