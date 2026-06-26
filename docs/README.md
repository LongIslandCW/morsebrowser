# Morse Practice Page — documentation

Developer documentation for the LICW Morse Practice Page (MPP) source tree.

| Document | Description |
|----------|-------------|
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | Full guide: HTML layout, Knockout/Bootstrap, TypeScript modules, build pipeline, lessons/presets, playback |

## Quick links

- **Run locally:** `npm install` → `npm run dev` (http://localhost:3000)
- **UI markup:** `src/template.html`
- **App entry:** `src/index.js` → `src/morse/morse.ts` (`MorseViewModel`)
- **Tests:** `npm test` (Vitest), `npm run test:e2e` (Playwright, needs build)

## Hosting

| Site | Where it runs |
|------|----------------|
| **Club (production)** | [longislandcw.github.io/morsebrowser](https://longislandcw.github.io/morsebrowser/index.html) — GitHub Pages on `LongIslandCW/morsebrowser` |
| **This fork (Roger dev)** | **Cloudflare Workers** — `npm run build` && `npm run deploy`; PRs show Workers preview URLs. Not GitHub Pages. |

BETA footer (`isDev()`): shown when the page URL contains `/dev/` (common on club Pages dev paths; usually not on `*.workers.dev` previews).

Details: [DEVELOPER_GUIDE.md § Deploy](./DEVELOPER_GUIDE.md#83-deploy-hosting), [AGENTS.md](../AGENTS.md).
