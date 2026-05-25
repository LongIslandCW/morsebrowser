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

Fork preview: `develop` deploys to GitHub Pages `/dev/` (BETA banner when URL contains `/dev/`).
