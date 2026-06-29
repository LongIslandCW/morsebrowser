# Morse Practice Page Documentation

Developer and maintainer documentation for the LICW Morse Practice Page source tree.

| Document | Use |
|----------|-----|
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | Architecture, UI layout, build flow, lessons/presets, playback, deployment, tests |
| [SPEED_RACER.md](./SPEED_RACER.md) | Speed Racer UI, playback behavior, preset keys, Tom-style deep links |
| [../tests/README.md](../tests/README.md) | Vitest, Playwright, accessibility E2E, CI notes |
| [../MAINTAINERS.md](../MAINTAINERS.md) | Maintainer checklist and source map |
| [../AGENTS.md](../AGENTS.md) | Fork-specific agent notes and Roger's workflow preferences |

## Quick Commands

```bash
npm install
npm run dev          # local dev server, http://localhost:3000
npm test             # Vitest unit/integration tests
npm run build        # prebuild + webpack + postbuild checks
npm run test:e2e     # Playwright, serves dist/
npm run test:all     # unit + build + E2E
```

## Hosting

| Site | Where it runs |
|------|---------------|
| Club production | GitHub Pages from `LongIslandCW/morsebrowser`: https://longislandcw.github.io/morsebrowser/index.html |
| This fork | Cloudflare Workers from `rdreed21/morsebrowser_dev`; build with `npm run build`, deploy with `npm run deploy` |

The fork workflows still contain legacy GitHub Pages deploy steps, but fork previews and hosting are handled by Cloudflare Workers. The BETA footer appears when the URL path contains `/dev/`.
