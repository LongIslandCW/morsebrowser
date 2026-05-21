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

- Fork GitHub Pages (`main2.yml`, `develop2.yml`): **`main`** deploys `dist` to `gh-pages` root; **`develop`** deploys to `gh-pages/dev/` (preview at https://rdreed21.github.io/morsebrowser_dev/dev/).
- Run `npm run prebuild` after adding or removing preset JSON under `src/presets/configs/` (`morsePresetFinder.js` is gitignored and must match configs on disk).
- `.cursor/` is local IDE state and is listed in `.gitignore`.
- Settings UI: four collapsed accordions in order — **Lesson Options**, **Voice Options**, **Tone & spacing Settings**, **Output Settings** (`src/template.html`). Trail, Speed Intervals, and Repeats live under Lesson Options; there is no separate Additional Settings panel.
- Lesson labels: **CONTENT** (not LETTER GROUP); placeholder **Select Content** (not wordlist) in `morseLessonPlugin.ts`.
- Voice Options: sub-controls stay visible and are **disabled** when Voice is off (not hidden).
- Header **Click here for help** scrolls to `#page-help-footer` (credits, bug/video/guide links, keyboard shortcuts).
