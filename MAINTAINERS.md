# Maintainers Guide

Current guide for maintaining the LICW Morse Practice Page in this fork.

## Snapshot

| Item | Current value |
|------|---------------|
| App footer | Version 2.0 |
| Primary branch for fork work | `develop` |
| Fork hosting | Cloudflare Workers, worker `morsebrowserdev` |
| Club production hosting | GitHub Pages from `LongIslandCW/morsebrowser` |
| UI stack | Knockout 3.5, Bootstrap 5, TypeScript, Webpack 5 |
| Unit/integration tests | Vitest |
| Browser tests | Playwright |
| Accessibility test helper | `@axe-core/playwright` |
| Persistence | Browser cookies via `js-cookie` and `MorseCookies` |

## Routine Commands

```bash
npm install
npm run dev          # webpack dev server, http://localhost:3000
npm test             # Vitest
npm run build        # prebuild + webpack + postbuild zip/checklessons
npm run test:e2e     # Playwright, serves dist/
npm run test:all     # unit + build + E2E
npm run deploy       # Cloudflare Workers deploy for this fork
```

After adding or removing files under `src/wordfiles/`, `src/presets/configs/`, or `src/presets/sets/`, run `npm run prebuild` or `npm run build`.

## Source Map

| Area | Start here |
|------|------------|
| Main HTML and accessible labels | `src/template.html` |
| App entry | `src/index.js` |
| Root state and playback orchestration | `src/morse/morse.ts` |
| Lesson dropdowns and Tom deep links | `src/morse/lessons/morseLessonPlugin.ts` |
| Settings models | `src/morse/settings/` |
| Tone timing and WPM/FWPM math | `src/morse/timing/`, `src/morse/player/wav/` |
| Audio playback | `src/morse/player/` |
| Voice/TTS | `src/morse/voice/MorseVoice.ts` |
| Keyboard shortcuts | `src/morse/shortcutKeys/morseShortcutKeys.ts` |
| Cookies/default loading | `src/morse/cookies/morseCookies.ts`, `src/configs/licwdefaults.json` |
| Dark mode | `src/morse/theme/theme.ts`, `src/css/dark-mode.css` |
| CSS layout and field widths | `src/css/style.css` |
| Knockout components | `src/morse/components/` |
| Lessons | `src/wordfiles/`, `src/wordfilesconfigs/wordlists.json` |
| Presets | `src/presets/` |
| Tests | `tests/`, `e2e/` |

## UI Layout

Current top-level order in `src/template.html`:

1. Header: logo, title, help link, dark-mode toggle
2. Basic speed settings: Character Speed, Effective Speed, volume
3. Settings accordions:
   - LICW Lessons, expanded by default
   - Lesson Options
   - Voice Options
   - Tone Options
   - Input Options
   - Output Options
   - Optional RSS
   - Optional Noise
4. Working text stats
5. Playback controls
6. Cards
7. Footer help, keyboard shortcuts, credits, legal notice
8. Screen-reader status live region

Lesson Options fieldsets are Overrides, Playback, Timing, and Trail. Trail is last and is inactive during Speed Racer.

Fresh Play collapses open settings accordions and scrolls playback controls into view. Resume does not.

## Accessibility Expectations

Screen-reader-facing copy should be concise, natural, and useful. Avoid implementation terms in labels and live announcements. Keep rapidly changing stats such as timers out of live regions.

Important patterns:

- One polite live region bound to `accessibilityAnnouncement()`.
- Keyboard shortcuts have a hidden spoken guide in the footer.
- Visible labels can remain terse when `aria-label` or `aria-describedby` gives the screen-reader user better context.
- Component templates need meaningful labels too, especially RSS, Noise, and Flagged cards.

Run:

```bash
npm run build
npx playwright test e2e/accessibility.spec.ts
```

## Shortcuts

Registered shortcuts currently use `keypress` and are ignored when focus is in an input or textarea.

| Key | Action |
|-----|--------|
| `p` | Play / toggle pause |
| `s` | Stop and rewind |
| `,` | Back one card |
| `<` | Full rewind |
| `.` | Forward one card |
| `f` | Flag current card |
| `c` | Reveal or hide card text |
| `/` | Shuffle or unshuffle |
| `l` | Toggle loop mode |
| `z` | Reduce effective speed |
| `x` | Increase effective speed |

Update the spoken shortcut map in `MorseViewModel.keyboardShortcutScript` when adding a shortcut.

## Lessons And Presets

Lesson catalog:

- `src/wordfilesconfigs/wordlists.json` drives TYPE / CLASS / CONTENT / LESSON.
- `src/wordfiles/` contains the referenced lesson content.

Preset catalog:

- `src/presets/config.json` maps classes and default sets.
- `src/presets/sets/*.json` list preset config files.
- `src/presets/configs/*.json` contain actual settings snapshots.
- `src/presets/overrides/presetoverrides.json` applies targeted overrides.
- `src/presets/legacymixin/legacymixin.json` fills compatibility defaults for older presets.

Generated finder files are intentionally rebuilt by the prebuild scripts and are not the source of truth.

## Speed Racer

Speed Racer lives under Lesson Options > Timing. It is mutually exclusive with Speed Intervals and uses per-card speed steps instead of normal repeats. The compatibility key `speedRacerKeepFwpm` remains in settings/presets, but there is no UI for it.

See [docs/SPEED_RACER.md](docs/SPEED_RACER.md) for preset keys, Overlearn presets, and Tom-style deep links.

## Deployment

Club production:

- Repo: `LongIslandCW/morsebrowser`
- Site: https://longislandcw.github.io/morsebrowser/index.html
- Hosting: GitHub Pages

This fork:

- Repo: `rdreed21/morsebrowser_dev`
- Config: `wrangler.jsonc`
- Worker: `morsebrowserdev`
- Deploy: `npm run build` then `npm run deploy`

`develop2.yml` and `main2.yml` still include legacy Pages deployment steps, but Cloudflare Workers is the active fork hosting path.

## Maintainer Checklist

Before a PR:

```bash
npm test
npm run build
npm run test:e2e
```

For UI layout or accessibility changes, include:

```bash
npx playwright test e2e/accessibility.spec.ts
npx playwright test e2e/settings-layout-mobile.spec.ts
```

For preset or lesson file changes, inspect the `npm run build` `checklessons.js` warnings and confirm they are expected.
