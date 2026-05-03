# AGENTS.md

## Cursor Cloud specific instructions

This is a client-side Morse code practice web application (no backend). Built with Knockout.js, Bootstrap 5, TypeScript/JavaScript, bundled with Webpack 5.

### Key commands

| Task | Command |
|---|---|
| Install deps | `npm install` |
| Dev server (port 3000) | `npm run dev` |
| Lint | `npx eslint src/` |
| Build | `npm run build` |

### Notes

- **No test suite exists** — there are no unit or integration tests in this repo. Linting (`eslint`) and build (`webpack`) are the primary verification steps.
- The `prebuild` step (`npm run prebuild`) auto-generates lesson/preset JS files from JSON configs. It runs automatically as part of `npm run build` but **not** as part of `npm run dev`. If lesson or preset JSON files change, run `npm run prebuild` manually before starting the dev server, or run `npm run build` first.
- The optional RSS headline feature requires a CORS proxy on `http://127.0.0.1:8085/` which is not included in this repo. All other features work without it.
- Branch workflow: create feature branches off `develop` and submit PRs to merge into `develop`.
- Node.js 18 is required (the project uses Webpack 5 and related tooling compatible with Node 18).
