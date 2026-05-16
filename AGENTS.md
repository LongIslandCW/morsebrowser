# AGENTS.md — Long Island CW Morse Browser (rdreed21 fork)

Persistent context for AI agents working in **rdreed21/morsebrowser_dev**. Read this before exploring the repo from scratch.

## Fork identity

| Item | Value |
|------|--------|
| **Fork (origin)** | https://github.com/rdreed21/morsebrowser_dev |
| **Upstream** | https://github.com/LongIslandCW/morsebrowser |
| **Published app (upstream Pages)** | https://longislandcw.github.io/morsebrowser/index.html |
| **App type** | Client-only Morse practice SPA — no backend |
| **Stack** | Knockout.js, Bootstrap 5, TypeScript/JS, Webpack 5, morse-pro (vendored in `src/morse-pro/`) |
| **Philosophy** | Ham-tinkerer-friendly: avoid heavy frameworks; prefer Knockout + readable structure |

### Remotes

```
origin   → rdreed21/morsebrowser_dev.git   (fork: push PRs here)
upstream → LongIslandCW/morsebrowser.git   (sync club upstream)
```

### Branch workflow (fork)

- **Integrate on `develop`** — create feature branches from `origin/develop`, open PRs **into `develop`**.
- **`main`** — default on GitHub (`origin/HEAD`); often behind `develop`; not the day-to-day integration branch for fork work.
- **Do not assume `main` is the PR base** unless the user explicitly says so.

### Worktree note

This repo may be checked out as a **linked worktree** (e.g. `~/.cursor/worktrees/morsebrowser_dev/frcp` → main clone at `~/Documents/GitHub/morsebrowser_dev`). All worktrees share one `.git`; branch checkout is per-worktree.

---

## Key commands

| Task | Command |
|------|---------|
| Install deps | `npm install` (Node **18** recommended) |
| Dev server (port 3000) | `npm run dev` |
| Regenerate lesson/preset finders | `npm run prebuild` |
| Lint | `npx eslint src/` |
| Full build | `npm run build` (= prebuild + webpack + zip + lesson check) |

**No unit/integration test suite** — verify with `eslint` and `npm run build`.

**Prebuild:** `npm run dev` does **not** run prebuild. After changing lesson/preset catalogs, run `npm run prebuild` (or full build) before dev.

**RSS feature:** optional CORS proxy at `http://127.0.0.1:8085/` — not in repo; everything else works without it.

---

## Architecture map

```
src/index.js
  └─ MorseViewModel (src/morse/morse.ts)     ← root Knockout VM
       ├─ template.html (data-bind UI)       ← single-page layout, accordions
       ├─ MorseSettings                      ← speed, misc, frequency
       ├─ MorseLessonPlugin                  ← LICW Lessons panel logic
       │    └─ morseLessonFinder.js         ← GENERATED → src/wordfiles/*
       ├─ Presets                            ← morsePresetFinder.js / morsePresetSetFinder.js (generated)
       ├─ MorseWordPlayer                    ← playback, WAV, noise
       ├─ MorseCookies + licwdefaults.json  ← persistence
       └─ KO components                      ← noise/rss/flagged words accordions, morseImage
webpack → dist/  (gitignored)
```

### Entry points

| File | Role |
|------|------|
| `src/index.js` | Webpack entry; imports CSS, binds `MorseViewModel` |
| `src/template.html` | Full UI shell → `dist/index.html` |
| `src/morse/morse.ts` | Root view model (~900+ lines): play/pause, cards, settings, URL params |
| `webpack.config.js` | Build/dev; watches `template.html` |

### Prebuild generators (repo root)

| Script | Generates |
|--------|-----------|
| `prebuildLessons.js` | `src/morse/morseLessonFinder.js` from `morseLessonFinderTemplate.js` + `src/wordfiles/` |
| `prebuildPresets.js` | `src/morse/morsePresetFinder.js` from preset configs |
| `prebuildPresetSets.js` | `src/morse/morsePresetSetFinder.js` from `src/presets/sets/` |

Edit **templates** and **source JSON/txt**, not generated finders (unless fixing the generator).

---

## UI organization (`src/template.html`)

Single page, vertical sections + Bootstrap accordions (not separate routes).

| Section | Accordion / area | Contents |
|---------|------------------|----------|
| Top bar | always visible | WPM, FWPM, volume |
| Working text | always visible | Textarea, Clear, Insert File |
| **LICW Lessons** | default open | Type, class, letter group, lesson, presets, Custom Group, Keep Lines, overrides, Apply |
| **Settings** | collapsed | Randomize, Auto Close, Sticky Sets, Trail, Cards, Audio File |
| **Audio & Timing** | collapsed | Dit/Dah, Pre, Word Space, Card Wait, Card Size, Zero Beat |
| **More Settings** | collapsed | Speed Intervals, Expert (voice, repeats, noise), etc. |
| Flagged cards | component | `flaggedwordsaccordion` |
| Playback | toolbar | Play, Pause, Stop, Reveal, Shuffle, Loop (Back 1 / Full RW / Fwd 1 removed from toolbar; keyboard shortcuts may still exist) |
| Cards grid | conditional | Shown when `cardsVisible` |

