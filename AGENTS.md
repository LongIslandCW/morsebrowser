# Agent notes (morsebrowser_dev)

## Git remotes

- **`origin`** — `rdreed21/morsebrowser_dev` (fork). Push and PRs here only.
- **`upstream`** — `LongIslandCW/morsebrowser` (parent). Fetch only.

Roger opens upstream PRs manually with the team. Global rule: `~/.cursor/rules/fork-only-git.mdc`.

## Hosting (club vs this fork)

| | **Upstream (club)** `LongIslandCW/morsebrowser` | **This fork** `rdreed21/morsebrowser_dev` |
|---|------------------------------------------------|---------------------------------------------|
| Public site | [GitHub Pages](https://longislandcw.github.io/morsebrowser/index.html) | [GitHub Pages](https://rdreed21.github.io/morsebrowser_dev/) **and** Cloudflare Workers |
| Deploy | Club `main` → Pages root via upstream workflows | **GH Pages:** push to `develop_kq4nkf` → `.github/workflows/develop_kq4nkf.yml` (JamesIves → `gh-pages` branch, site root — no `/dev/`). **Workers:** `npm run deploy` / Workers Builds (`wrangler.jsonc`, worker `morsebrowserdev`; preview URLs in PR checks) |
| Dev / preview | Club may use `/dev/` on Pages where applicable | GH Pages at repo root (no `/dev/`); Workers branch previews e.g. `develop-morsebrowser.rdreed21.workers.dev` |
| BETA footer | When URL path contains `/dev/` (`isDev()` in `morse.ts`) | Off on fork GH Pages (root deploy) and most Workers URLs (no `/dev/` segment) |

Fork **GH Pages** uses legacy branch deploy (JamesIves → `gh-pages` / root), not `actions/deploy-pages` (conflicted with branch-based Pages when state was wedged). CI sets `GITHUB_PAGES=true` for the Pages build so webpack `publicPath` is `/morsebrowser_dev/` and copies `.nojekyll` into `dist/`. Legacy `develop2.yml` / `main2.yml` Pages steps target other branches.

## Learned User Preferences

- The user's name is **Roger**, not Robert.
- Never push to `upstream` or open PRs into `LongIslandCW/morsebrowser`; Roger handles that with the team.
- Use **develop_kq4nkf** as the default branch for feature work and fork PRs unless Roger specifies another base (e.g. `main`).
- Do not commit `.cursor/` or hook/index state; keep durable agent notes in **AGENTS.md**.
- When Roger asks for an easy rollback of a distinct UI change, use a **separate commit** for that part.
- Only create git commits when Roger explicitly asks (e.g. commit-and-push action or direct request).
- For settings UI layout or field sizing, include **small/narrow viewports** (~375–390px), not desktop-only.
- Upstream (LICW) PRs Roger opens manually target **`develop`**, not `main`.
- When the user clicks **Speed Racer** on or toggles **Speak**, Voice Options accordion expands if it was closed (preset/lesson loads do not).
- Do not bulk-delete files matching `* 2.*` without excluding legitimate names like `Fam_Words - 2.txt` (macOS duplicate cleanup).

## Learned Workspace Facts

- Run `npm run prebuild` after adding or removing preset JSON under `src/presets/configs/` or before `npm test` on fresh checkouts/CI (`morseLessonFinder.js` and `morsePresetFinder.js` are gitignored; fork `develop_kq4nkf.yml` runs prebuild before tests).
- `.cursor/` is local IDE state and is listed in `.gitignore`.
- Settings UI (`src/template.html`): **LICW Lessons** (expanded; TYPE/CLASS/CONTENT/LESSON/PRESETS as dropdown pickers; label **CONTENT**, placeholder **Select Content** in `morseLessonPlugin.ts`), then five collapsed settings accordions — **Lesson Options**, **Voice Options**, **Tone Options**, **Input Options**, **Output Options**. **Lesson Options** fieldsets (in order): **Overrides** (Custom Group, Override time/size, Apply), **Playback** (Randomize, Auto Close, Sticky Sets, Keep Lines, Shuffle Intra-group), **Timing** (Speed Intervals, **Speed Racer**, Repeats, Noise toggle), **Trail** (last; reveals masked cards progressively — no visible effect when **Reveal** is on; inactive during Speed Racer). **Tone Options**: DIT, DAH, Zero Beat only. **Output Options**: PRE, WORD SPACE, CARD WAIT, CARD SIZE, Cards, Audio download. **Input Options**: practice text (View/Clear/Insert File/textarea) and **Flagged cards** fieldset (Load As Text). Shuffle Intra-group is always visible (former `?adminMode=1` gate removed). Fresh **Play** (not resume) collapses all open settings accordions when **`autoCloseSettingsAccordions`** is on (header toggle next to dark mode; cookie-persisted, default on) and scrolls playback controls into view (`collapseSettingsAccordions` / `scrollPlaybackIntoView` in `src/morse/morse.ts`).
- **Tom deep links**: `?selectedClass=&selectedGroup=&selectedLesson=&selectedPreset=` still load lessons/presets on v2 (UI reorg unchanged; `morseLessonPlugin.ts`); same query string works on fork Workers previews and club Pages. Incoming Tom-style links do not need the logo easter egg. **Logo easter egg**: four header logo clicks toggle `queryStringSettingsOn` (no visible UI); the URL updates only when TYPE/CLASS/CONTENT/LESSON/PRESETS change after sync is on—not on the 4th click.
- App footer shows **Version 2.0** (`#version-info`).
- **Dark mode**: header toggle; `data-theme` on `documentElement`; persisted as `darkMode` cookie (`src/morse/theme/theme.ts`, `licwdefaults.json`). Club logo and UI images need dark-theme treatment.
- Credits `#contributor-info`: list contributors by **call sign only** (e.g. KQ4NKF, W6JY). Header **Click here for help** scrolls to `#page-help-footer` (credits, bug/video/guide links, keyboard shortcuts).
- Automated tests: **Vitest** for unit/integration (utils, timing, lesson plugin, theme); **Playwright** for browser smoke E2E (accordions, pickers, Play, dark mode, accessibility). Full Web Audio / Knockout playback is not a first-pass Vitest target. Run `npm test` before PRs; E2E needs `npm run build` first (or `npm run test:all`). Accessibility copy/label changes should run `npx playwright test e2e/accessibility.spec.ts`. See `tests/README.md`.
- Settings field widths use CSS classes in `src/css/style.css`: `morse-settings-num`, `morse-settings-num--wide`, `morse-settings-text-short`, `morse-settings-text-interval` (avoid inline width on settings inputs). Small-viewport layout: `e2e/settings-layout-mobile.spec.ts` (Playwright `mobile-chrome` / Pixel 5).
- Voice Options: sub-controls stay visible and are **disabled** when Voice is off (not hidden). **Arm Recap** presets (`voiceRecap` in JSON → `manualVoice`) lock the Voice master toggle during normal playback; **Speed Racer + Speak** unlocks it and uses automatic recap instead of the manual Voice Recap button.
- **Speed Racer** (Jay; Lesson Options > Timing): multiplier-based per-card speed variations; mutually exclusive with Speed Intervals; no Keep FWPM UI (`speedRacerKeepFwpm` preset key kept for compat only). FWPM: Farnsworth when variation WPM exceeds saved FWPM; when variation WPM is slower, spacing scales down (`min(savedFwpm, variationWpm)`). **Replay at First Multiplier** and **Speak** / **Speak Before Replay** (label follows replay) in Advanced — Speak always enabled with Speed Racer; replay off → speak after last variation; pre-speak pad before recap. Speak/Speak Before Replay ON auto-enables Voice when voiceCapable(); Speak OFF while SR on forces Voice off, clears the voice buffer, and restores lesson voice baseline (`lessonVoiceBaseline` captured on preset load); SR OFF restores baseline only. **Speak is the sole SR speech gate** — SR + Speak off = morse-only (no recap, no voice trail). `speakSpeedRacerRecap` uses Voice Options when Speak and Voice are both on; Spell-on recap uses one TTS utterance of period-paced letters via `formatSpelledRecapPhrase` (e.g. `R. E. R.` — plain `r e r` is often rushed on some engines), Voice pre/post once around recap; in-flight recap cancels via `EasySpeech.cancel` (`cancelSpeech`) on pause/stop or Voice-off. **Voice First** (`speakFirst`) is normal-playback only — bypassed during Speed Racer. Preset keys: `speedRacerEnabled`, `speedRacerMultipliers`, `speedRacerFinalPlay`, `speedRacerSpeakBeforeReplay`, `speedRacerKeepFwpm` (Overlearn = multipliers `1.348, 1.174, 1.0` + replay/speak off). Four **Speed Racer Overlearn** presets (`POL_*_SR.json`; display names swap leading **Overlearn** for **Speed Racer**) set **`voiceEnabled` false** and explicit **`speedRacerSpeakBeforeReplay` false** (legacymixin injects speak true if key missing). Repeat wordspaces in `cardBufferManager` go between repeats only (no trailing gap). Legacy defaults via `legacymixin.json`. When enabled, skip Trail; exclude from `playEnded` trail delays. Mobile CSS: `speed-racer-*`; E2E in `e2e/settings-layout-mobile.spec.ts`. **Doc:** [docs/SPEED_RACER.md](docs/SPEED_RACER.md).
- Architecture and build flow for humans/agents: `docs/DEVELOPER_GUIDE.md` (Mermaid diagrams in `docs/`).

## Cursor Cloud specific instructions

Client-side static web app only (Knockout.js + Bootstrap + Webpack); no backend, DB, or external services. Node 22 / npm work fine. Standard commands live in `README.md` and `package.json` scripts — use those (`npm run dev`, `npm test`, `npm run build`, `npm run test:e2e`); don't duplicate them here.

- **`npm run dev` requires `webpack-cli` v5.** `webpack-cli` v4 crashes `webpack serve` against `webpack-dev-server` v5 with `Invalid options object ... _assetEmittingPreviousFiles`. The dependency bump is on branch `cursor/fix-dev-server-webpack-cli-9b7a` (PR #264); until it lands, run `npm i -D webpack-cli@^5.1.4` before `npm run dev`. `npm run build` is unaffected either way.
- **Run `npm run prebuild` on a fresh checkout** before `npm run dev` (generates gitignored lesson/preset finder maps). `npm test`/`npm run build` invoke it automatically. Re-run after adding/removing files under `src/wordfiles/`, `src/presets/configs/`, or `src/presets/sets/`. Note: `src/morse/morsePresetSetFinder.js` is tracked but regenerated by prebuild — don't commit its churn.
- **Dev server and E2E both use port 3000.** `npm run dev` serves the app; `npm run test:e2e` auto-starts `npx serve dist -l 3000` (and reuses an existing server locally). Stop the dev server before running E2E, or expect a port clash. E2E also needs a built `dist/` (`npm run build`) and `npx playwright install chromium`.
- **No speech-synthesis engine in the headless VM.** Voice/TTS recap throws a non-blocking `SpeechSynthesisErrorEvent` overlay on Play (dismiss with `Esc`); core Morse card generation, audio, timer, and card rendering all work. This is an environment limitation, not an app bug — don't chase it.
