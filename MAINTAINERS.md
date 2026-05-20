# Maintainers Guide — LICW Morse Practice Page

**Version:** 1.13  
**Stack:** Knockout.js · Bootstrap 5 · TypeScript · Webpack 5 · Cloudflare Workers  
**Repo:** https://github.com/LongIslandCW/morsebrowser

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Quick Start](#2-quick-start)
3. [Repository Structure](#3-repository-structure)
4. [Root-Level Config Files](#4-root-level-config-files)
5. [Build Scripts](#5-build-scripts)
6. [Source Directory (`src/`)](#6-source-directory-src)
   - [Entry Point](#61-entry-point)
   - [HTML Template](#62-html-template)
   - [CSS](#63-css)
   - [Main ViewModel (`morse.ts`)](#64-main-viewmodel-morsests)
   - [Lessons Plugin](#65-lessons-plugin)
   - [Settings](#66-settings)
   - [Voice / TTS](#67-voice--tts)
   - [Audio Player](#68-audio-player)
   - [morse-pro Library](#69-morse-pro-library)
   - [Utilities](#610-utilities)
   - [Cookies / Persistence](#611-cookies--persistence)
   - [Keyboard Shortcuts](#612-keyboard-shortcuts)
   - [Knockout Components](#613-knockout-components)
   - [Images](#614-images)
   - [Flagged Words](#615-flagged-words)
   - [Knockout Extenders](#616-knockout-extenders)
7. [Data & Configuration Files](#7-data--configuration-files)
   - [wordlists.json](#71-wordlistsjson)
   - [licwdefaults.json](#72-licwdefaultsjson)
   - [wordify.json](#73-wordifyjson)
   - [Wordfiles (`src/wordfiles/`)](#74-wordfiles-srcwordfiles)
   - [Presets (`src/presets/`)](#75-presets-srcpresets)
8. [Assets](#8-assets)
9. [GitHub Workflows (CI/CD)](#9-github-workflows-cicd)
10. [Architecture Overview](#10-architecture-overview)
11. [Build Pipeline](#11-build-pipeline)
12. [Deployment](#12-deployment)
13. [Adding / Changing Things](#13-adding--changing-things)

---

## 1. Project Overview

This is the **Long Island CW Club Morse Practice Page** — a browser-based morse code trainer. It:

- Generates morse code audio in the browser using the Web Audio API
- Supports structured LICW lessons with letter groups, classes, and presets
- Displays interactive word/character cards with reveal/hide support
- Integrates optional text-to-speech (voice recap after each word)
- Supports background noise mixing (white/pink/brown noise)
- Persists all settings to `localStorage`
- Can download a standalone offline ZIP of itself

**Framework choices:**
- **Knockout.js** — MVVM, two-way data binding (no React/Vue/Angular)
- **Bootstrap 5** — Grid, form controls, accordion, buttons
- **TypeScript** — Most new source files; older files are JS
- **Webpack 5** — Bundler; all imports (CSS, images, `.txt` files) go through webpack

---

## 2. Quick Start

```bash
npm ci             # Install exact locked dependencies
npm run build      # Full production build → dist/
npm run dev        # Dev server at http://localhost:3000 with HMR
```

The `build` command runs three phases automatically:

```
prebuild → webpack → postbuild
```

See [§5 Build Scripts](#5-build-scripts) for details.

---

## 3. Repository Structure

```
morsebrowser_dev/
├── .babelrc                    Babel config (ES2020 transpilation)
├── .eslintignore               ESLint ignore list
├── .eslintrc.json              ESLint rules
├── .github/
│   └── workflows/              CI/CD pipeline definitions
├── .gitignore
├── .nojekyll                   Prevents GitHub Pages from treating this as Jekyll
├── checklessons.js             Post-build: validates lesson file consistency
├── custom.d.ts                 TypeScript declarations for non-TS imports
├── fixconfigs.js               One-off utility: adds new fields to preset JSONs
├── ignore_01132006.txt         Developer notes / scratch file
├── junk.txt                    Scratch file
├── newLineFix.js               Utility: sets newlineChunking in wordlists.json
├── package.json                NPM manifest, scripts, dependencies
├── package-lock.json           Locked dependency tree
├── prebuildLessons.js          Pre-build: generates morseLessonFinder.js
├── prebuildPresets.js          Pre-build: generates morsePresetFinder.js
├── prebuildPresetSets.js       Pre-build: generates morsePresetSetFinder.js
├── README.md                   End-user readme
├── src/
│   ├── assets/                 Static images (logo, favicon)
│   ├── configs/                App-wide JSON configs
│   ├── css/
│   │   └── style.css           Custom CSS (Bootstrap overrides + extras)
│   ├── easyspeech/
│   │   └── easyspeech.js       EasySpeech library (Web Speech API wrapper)
│   ├── index.js                Webpack entry point
│   ├── morse/                  Main application source
│   │   ├── components/         Knockout UI components
│   │   ├── cookies/            localStorage persistence
│   │   ├── flaggedWords/       Flagged cards feature
│   │   ├── images/             Icon loader
│   │   ├── koextenders/        Knockout custom extenders
│   │   ├── lessons/            Lesson selection plugin
│   │   ├── player/             Audio playback engine
│   │   ├── settings/           Settings model
│   │   ├── shortcutKeys/       Keyboard shortcut bindings
│   │   ├── utils/              String/word utilities
│   │   ├── voice/              Text-to-speech integration
│   │   └── morse.ts            Main ViewModel (application root)
│   ├── morse-pro/              Morse code library (SG Phillips fork)
│   ├── presets/                Settings preset JSON files
│   ├── template.html           HTML template (processed by HtmlWebpackPlugin)
│   ├── wordfiles/              Lesson content files (.json / .txt)
│   └── wordfilesconfigs/
│       └── wordlists.json      Master lesson catalog
├── srd/                        Legacy/scratch directory (not built)
├── tsconfig.json               TypeScript compiler options
├── webpack.config.js           Webpack 5 configuration
├── wrangler.jsonc              Cloudflare Workers deploy config
└── zipdist.js                  Post-build: zips dist/ for offline download
```

---

## 4. Root-Level Config Files

### `webpack.config.js`

The single Webpack config used for both `dev` and `build`. Key decisions:

| Setting | Value | Notes |
|---|---|---|
| `mode` | `development` | No minification. Change to `production` for optimized output. |
| `entry` | `src/index.js` | Single entry point |
| `output.filename` | `[name][contenthash].js` | Cache-busting hashes |
| `output.path` | `dist/` | Build output |
| `output.clean` | `true` | Wipes `dist/` before each build |
| `devtool` | `inline-source-map` | Source maps embedded in bundle |
| `devServer.port` | `3000` | Hot-reloading dev server |

**Plugins:**

| Plugin | What it does |
|---|---|
| `HtmlWebpackPlugin` | Generates `dist/index.html` from `src/template.html`; auto-injects the bundle `<script>` and favicon |
| `MiniCssExtractPlugin` | Extracts all CSS (including Bootstrap) to a separate `[name].[contenthash].css` file |
| `webpack.ProvidePlugin` | Shims `process` and `Buffer` globally (needed by Node-targeting libraries) |
| `ESLintPlugin` | Runs ESLint on every build (fails build on lint errors) |

**Loaders:**

| File type | Loader chain | Result |
|---|---|---|
| `.css` | `MiniCssExtractPlugin.loader` + `css-loader` | Extracted to separate CSS file |
| `.js` | `babel-loader` | Transpiled to ES2020 |
| `.ts`, `.tsx` | `ts-loader` | Compiled TypeScript |
| `.html` | `html-loader` | Bundled as strings (for Knockout component templates) |
| Images | `asset/resource` | Emitted as files, referenced by URL |
| `.txt` | `asset/source` | Inlined as raw strings (used for wordfiles) |

**Node polyfills** (`resolve.fallback`): `stream`, `http`, `https`, `string_decoder`, `timers`, `url`, `buffer`, `os` — required because `rss-parser` and `xml2js` use Node built-ins.

---

### `package.json`

**Scripts:**

| Script | Command | Description |
|---|---|---|
| `prebuild` | node scripts | Runs before `build` automatically |
| `build` | `webpack` | Bundles everything to `dist/` |
| `postbuild` | node scripts | Runs after `build` automatically |
| `dev` | `webpack serve` | Dev server with HMR |
| `deploy` | `wrangler deploy` | Deploy to Cloudflare Workers |
| `preview` | `wrangler dev` | Local Cloudflare Workers preview |

**Key runtime dependencies:**

| Package | Version | Purpose |
|---|---|---|
| `knockout` | ^3.5.1 | MVVM framework |
| `bootstrap` | ^5.1.3 | UI component library |
| `@popperjs/core` | ^2.11.4 | Bootstrap tooltip/popover positioning |
| `bootstrap-icons` | ^1.8.1 | SVG icon set |
| `easy-speech` | ^2.3.1 | Cross-browser Web Speech API |
| `rss-parser` | ^3.12.0 | RSS feed fetching |
| `xml2js` | ^0.4.23 | XML→JSON for RSS |
| `js-cookie` | ^3.0.1 | Cookie utilities |
| `audiobuffer-to-wav` | ^1.0.0 | WAV file export |
| `brown-noise-node` | ^1.0.0 | Brown noise audio node |
| `pink-noise-node` | ^1.1.1 | Pink noise audio node |
| `white-noise-node` | ^1.1.1 | White noise audio node |
| `zip-a-folder` | ^1.1.3 | ZIP packaging |

---

### `tsconfig.json`

TypeScript compiler options:

| Option | Value | Notes |
|---|---|---|
| `target` | `ES2020` | Output JS version |
| `module` | `ES2020` | Module format |
| `sourceMap` | `true` | Source maps for debugging |
| `resolveJsonModule` | `true` | Allows `import config from './foo.json'` |
| `allowJs` | `true` | TypeScript can import plain `.js` files |

---

### `.babelrc`

Uses `@babel/preset-env` with no special targets — transpiles to broadly compatible JS. Applied to `.js` files only (`.ts` files go through `ts-loader` instead).

---

### `.eslintrc.json`

Extends `eslint-config-standard` with TypeScript plugin support. Applied during every webpack build via `ESLintPlugin`. The `.eslintignore` file excludes generated files and `node_modules`.

---

### `wrangler.jsonc`

Cloudflare Workers config for the `wrangler deploy` / `wrangler dev` scripts:

- **Project name:** `morsebrowser`
- **Assets directory:** `dist/` (serves the built app as static assets)
- **Node.js compatibility:** enabled (for polyfill support)

---

### `custom.d.ts`

TypeScript ambient declarations for file types that webpack handles but TypeScript doesn't know about natively (`.txt`, `.json`, image files, etc.). Without this, `import` statements for those types would cause TS errors.

---

## 5. Build Scripts

These are plain Node.js scripts (no dependencies beyond Node built-ins) that run as `prebuild`/`postbuild` hooks.

### `prebuildLessons.js`

**When it runs:** Automatically before `npm run build`

**What it does:**
1. Scans `src/wordfiles/` for all lesson files
2. Reads a template file (`src/morse/morseLessonFinderTemplate.js`)
3. Replaces a `"dummy"` placeholder with the actual list of filenames
4. Writes the result to `src/morse/morseLessonFinder.js`

**Why this exists:** Webpack needs static `import()` calls to bundle dynamic files. The generated file contains one dynamic `import()` per lesson file, which lets Webpack tree-shake unused lessons and code-split them.

**If you add a new wordfile:** Just place it in `src/wordfiles/` and re-run the build — this script picks it up automatically.

---

### `prebuildPresets.js`

**When it runs:** Automatically before `npm run build`

**What it does:** Same pattern as `prebuildLessons.js`, but for `src/presets/configs/`. Generates `src/morse/morsePresetFinder.js`.

**If you add a new preset config file:** Place it in `src/presets/configs/` — auto-discovered on next build.

---

### `prebuildPresetSets.js`

**When it runs:** Automatically before `npm run build`

**What it does:** Same pattern, for `src/presets/sets/`. Generates `src/morse/morsePresetSetFinder.js`.

---

### `zipdist.js`

**When it runs:** Automatically after `npm run build`

**What it does:** Zips the entire `dist/` directory and writes it to `dist/download/morse.zip`. Users can download this ZIP and run the app offline by opening `index.html` locally.

The zip is done in two steps (zip into a temp location first, then move) to avoid trying to zip a folder while writing into it.

---

### `checklessons.js`

**When it runs:** Automatically after `npm run build`

**What it does:** Cross-checks that every lesson file in `src/wordfiles/` is referenced in `src/wordfilesconfigs/wordlists.json` and vice versa. Prints warnings for any mismatches. This is a quality gate to catch typos in filenames or forgotten entries in the catalog.

---

### `fixconfigs.js` *(maintenance utility — not part of normal build)*

**Run manually when needed.** Adds new settings keys to all existing preset JSON files in `src/presets/configs/`. Used when a new setting is added to the app and existing presets need to be updated to include a default value for it. Edit the keys/values inside the script before running.

---

### `newLineFix.js` *(maintenance utility — not part of normal build)*

**Run manually when needed.** Reads `wordlists.json` and sets the `newlineChunking` field automatically based on class name (e.g., ICR classes get `true`). Run this if you add many lesson entries and need to bulk-set the newline chunking flag.

---

## 6. Source Directory (`src/`)

### 6.1 Entry Point

#### `src/index.js`

The Webpack entry file. Does three things only:

```javascript
import 'bootstrap/dist/css/bootstrap.min.css'   // Bootstrap CSS → extracted to bundle CSS
import { Tooltip, Toast, Popover } from 'bootstrap' // Bootstrap JS (needed for accordion)
import './css/style.css'                          // Custom CSS
import { MorseViewModel } from './morse/morse.ts' // Main app

ko.applyBindings(new MorseViewModel())           // Start Knockout
```

Everything else in the app flows through `MorseViewModel`.

---

### 6.2 HTML Template

#### `src/template.html`

The HTML template processed by `HtmlWebpackPlugin`. Webpack injects the `<script>` and `<link>` tags for the bundle automatically. The final output is `dist/index.html`.

**Page sections (top to bottom):**

| Section | HTML landmark | Description |
|---|---|---|
| Analytics | `<head>` scripts | Google Analytics + Google Tag Manager |
| Header | `<header>` | Logo, title, contributors, version info, beta warning |
| Basic Settings | `<section>` | WPM, FWPM, Volume controls |
| Working Text | `<section>` | Main textarea, show/hide toggle, timer, char count, file load |
| Accordion | `<section id="accordionArea">` | Lessons, More Settings, RSS, Noise, Flagged Words |
| Playback Controls | `<section class="btn-toolbar">` | Play/Pause/Stop/Rewind/Forward/Loop/Shuffle/Reveal |
| Cards Area | `<section aria-label="Cards">` | Word cards grid (conditionally rendered) |
| Keyboard Shortcuts | `<details>` | Expandable shortcut reference table |
| SR Status | `<status>` | Screen reader live region for accessibility announcements |

**All interactivity** is driven by Knockout `data-bind` attributes — there is no inline JavaScript in the template (except Google Analytics).

**Knockout components used in template:**
- `<simpleimage>` — icon display
- `<noiseaccordion>` — noise settings accordion panel
- `<rssaccordion>` — RSS settings accordion panel
- `<flaggedwordsaccordion>` — flagged words panel

---

### 6.3 CSS

#### `src/css/style.css`

Minimal custom CSS — Bootstrap handles almost everything. What it adds:

| Rule | Purpose |
|---|---|
| `simpleimage { display: contents }` | Makes the custom `<simpleimage>` element layout-transparent |
| `noiseaccordion { display: contents }` | Same for `<noiseaccordion>` |
| `.sr-only` | Visually hides elements while keeping them accessible to screen readers |
| `section:last-of-type` | Adds bottom padding so content isn't flush with page edge |
| `#contributor-info` | Heading-style font size for the credits span |
| `#credits-and-info > span` | Block-level display, consistent spacing for info spans |
| `#keyboard-shortcuts table` | Blue header row, padded cells, right-aligned key column |
| `@media (min-width: 1200px)` | Locks font sizes on large screens (overrides fluid calc values) |

---

### 6.4 Main ViewModel (`morse.ts`)

#### `src/morse/morse.ts`

**This is the application root.** It is a large Knockout ViewModel (~1,200+ lines) that wires together every subsystem.

**What it owns:**

| Category | Observables / Properties |
|---|---|
| Text state | `textBuffer`, `rawText`, `showingText`, `showRaw` |
| Playback state | `playerPlaying`, `isPaused`, `currentIndex`, `loop`, `loopnoshuffle` |
| Card state | `words` (computed), `hideList`, `cardsVisible`, `trailReveal`, `maxRevealedTrail` |
| Timing | `playingTime`, `preSpace`, `xtraWordSpaceDits`, `cardSpace` |
| Audio | `volume`, `numberOfRepeats` |
| UI flags | `showExpertSettings`, `isShuffled`, `cardFontPx`, `noiseEnabled`, `noiseHidden` |
| Subsystems | `settings`, `lessons`, `morseVoice`, `flaggedWords`, `rss` |

**Key methods:**

| Method | Description |
|---|---|
| `doPlay(playJustEnded, fromPlayButton)` | Main playback orchestrator. Handles initial play, looping, voice timing, and card advancement. |
| `doPause(stopAll, fromUI, fromStop)` | Pauses or fully stops playback. `stopAll=true` resets position. |
| `playEnded(fromVoiceOrTrail)` | Callback fired when a word finishes playing. Triggers next word or loop logic. |
| `shuffleWords(fromLoopRestart)` | Shuffles `words` array, preserving phrase group integrity (words in the same group stay together). |
| `setText(s)` | Sets working text and resets playback position. |
| `getMorseStringToWavBufferConfig(text, isToneTest)` | Builds the audio generation config from current settings. |
| `testTone()` | Plays a sustained tone at the current frequency for zero-beat alignment. |
| `setWordIndex(index)` | Jump to a specific card (used by double-click on card). |
| `incrementIndex()`, `decrementIndex()`, `fullRewind()` | Card navigation. |
| `doDownload()` | Generates a WAV file of the current text and triggers browser download. |
| `doApply(fromButton)` | Applies the selected lesson to the working text area. |
| `doClear()` | Clears working text. |
| `saveSettings()` / `settingsFileChange()` | Export/import settings as JSON file. |
| `inputFileChange()` | Load a `.txt` file into the working text area. |

**Constructor initialization order (important for debugging):**
1. Load images module
2. Register Knockout extenders
3. Build `settings` object
4. Initialize `MorseWordPlayer`
5. Initialize `MorseVoice`
6. Load cookie defaults
7. Initialize `MorseLessonPlugin`
8. Initialize `FlaggedWords`
9. Register Knockout components (`simpleimage`, `noiseaccordion`, `rssaccordion`, `flaggedwordsaccordion`)
10. Register keyboard shortcuts
11. Initialize screen wake lock (prevents display sleep during long playback)

---

### 6.5 Lessons Plugin

#### `src/morse/lessons/morseLessonPlugin.ts`

Manages the entire lesson selection UI and logic: the TYPE / CLASS / LETTER GROUP / LESSON / PRESETS columns in the accordion.

**Key observables:**

| Observable | Values | Description |
|---|---|---|
| `userTarget` | `STUDENT`, `INSTRUCTOR` | Top-level curriculum type |
| `selectedClass` | `BC1`, `BC2`, `BC3`, `INT1`–`INT3`, `ADV1`–`ADV3`, `COM`, `OVERLEARN`, `A` | Lesson class |
| `letterGroup` | `REA`, `TIN`, `PSG`, `LCD`, `HOF`, `UWB` | Letter grouping within class |
| `selectedDisplay` | lesson object | The chosen lesson (maps to a wordfile) |
| `selectedSettingsPreset` | preset object | The chosen settings preset |
| `randomizeLessons` | bool | Shuffle lesson words on load |
| `ifStickySets` | bool | Use "sticky" word sets (repeat set until mastered) |
| `stickySets` | number | How many sets to stick |
| `ifOverrideTime` | bool | Override lesson duration |
| `overrideMins` | number | Override duration in minutes |
| `ifOverrideMinMax` | bool | Override word count range |
| `overrideMin`, `overrideMax` | number | Word count override bounds |
| `syncSize` | bool | Lock min=max for size override |
| `autoCloseLessonAccordion` | bool | Auto-collapse accordion after lesson apply |
| `customGroup` | string | Letters for custom group generation |

**Key methods:**

| Method | Description |
|---|---|
| `initializeWordList()` | Loads `wordlists.json`, builds the class/letterGroup/lesson hierarchy |
| `getSettingsPresets(loadCookie, updateSets)` | Loads preset files applicable to the selected class |
| `changeUserTarget(target)` | Switch STUDENT/INSTRUCTOR, cascades to classes |
| `changeSelectedClass(cls, source)` | Select a class, cascades to letter groups and presets |
| `setLetterGroup(lg, source)` | Select a letter group, cascades to lesson list |
| `setDisplaySelected(display, autoApply, source)` | Select a specific lesson |
| `setPresetSelected(preset, autoApply, source)` | Select a settings preset |
| `doCustomGroup()` | Build practice text from the `customGroup` letters |
| `doApply(fromButton)` | Fetch and apply the selected lesson's wordfile to the working text |

**Data sources used:**
- `src/wordfilesconfigs/wordlists.json` — lesson catalog
- Generated `morsePresetFinder.js` — dynamically loads preset configs
- Generated `morsePresetSetFinder.js` — loads preset sets
- `src/presets/overrides/presetoverrides.json` — preset value overrides
- `src/presets/legacymixin/legacymixin.json` — maps old preset names to new ones

---

### 6.6 Settings

#### `src/morse/settings/settings.ts`

Top-level settings container. Composed of three sub-objects:

| Sub-object | File | Controls |
|---|---|---|
| `speed` | `speedSettings.ts` | WPM, FWPM, sync lock, variable speed, speed intervals |
| `frequency` | `frequencySettings.ts` | DIT Hz, DAH Hz, frequency sync lock |
| `misc` | `miscSettings.ts` | Newline chunking, general boolean options |

**Speed settings detail (`speedSettings.ts`):**

| Observable | Description |
|---|---|
| `wpm` | Character speed (words per minute) |
| `fwpm` | Effective (Farnsworth) speed — spacing between characters |
| `syncWpm` | When true, FWPM = WPM (locked together) |
| `speedInterval` | Enable variable speed intervals |
| `intervalTimingsText` | Comma-separated interval durations (seconds) |
| `intervalWpmText` | Comma-separated WPM values per interval |
| `intervalFwpmText` | Comma-separated FWPM values per interval |
| `variableSpeedDisplay` | Readonly display of current speed when intervals are active |
| `vWpm`, `vFwpm` | Current variable speed values (read-only display) |

`getApplicableSpeed(elapsedSeconds)` returns the correct WPM/FWPM for a given playback time when speed intervals are configured.

**Frequency settings detail (`frequencySettings.ts`):**

| Observable | Description |
|---|---|
| `ditFrequency` | DIT tone frequency in Hz (100–1200) |
| `dahFrequency` | DAH tone frequency in Hz (100–1200) |
| `syncFreq` | Lock DIT and DAH to same frequency |

---

### 6.7 Voice / TTS

#### `src/morse/voice/MorseVoice.ts`

Wraps the browser's Web Speech API (via EasySpeech) to speak words before or after morse playback.

**Modes:**
- **Voice First (`speakFirst`)** — Speaks the word, then plays the morse
- **Voice After (default)** — Plays morse, then speaks the word
- **Manual Recap (`manualVoice`)** — User triggers voice replay with the "Voice Recap" button

**Key observables:**

| Observable | Description |
|---|---|
| `voiceEnabled` | Master enable/disable |
| `voiceCapable` | Set to `true` if the browser supports Speech Synthesis |
| `voiceVoices` | Array of available system voices |
| `voiceVoiceIdx` | Selected voice index |
| `voiceVolume` | TTS volume (0–10) |
| `voiceRate` | TTS speed multiplier |
| `voicePitch` | TTS pitch |
| `voiceThinkingTime` | Pause before speaking (seconds) |
| `voiceAfterThinkingTime` | Pause after speaking (seconds) |
| `voiceSpelling` | Spell out word letter-by-letter instead of pronouncing it |
| `voiceLastOnly` | Only speak the last word in a group |
| `voiceBufferMaxLength` | How many words to accumulate in voice buffer before speaking |
| `speakFirstRepeats` | How many times to repeat in speak-first mode |
| `speakFirstAdditionalWordspaces` | Extra word spaces between morse and voice in speak-first mode |

**Key methods:**

| Method | Description |
|---|---|
| `initEasySpeech()` | Initialize speech synthesis (called lazily on "More Settings" open) |
| `speakPhrase(phrase, callback)` | Speak a string, call callback when done |
| `primeThePump()` | Safari requires a user-gesture to unlock speech; call this on first user interaction |
| `queueVoice(word)` | Add word to the voice buffer |
| `flushVoiceBuffer()` | Speak all queued words |

#### `src/easyspeech/easyspeech.js`

Third-party library providing a consistent cross-browser interface to `window.speechSynthesis`. Handles browser quirks (Chrome, Safari, Firefox differences) around voice loading, utterance queuing, and cancel behavior.

---

### 6.8 Audio Player

#### `src/morse/player/morseWordPlayer.ts`

Orchestrates audio generation and playback. Sits between `morse.ts` (which calls `play()`) and the actual audio engine.

**Interface:**
- `play(config, onEnded)` — Generate WAV from morse string, play it
- `pause(callback, killNoise)` — Stop current playback
- `setSoundMaker(smoothing)` — Switch between audio engine implementations

**Sound Maker implementations** (`src/morse/player/soundmakers/`):

| Class | File | Description |
|---|---|---|
| `MorseWavBufferPlayer` | `WavBufferPlayer/morseWavBufferPlayer.ts` | Default. Generates a WAV buffer, decodes it via WebAudio, plays via `AudioBufferSourceNode` |
| `SmoothedSoundsPlayer` | `SmoothedSounds/SmoothedSoundsPlayer.ts` | Experimental. Uses `OscillatorNode` with gain envelope shaping for smoother key clicks |

**`SoundMakerConfig.ts`** — Data class carrying audio parameters:
- Text to encode as morse
- WPM, FWPM
- DIT frequency, DAH frequency
- Volume
- Pre-silence duration
- Extra word spacing
- Noise config
- Repeat count

**`NoiseConfig.ts`** — Data class for noise mixing:
- Noise type (white / pink / brown)
- Noise volume
- SNR settings

---

### 6.9 morse-pro Library

#### `src/morse-pro/`

A local fork of [SG Phillips' morse-pro library](https://github.com/scp93ch/morse-pro), modified for LICW-specific behavior.

**Do not treat these as your own files** — they originated as a third-party library. Minimize changes here to ease future upstream updates.

**LICW modifications include:**
- Separate DIT and DAH pitch frequencies
- Pre-padding timing adjustments
- Custom timing constants for LICW lesson cadence

**Key files:**

| File | Description |
|---|---|
| `morse-pro.js` | Core morse dictionary (dit/dah mappings for all characters) |
| `morse-pro-cw.js` | CW generation — converts text to timing sequences |
| `morse-pro-cw-wave.js` | Waveform generation — converts timing sequences to audio samples |
| `morse-pro-wpm.js` | WPM/timing calculations (Paris standard) |
| `morse-pro-player-waa.js` | WebAudioAPI player (full version) |
| `morse-pro-player-waa-light.js` | WebAudioAPI player (lighter version) |
| `morse-pro-keyer.js` | Iambic keyer support |
| `morse-pro-keyer-iambic.js` | Iambic keyer implementation |
| `morse-pro-listener.js` | Morse reception / decoding |
| `morse-pro-listener-adaptive.js` | Adaptive WPM decoder |
| `morse-pro-decoder.js` | Character decoder |
| `morse-pro-decoder-adaptive.js` | Adaptive decoder |
| `morse-pro-message.js` | Message handling utilities |
| `morse-pro-util-riffwave.js` | RIFF WAV file format writer |
| `morse-pro-util-datauri.js` | Data URI encoding utility |

---

### 6.10 Utilities

#### `src/morse/utils/morseStringUtils.ts`

Static utility class for text processing before audio generation.

**`doReplacements(s: string): string`**  
Sanitizes raw user input for morse compatibility:
- Converts Unicode curly apostrophes → straight apostrophes
- Converts `%` → `pct` (percent signs aren't morse characters)
- Strips characters that have no morse representation
- Preserves `\r\n` pairs (used as phrase delimiters for voice grouping)

**`getWords(s: string, newlineChunking: boolean): WordInfo[]`**  
Splits text into `WordInfo` objects:
- When `newlineChunking=false`: each space-separated token is one word/card
- When `newlineChunking=true`: each line is treated as a single phrase/card

**`wordifyPunctuation(s: string, spellOverridesOnly: boolean): string`**  
Converts punctuation/symbols to their spoken equivalents using `src/configs/wordify.json`:
- Used for the voice component so punctuation is spoken naturally
- E.g., `.` → `dit dit dit`, `@` → `at`, `&` → `and`

---

#### `src/morse/utils/wordInfo.ts`

Represents a single word/phrase card in the UI and playback queue.

**Properties:**

| Property | Description |
|---|---|
| `displayWord` | Text shown on the card button |
| `rawWord` | Original text (may differ from `displayWord` after replacements) |
| `groupId` | Numeric group identifier — words with the same `groupId` are treated as a logical unit during shuffle (kept together) |

The `groupId` mechanism is how multi-word phrases (separated by `\n`) stay grouped when the user shuffles.

---

#### `src/morse/utils/cardBufferManager.ts`

Manages the playback queue state. Tracks which word is next, handles repeats per word, and signals when the buffer is exhausted.

**Key methods:**

| Method | Description |
|---|---|
| `getNextMorse(repeats, additionalWordspaces)` | Returns the next item to play, applying repeat count |
| `hasMoreMorse()` | Returns `true` if there are more words to play |
| `clear()` | Reset queue to beginning |
| `setIndex(i)` | Jump to a specific position |

---

### 6.11 Cookies / Persistence

#### `src/morse/cookies/morseCookies.ts`

All settings are persisted to `localStorage` (despite the class name "cookies").

**`loadCookiesOrDefaults(settingsInfo)`**  
Called on startup. For each registered setting:
1. Tries to read the value from `localStorage`
2. Falls back to the default from `licwdefaults.json`

**`saveCookies(settingsInfo)`**  
Called when settings change. Serializes all registered observables to `localStorage`.

**Registration system:**  
Each subsystem (speed, frequency, lessons, voice, etc.) registers its observables with the cookie manager. This decouples persistence from the ViewModel — subsystems don't need to know about `localStorage` directly.

---

### 6.12 Keyboard Shortcuts

#### `src/morse/shortcutKeys/morseShortcutKeys.ts`

Registers `keydown` event listeners on `document` for keyboard shortcuts. The table of shortcuts is exposed to the ViewModel so it can be displayed in the `<details>` keyboard shortcuts section.

**Default shortcuts include:**
- Space / Enter — Play / Pause toggle
- Escape — Stop
- Arrow Right / Left — Forward 1 / Back 1 card
- Home — Full Rewind
- S — Shuffle
- L — Loop
- R — Reveal toggle
- H — Hide/show cards

The exact binding map is defined inside this file. To add a shortcut: add an entry to the shortcuts array and implement the handler.

---

### 6.13 Knockout Components

These are registered as Knockout components in `morse.ts` and used as custom HTML elements in `template.html`.

#### `src/morse/components/simpleImage/`

A tiny component that renders a Bootstrap icon image. Used throughout the template to display icons next to labels without duplicating the image-loading logic.

**Template:** `simpleImageTemplate.html`  
**Params:** `root` (ViewModel reference), `height`, `width`, `icon` (image key), `labelText` (for accessibility)

---

#### `src/morse/components/noiseAccordion/`

An accordion panel (injected into the main accordion) for configuring background noise mixing.

**Template:** `noiseAccordion.html`  
**Controls:**
- Noise type selector (White / Pink / Brown)
- Noise volume slider
- SNR (signal-to-noise ratio) control

---

#### `src/morse/components/rssAccordion/`

An accordion panel for loading practice text from an RSS feed URL.

**Template:** `rssAccordion.html`  
**Controls:**
- RSS URL input
- Load button
- Feed item selection

---

#### `src/morse/components/flaggedWordsAccordion/`

An accordion panel showing words the user has flagged (by clicking a card button). Allows reviewing and clearing flagged words and loading them as new practice text.

**Template:** `flaggedWordsAccordion.html`

---

### 6.14 Images

#### `src/morse/images/morseLoadImages.ts`

Lazy-loads all Bootstrap SVG icons used in the UI. Returns a lookup object where keys are image names (e.g., `'playImage'`, `'lockImage'`) and values are data URIs or asset URLs.

**Why this exists:** Bootstrap icons are SVGs that need to be imported as assets through Webpack. Rather than scattering individual imports throughout the codebase, all icons are loaded centrally here and accessed via string keys in `data-bind` attributes.

**To add a new icon:**
1. Import the SVG from `bootstrap-icons`
2. Add it to the return object with a descriptive key name
3. Use `morseLoadImages().getSrc('yourKeyName')` in the template

---

### 6.15 Flagged Words

#### `src/morse/flaggedWords/flaggedWords.ts`

Tracks words the user has flagged during a session (by clicking a card button). Provides a textarea in the flagged words accordion showing all flagged words, a count badge, and a clear button.

**Key observable:**
- `flaggedWords` — `ko.observableArray<string>` of flagged word strings

**Key methods:**
- `addFlaggedWord(word)` — Adds a word if not already flagged
- `clearFlaggedWords()` — Empties the list
- `loadFlaggedWords()` — Sets working text to the flagged words list for replay practice

---

### 6.16 Knockout Extenders

#### `src/morse/koextenders/morseExtenders.ts`

Custom Knockout extenders that add behaviors to observables. Applied via `ko.extenders.yourExtender(observable, options)`.

**Extenders defined:**

| Extender | Description |
|---|---|
| `saveCookie` | When the observable changes, auto-writes the new value to `localStorage` under the specified key |
| `numericOrDefault` | Validates that a numeric observable stays within min/max bounds; falls back to default if invalid |
| `classOrLetterGroupChange` | Triggers cascading updates when class or letter group changes (used by the lesson plugin) |

---

## 7. Data & Configuration Files

### 7.1 `src/wordfilesconfigs/wordlists.json`

**The master lesson catalog.** Every lesson available in the UI must have an entry here.

**Entry shape:**

```json
{
  "sort": 1,
  "userTarget": "STUDENT",
  "class": "BC1",
  "letterGroup": "REA",
  "newlineChunking": false,
  "display": "REA Lesson 1",
  "fileName": "SB1REA1.json"
}
```

| Field | Type | Description |
|---|---|---|
| `sort` | number | Display order within its group |
| `userTarget` | string | `"STUDENT"` or `"INSTRUCTOR"` |
| `class` | string | Lesson class (`BC1`, `BC2`, `BC3`, `INT1`–`INT3`, `ADV1`–`ADV3`, `COM`, `OVERLEARN`, `A`) |
| `letterGroup` | string | Letter group (`REA`, `TIN`, `PSG`, `LCD`, `HOF`, `UWB`) |
| `newlineChunking` | boolean | When `true`, each line in the wordfile is one card/phrase |
| `display` | string | Label shown in the LESSON list UI |
| `fileName` | string | Filename in `src/wordfiles/` |

**To add a new lesson:**
1. Create the wordfile in `src/wordfiles/`
2. Add an entry here pointing to it
3. Run `npm run build` (the prebuild scripts validate consistency)

---

### 7.2 `src/configs/licwdefaults.json`

Application startup defaults. These are the values used when a user has never visited before (no `localStorage` data).

**Key defaults:**

| Setting | Default | Notes |
|---|---|---|
| Initial text | `{CQ|c q} {LICW|l i c w}` | Curly-brace syntax means alternates (pick one randomly) |
| `wpm` | `12` | Character speed |
| `fwpm` | `12` | Farnsworth speed |
| `ditFrequency` | `500` | Hz |
| `dahFrequency` | `500` | Hz |
| `preSpace` | `2` | Seconds of silence before playback |
| `volume` | `10` | 1–10 scale |

To change the startup defaults for new users, edit this file. Existing users with saved cookies will not be affected.

---

### 7.3 `src/configs/wordify.json`

Symbol-to-word mapping used by the voice component. When TTS speaks a word that contains punctuation, these substitutions are applied so the voice synthesizer pronounces things naturally.

**Example entries:**

```json
{
  "%": "pct",
  "@": "at",
  "&": "and",
  ".": "dit dit dit"
}
```

Edit this file to add new symbol pronunciations or change existing ones.

---

### 7.4 Wordfiles (`src/wordfiles/`)

Practice content. Each file is either `.json` or `.txt` format.

**JSON format:**
```json
[
  { "displayValue": "PARIS", "characters": ["P", "A", "R", "I", "S"] },
  { "displayValue": "THE", "characters": ["T", "H", "E"] }
]
```

`displayValue` is shown on the card. `characters` controls what is actually played as morse (allows display and audio to differ — e.g., prosigns).

**TXT format:**
```
PARIS
THE QUICK
BROWN FOX
```
One entry per line. If `newlineChunking` is `false` in `wordlists.json`, each space-separated word is its own card. If `true`, each line is one card.

**Naming conventions:**

| Prefix | Curriculum |
|---|---|
| `SB1`, `SB2` | Sound Better (LICW main curriculum), levels 1 and 2 |
| `BC*` | Basic Class |
| `INT*` | Intermediate |
| `ADV*` | Advanced |
| `POL_*` | Overlearning (Polish) |
| `TIN*` | TIN letter group |
| `UWB*` | UWB letter group |
| `Words_*L` | Common words by length (3L = 3-letter words, etc.) |
| `US_CS` | US call signs |

---

### 7.5 Presets (`src/presets/`)

Settings presets let users apply a named configuration (WPM, frequency, etc.) with one click.

**Directory layout:**

```
src/presets/
├── configs/           Individual preset JSON files (one per preset)
├── sets/              Preset set JSON files (groups of presets for a class)
├── overrides/
│   └── presetoverrides.json   Value overrides applied on top of base presets
└── legacymixin/
    └── legacymixin.json       Maps old preset names → new preset names
```

**Preset config file format (`configs/*.json`):**
```json
{
  "display": "BC1 Standard",
  "morseSettings": [
    { "key": "wpm", "value": 15 },
    { "key": "fwpm", "value": 20 },
    { "key": "ditFrequency", "value": 500 }
  ]
}
```

**To add a new preset:**
1. Create a new JSON file in `src/presets/configs/` following the format above
2. Optionally add it to a set file in `src/presets/sets/`
3. Rebuild — `prebuildPresets.js` will auto-discover it

**To add a new setting key to all existing presets:**  
Run `fixconfigs.js` after editing it to include the new key and default value.

---

## 8. Assets

#### `src/assets/CW-Club-logo-clear400-300x300.png`
The LICW logo shown in the page header. Referenced from `morse.ts` via the images module. Webpack emits it as a file in `dist/` and provides the URL.

#### `src/assets/LongIslandCWClub-favicon-2.jpg`
The browser tab favicon. Referenced in `webpack.config.js` under `HtmlWebpackPlugin` options.

---

## 9. GitHub Workflows (CI/CD)

All workflows are in `.github/workflows/`. They use GitHub Actions to build and deploy to GitHub Pages.

### `main2.yml` — Production Deploy

**Trigger:** Push to `main` branch  
**Deploys to:** GitHub Pages root `/`

**Steps:**
1. Checkout code
2. Setup Node.js
3. `npm ci` — install exact locked dependencies
4. `npm run build` — full webpack build
5. Deploy `dist/` to `gh-pages` branch

**Preserved subfolders during deployment:** Previous version folders (`1_0_0`, `1_1`, ..., `1_10`, `dev`, `soundslope`) are not deleted when the new build is deployed, preserving access to old versions.

---

### `develop2.yml` — Development Deploy

**Trigger:** Push to `develop` branch  
**Deploys to:** GitHub Pages at `/dev/` subfolder

Same steps as `main2.yml` but deploys to `/dev/` so the beta version is accessible alongside the stable version.

---

### Other workflows

| File | Branch | Purpose |
|---|---|---|
| `speakfirst.yml` | `speakfirst` | Feature branch deployment |
| `speech2.yml` | `speech2` | Feature branch deployment |
| `soundslope.yml` | `soundslope` | Feature branch deployment |
| `easysp23.yml` | `easysp23` | Feature branch deployment |

These are feature-branch deployments used during development of specific features. They follow the same pattern as the main workflows.

---

## 10. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  template.html                       │
│  (Bootstrap 5 grid + Knockout data-bind attributes)  │
└───────────────────┬─────────────────────────────────┘
                    │ ko.applyBindings()
                    ▼
┌─────────────────────────────────────────────────────┐
│               MorseViewModel (morse.ts)              │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ LessonPlugin │  │   Settings   │  │ MorseVoice│  │
│  │              │  │ (speed/freq/ │  │  (TTS)    │  │
│  │ wordlists.json│  │  misc)      │  │           │  │
│  └──────────────┘  └──────────────┘  └───────────┘  │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │FlaggedWords  │  │ ShortcutKeys │  │   Cookies │  │
│  └──────────────┘  └──────────────┘  └───────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │            MorseWordPlayer                    │   │
│  │  ┌─────────────────┐  ┌───────────────────┐  │   │
│  │  │ WavBufferPlayer │  │ SmoothedSounds    │  │   │
│  │  │  (default)      │  │ (experimental)    │  │   │
│  │  └────────┬────────┘  └───────────────────┘  │   │
│  └───────────┼──────────────────────────────────┘   │
└──────────────┼──────────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────┐
│               morse-pro library                      │
│  text → morse timing → PCM samples → WAV buffer     │
└─────────────────────────────────────────────────────┘
               ▼
       Web Audio API (browser)
```

**Data flow for playback:**

1. User clicks **Play** → `MorseViewModel.doPlay()`
2. ViewModel gets the next `WordInfo` from `CardBufferManager`
3. Builds a `SoundMakerConfig` from current settings
4. Passes config to `MorseWordPlayer.play()`
5. Player calls into `morse-pro` to convert text → WAV samples
6. WAV decoded and played via `WebAudioAPI`
7. On completion, player calls the `onEnded` callback
8. ViewModel advances the card index, triggers voice if enabled, loops if configured

---

## 11. Build Pipeline

```
npm run build
│
├── [prebuild] prebuildLessons.js
│   └── scans src/wordfiles/ → writes src/morse/morseLessonFinder.js
│
├── [prebuild] prebuildPresetSets.js
│   └── scans src/presets/sets/ → writes src/morse/morsePresetSetFinder.js
│
├── [prebuild] prebuildPresets.js
│   └── scans src/presets/configs/ → writes src/morse/morsePresetFinder.js
│
├── [webpack]
│   ├── Entry: src/index.js
│   ├── Babel transpiles all .js
│   ├── ts-loader compiles all .ts
│   ├── css-loader + MiniCssExtractPlugin extracts all CSS
│   ├── html-loader bundles Knockout component templates
│   ├── asset/resource emits image files
│   ├── asset/source inlines .txt wordfiles as strings
│   ├── HtmlWebpackPlugin generates dist/index.html
│   └── ESLintPlugin validates code style
│
├── [postbuild] zipdist.js
│   └── zips dist/ → dist/download/morse.zip
│
└── [postbuild] checklessons.js
    └── validates wordfiles ↔ wordlists.json consistency
```

**Output in `dist/`:**

```
dist/
├── index.html           Generated from template.html (bundle tags injected)
├── bundle[hash].js      All application JavaScript
├── bundle.[hash].css    All CSS (Bootstrap + custom)
├── [name].[ext]         Image assets
└── download/
    └── morse.zip        Offline-capable distribution archive
```

---

## 12. Deployment

### GitHub Pages (primary)

Deployments are triggered automatically by pushes to `main` (production) or `develop` (beta):

| Branch | URL |
|---|---|
| `main` | `https://longislandcw.github.io/morsebrowser/` |
| `develop` | `https://longislandcw.github.io/morsebrowser/dev/` |

### Cloudflare Workers (alternative)

```bash
npm run build
wrangler deploy    # Requires Cloudflare API token in environment
```

The `wrangler.jsonc` config serves the `dist/` directory as static assets through a Cloudflare Worker.

### Offline / Self-hosted

After `npm run build`, the `dist/` directory is self-contained. Users can:
1. Download `dist/download/morse.zip`
2. Extract anywhere
3. Open `index.html` in a browser

No server required — all content is bundled.

---

## 13. Adding / Changing Things

### Add a new lesson

1. Create the wordfile in `src/wordfiles/` (`.json` or `.txt`)
2. Add an entry to `src/wordfilesconfigs/wordlists.json`
3. `npm run build` — prebuild scripts validate consistency and bundle the file

### Add a new settings preset

1. Create a JSON file in `src/presets/configs/` using the preset format
2. Optionally reference it in a set file in `src/presets/sets/`
3. `npm run build` — `prebuildPresets.js` auto-discovers it

### Add a new setting to the app

1. Add the observable to the appropriate settings file (`speedSettings.ts`, `frequencySettings.ts`, `miscSettings.ts`, or `morse.ts` directly)
2. Add a default value to `src/configs/licwdefaults.json`
3. Register it with the cookie manager in `morseCookies.ts`
4. Add the UI control to `src/template.html`
5. Run `fixconfigs.js` (after editing it) to add the new key to all existing preset files

### Add a new Bootstrap icon

1. Find the icon name in the `bootstrap-icons` package
2. Import it in `src/morse/images/morseLoadImages.ts`
3. Add it to the returned object with a descriptive key (e.g., `'myNewIcon'`)
4. Reference it in the template with `morseLoadImages().getSrc('myNewIcon')`

### Add a new Knockout component

1. Create a folder in `src/morse/components/yourComponent/`
2. Add a TypeScript class file and an HTML template file
3. Register it in `morse.ts` via `ko.components.register('yourcomponent', { ... })`
4. Use it in `template.html` as `<yourcomponent params="root: $root"></yourcomponent>`

### Change the page structure

Edit `src/template.html`. The template uses Bootstrap 5 classes for layout and Knockout `data-bind` attributes for all dynamic behavior. HtmlWebpackPlugin injects the bundle script and CSS link tags automatically — do not add those manually.

### Change build output location

Edit `output.path` in `webpack.config.js`. Also update `wrangler.jsonc` `assets.directory` if using Cloudflare Workers deployment.

### Upgrade Bootstrap

1. `npm install bootstrap@<new-version> @popperjs/core@<compatible-version>`
2. Test all accordions, form controls, and button groups — Bootstrap has breaking changes between minor versions
3. Check that `data-bs-*` attributes in `template.html` match the new Bootstrap JS API

### Upgrade Knockout

Knockout 3.x has been stable for years with minimal breaking changes. Upgrade by updating `package.json` and testing all `data-bind` bindings, computed observables, and components.