**Recent fork work:** branch `reorganize-settings-panels` implements the Settings / Audio & Timing split per club feedback (Tom’s settings email).

### Knockout bindings cheat sheet

- Lessons: `lessons.*` (`morseLessonPlugin.ts`)
- Speed/frequency/misc: `settings.speed.*`, `settings.frequency.*`, `settings.misc.*`
- Playback/cards: root `MorseViewModel` observables (`cardsVisible`, `trailReveal`, `preSpace`, `cardSpace`, etc.)
- Images: `morseLoadImages().getSrc('gearImage')` or `id="gearImage"` for static loads

---

## Data layout

| Path | Purpose |
|------|---------|
| `src/wordfiles/` | Lesson content (`.txt`, `.json`) — hundreds of files |
| `src/wordfilesconfigs/wordlists.json` | Index: maps UI selectors → `fileName` |
| `src/presets/config.json` | Class → default preset set |
| `src/presets/configs/*.json` | Per-lesson preset bundles |
| `src/presets/sets/*.json` | Preset set groupings |
| `src/configs/licwdefaults.json` | Startup defaults when no cookie |
| `src/configs/wordify.json` | Character → spoken word (voice) |

---

## Settings & persistence

1. **`licwdefaults.json`** applied only where no cookie exists (`loadDefaultsAndCookieSettings` in `morse.ts`).
2. **`js-cookie`** via `MorseCookies` + `saveCookie` KO extender (`src/morse/koextenders/morseExtenders.ts`).
3. **Save/Load** buttons export/import JSON via `MorseSettingsHandler` (`src/morse/settings/morseSettingsHandler.ts`).
4. **Cookie handlers** (`ICookieHandler`): lesson plugin, speed/misc/frequency settings, voice, RSS.

**Query params** in `morse.ts` / lesson plugin: `adminMode`, `rssEnabled`, `noiseEnabled`, `voiceEnabled`, etc.

---

## Key modules (`src/morse/`)

| Path | Role |
|------|------|
| `morse.ts` | Root view model |
| `lessons/morseLessonPlugin.ts` | Lesson UI, presets, custom group, auto-close accordion |
| `settings/` | `MorseSettings`, handlers, speed/frequency/misc |
| `player/morseWordPlayer.ts` | Audio playback |
| `player/soundmakers/` | Smoothed vs WAV, noise |
| `player/wav/` | Morse → WAV buffer |
| `images/morseLoadImages.ts` | Bootstrap icons + logo; register new accordion icons here |
| `voice/MorseVoice.ts` | TTS / speak-first |
| `rss/morseRssPlugin.ts` | Headlines (proxy) |
| `flaggedWords/flaggedWords.ts` | Flagged practice words |
| `shortcutKeys/morseShortcutKeys.ts` | Keyboard shortcuts |
| `cookies/morseCookies.ts` | Cookie load/save orchestration |
| `components/*/` | KO components (template + TS, registered in `morse.ts`) |

**Component pattern:** `*Template.html` + TS class → `ko.components.register(name, { viewModel, template })`.

---

## Files agents should NOT commit

| Avoid | Reason |
|-------|--------|
| `dist/`, `node_modules/`, `morse.zip` | Build output / deps (gitignored) |
| `src/morse/morseLessonFinder.js`, `morsePresetFinder.js` | Generated (gitignored) — regen via prebuild |
| `src/morse/morsePresetSetFinder.js` | Generated but **tracked** — don’t commit drive-by prebuild diffs |
| `package-lock.json` | Only when intentionally changing dependencies |
| `.cursor/` | Local Cursor state |
| Unrelated prebuild churn | e.g. preset set list changes when only editing UI |

**Safe to commit:** `template.html`, `morse.ts`, settings/lesson TS, `wordfiles/`, `presets/configs/`, `wordlists.json`, `AGENTS.md`, generator templates.

---

## Upstreaming to LICW

When club-ready changes should reach the main project:

1. Merge/rebase fork `develop` with `upstream/develop` as needed.
2. PR from fork to **LongIslandCW/morsebrowser** (coordinate with maintainers).
3. Keep fork-specific docs/branches clearly labeled.

---

## Active fork branches (update as work progresses)

| Branch | Purpose | Base |
|--------|---------|------|
| `develop` | Integration | — |
| `reorganize-settings-panels` | Settings UI split (Settings + Audio & Timing) | `develop` |
| `cursor/5e3df0f0` | Earlier attempt (superseded by above) | `develop` |

---

## Agent checklist for typical tasks

**UI change in lessons/settings:**
1. Edit `src/template.html` and/or `src/morse/lessons/morseLessonPlugin.ts` or `morse.ts`
2. New icon? Add to `morseLoadImages.ts`
3. `npx eslint src/` → `npm run build` or manual smoke on `npm run dev`

**New lesson file:**
1. Add file under `src/wordfiles/`
2. Add entry in `src/wordfilesconfigs/wordlists.json`
3. `npm run prebuild` → build

**New preset:**
1. Add JSON under `src/presets/configs/` or sets
2. `npm run prebuild` → build

**Git:**
- Branch from `origin/develop`
- PR target: `develop` on `rdreed21/morsebrowser_dev`
- Exclude generated/noise files from commits unless the task requires them
