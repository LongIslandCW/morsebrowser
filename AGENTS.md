# Agent notes (morsebrowser_dev)

## Git remotes

- **`origin`** — `rdreed21/morsebrowser_dev` (fork). Push and PRs here only.
- **`upstream`** — `LongIslandCW/morsebrowser` (parent). Fetch only.

Roger opens upstream PRs manually with the team. Global rule: `~/.cursor/rules/fork-only-git.mdc`.

## Learned User Preferences

- The user's name is **Roger**, not Robert.
- Never push to `upstream` or open PRs into `LongIslandCW/morsebrowser`; Roger handles that with the team.
- Use **develop** as the default branch for feature work and fork PRs unless Roger specifies another base (e.g. `main`).
- Do not commit `.cursor/` or hook/index state; keep durable agent notes in **AGENTS.md**.
- When Roger asks for an easy rollback of a distinct UI change, use a **separate commit** for that part.
- Only create git commits when Roger explicitly asks (e.g. commit-and-push action or direct request).

## Learned Workspace Facts

- Fork GitHub Pages (`main2.yml`, `develop2.yml`): **`main`** deploys `dist` to `gh-pages` root; **`develop`** deploys to `gh-pages/dev/` (preview at https://rdreed21.github.io/morsebrowser_dev/dev/). On `/dev/` URLs (`isDev()`), footer shows BETA warning with link to stable root (`../`).
- Run `npm run prebuild` after adding or removing preset JSON under `src/presets/configs/` (`morsePresetFinder.js` is gitignored and must match configs on disk).
- `.cursor/` is local IDE state and is listed in `.gitignore`.
- Settings UI (`src/template.html`): **LICW Lessons** (expanded; TYPE/CLASS/CONTENT/LESSON/PRESETS as dropdown pickers; label **CONTENT**, placeholder **Select Content** in `morseLessonPlugin.ts`), then five collapsed settings accordions — **Lesson Options**, **Voice Options**, **Tone & spacing Settings**, **Custom Input**, **Output Settings**. Trail, Speed Intervals, and Repeats live under Lesson Options; **Group & override** (subgroups **Apply to update text**: Custom Group, Override time/size, Apply; **During playback**: Keep Lines, Shuffle Intra-group) sits in Lesson Options beside Practice — Shuffle Intra-group is always visible (former `?adminMode=1` gate removed). **Custom Input** holds View text, Clear, Insert File, and the practice textarea (moved out of the play toolbar).
- App footer shows **Version 2.0** (`#version-info`).
- **Dark mode**: header toggle; `data-theme` on `documentElement`; persisted as `darkMode` cookie (`src/morse/theme/theme.ts`, `licwdefaults.json`). Club logo and UI images need dark-theme treatment.
- Fresh **Play** (not resume) collapses all open settings accordions (`collapseSettingsAccordions` in `src/morse/morse.ts`).
- Credits `#contributor-info`: list contributors by **call sign only** (e.g. KQ4NKF, W6JY).
- When adding automated tests: **Vitest** for unit/integration (utils, timing, lesson plugin, theme); **Playwright** for browser smoke E2E (accordions, pickers, Play, dark mode). Full Web Audio / Knockout playback is not a first-pass Vitest target.
- Voice Options: sub-controls stay visible and are **disabled** when Voice is off (not hidden).
- Header **Click here for help** scrolls to `#page-help-footer` (credits, bug/video/guide links, keyboard shortcuts).
- Run `npm test` before PRs; E2E needs `npm run build` first (or use `npm run test:all`). See `tests/README.md`.
- Architecture and build flow for humans/agents: `docs/DEVELOPER_GUIDE.md` (Mermaid diagrams in `docs/`).
