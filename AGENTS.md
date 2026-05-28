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
- For settings UI layout or field sizing, include **small/narrow viewports** (~375–390px), not desktop-only.

## Learned Workspace Facts

- Fork GitHub Pages (`main2.yml`, `develop2.yml`): **`main`** deploys `dist` to `gh-pages` root; **`develop`** deploys to `gh-pages/dev/` (preview at https://rdreed21.github.io/morsebrowser_dev/dev/). On `/dev/` URLs (`isDev()`), footer shows BETA warning with link to stable root (`../`).
- Run `npm run prebuild` after adding or removing preset JSON under `src/presets/configs/` (`morsePresetFinder.js` is gitignored and must match configs on disk).
- `.cursor/` is local IDE state and is listed in `.gitignore`.
- Settings UI (`src/template.html`): **LICW Lessons** (expanded; TYPE/CLASS/CONTENT/LESSON/PRESETS as dropdown pickers; label **CONTENT**, placeholder **Select Content** in `morseLessonPlugin.ts`), then five collapsed settings accordions — **Lesson Options**, **Voice Options**, **Tone Options**, **Input Options**, **Output Options**. **Lesson Options** fieldsets (in order): **Overrides** (Custom Group, Override time/size, Apply), **Playback** (Randomize, Auto Close, Sticky Sets, Keep Lines, Shuffle Intra-group), **Timing** (Speed Intervals, Repeats, Noise toggle), **Trail** (last). **Tone Options**: DIT, DAH, Zero Beat only. **Output Options**: PRE, WORD SPACE, CARD WAIT, CARD SIZE, Cards, Audio download. **Input Options**: practice text (View/Clear/Insert File/textarea) and **Flagged cards** fieldset (Load As Text). Shuffle Intra-group is always visible (former `?adminMode=1` gate removed). Fresh **Play** (not resume) collapses all open settings accordions (`collapseSettingsAccordions` in `src/morse/morse.ts`).
- **Tom deep links**: `?selectedClass=&selectedGroup=&selectedLesson=&selectedPreset=` still load lessons/presets on v2 (UI reorg unchanged; `morseLessonPlugin.ts`); same query string on fork preview (`https://rdreed21.github.io/morsebrowser_dev/dev/`). Incoming Tom-style links do not need the logo easter egg. **Logo easter egg**: four header logo clicks toggle `queryStringSettingsOn` (no visible UI); the URL updates only when TYPE/CLASS/CONTENT/LESSON/PRESETS change after sync is on—not on the 4th click.
- App footer shows **Version 2.0** (`#version-info`).
- **Dark mode**: header toggle; `data-theme` on `documentElement`; persisted as `darkMode` cookie (`src/morse/theme/theme.ts`, `licwdefaults.json`). Club logo and UI images need dark-theme treatment.
- Credits `#contributor-info`: list contributors by **call sign only** (e.g. KQ4NKF, W6JY).
- Automated tests: **Vitest** for unit/integration (utils, timing, lesson plugin, theme); **Playwright** for browser smoke E2E (accordions, pickers, Play, dark mode). Full Web Audio / Knockout playback is not a first-pass Vitest target. Run `npm test` before PRs; E2E needs `npm run build` first (or `npm run test:all`). See `tests/README.md`.
- Settings field widths use CSS classes in `src/css/style.css`: `morse-settings-num`, `morse-settings-num--wide`, `morse-settings-text-short`, `morse-settings-text-interval` (avoid inline width on settings inputs). Small-viewport layout: `e2e/settings-layout-mobile.spec.ts` (Playwright `mobile-chrome` / Pixel 5).
- Voice Options: sub-controls stay visible and are **disabled** when Voice is off (not hidden).
- Header **Click here for help** scrolls to `#page-help-footer` (credits, bug/video/guide links, keyboard shortcuts).
- Architecture and build flow for humans/agents: `docs/DEVELOPER_GUIDE.md` (Mermaid diagrams in `docs/`).
