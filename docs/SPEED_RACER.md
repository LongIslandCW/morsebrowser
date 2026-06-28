# Speed Racer — settings, presets, and deep links

This guide explains **Speed Racer** mode: how it plays each card, where the controls live in the UI, how to build **Tom-style deep links**, and how to encode settings in **preset JSON**.

**Audience:** curriculum authors, link builders (Tom), and maintainers wiring presets or testing playback.

**Related:** [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) (architecture), [AGENTS.md](../AGENTS.md) (fork notes), `src/morse/settings/speedSettings.ts`, `src/morse/morse.ts`.

---

## Table of contents

1. [What Speed Racer does](#1-what-speed-racer-does)
2. [UI controls](#2-ui-controls)
3. [Deep links (query string)](#3-deep-links-query-string)
4. [Preset display names and files](#4-preset-display-names-and-files)
5. [Preset JSON keys](#5-preset-json-keys)
6. [Replay vs speak combinations](#6-replay-vs-speak-combinations)
7. [Jay-style vs Overlearn](#7-jay-style-vs-overlearn)
8. [What Speed Racer is *not*](#8-what-speed-racer-is-not)
9. [Link cheat sheet](#9-link-cheat-sheet)

---

## 1. What Speed Racer does

When **Speed Racer** is enabled (Lesson Options → Timing), each card can play through a **multiplier ladder** instead of using **Repeats** or **Speed Intervals**.

For each card:

1. Play once at each **non-zero** multiplier, in list order.
2. Optionally **speak** the card once (if **Speak Before Replay** is on).
3. Optionally **replay** the card once at **base speed** — the speed from the **first** multiplier (if **Replay Base Speed** is on).

**FWPM during racing:** When a variation is faster than your saved FWPM, spacing stays at the saved base (Farnsworth). When variation WPM drops below saved FWPM (slow multipliers), spacing scales down with character speed so slow ladder steps stay cohesive.

**Mutual exclusion:** Speed Racer and **Speed Intervals** cannot both be on; enabling one turns the other off.

**Voice / Speak Before Replay:** Recap speech uses Voice Options settings (Spell, pre/post delay, speaker, etc.) via `speakSpeedRacerRecap` when **Speak** is on. Turn **Voice** on yourself in Voice Options to configure those settings. During Speed Racer sets, the normal voice trail (`addToVoiceBuffer`) is skipped.

Implementation: `SpeedSettings.applySpeedRacer()` in `speedSettings.ts`; speak/replay gate in `morse.ts` (`speakSpeedRacerRecap`).

---

## 2. UI controls

**LICW Lessons** — pick TYPE, CLASS, CONTENT, LESSON, and PRESETS as usual.

**Lesson Options → Timing:**

| Control | Description |
|---------|-------------|
| **Speed Racer** | Master on/off (btn-check toggle, same style as Voice and other app toggles). |
| **Advanced** | Shown when Speed Racer is on. |

**Advanced panel:**

| Control | Description |
|---------|-------------|
| **Multipliers** | Comma-separated list (e.g. `1.5, 1.35, 1.175, 1.0`). Each non-zero value plays the card once at `round(mainWpm × multiplier)`. `0` skips a slot. |
| **Replay Base Speed** | After the ladder, replay once at base speed (first multiplier). |
| **Speak** / **Speak Before Replay** | Label follows Replay: speak before base-speed replay, or speak after the last variation when replay is off. Always enabled with Speed Racer. |
| **Sequence preview** | Live text, e.g. `23 → 27 → 31 → speak → 23 wpm`. |
| **Reset to defaults** | Multipliers `1.5, 1.35, 1.175, 1.0`; **Replay** and **Speak** both **on**. |
| **Overlearn** | Multipliers `1.0, 1.174, 1.348`; **Replay** and **Speak** both **off**. |

Markup: `src/template.html` (Speed Racer fieldset under Timing).

---

## 3. Deep links (query string)

Tom-style links use four query parameters. They work on **club GitHub Pages** and **Workers previews** without any hidden UI setup.

```
?selectedClass=&selectedGroup=&selectedLesson=&selectedPreset=
```

| Query param | UI column | Example values |
|-------------|-----------|----------------|
| `selectedClass` | CLASS | `BC1`, `BC2`, `INT1`, … |
| `selectedGroup` | CONTENT (letter group) | `REA`, `TIN`, `UWB`, … |
| `selectedLesson` | LESSON (display name) | `OVERLEARN LETTERS`, `OVERLEARN WORDS`, … |
| `selectedPreset` | PRESETS (display name) | `Speed Racer Letters Flow Rate 1`, … |

**Matching:** case-insensitive (`toUpperCase()` compare in `morseLessonPlugin.ts`).

**URL encoding:** spaces → `%20` or `+`.

**Load order:** class → group → lesson → preset.

**After load:** parameters are removed from the URL (unless the hidden logo easter egg has enabled `queryStringSettingsOn` — student links do not need this).

**Failure:** if `selectedPreset` does not match a preset display name, the console logs `no preset found` and settings are not applied.

### Example link

BC1 REA Overlearn letters with Speed Racer Flow Rate 1:

```
https://longislandcw.github.io/morsebrowser/index.html?selectedClass=BC1&selectedGroup=REA&selectedLesson=OVERLEARN%20LETTERS&selectedPreset=Speed%20Racer%20Letters%20Flow%20Rate%201
```

Code: `morseLessonPlugin.ts` — `setSelectedClassInitialized`, `setLetterGroupInitialized`, `setDisplaysInitialized`, `setSettingsPresetsInitialized`.

---

## 4. Preset display names and files

Four **Speed Racer Overlearn** presets sit beside the original **OverLearn … Flow Rate** presets in BC1/BC2 preset lists (`src/presets/sets/bc1.json`, `bc2.json`).

| PRESETS display name (`selectedPreset`) | Config file | Base WPM | Multipliers (slow→fast) |
|----------------------------------------|-------------|----------|-------------------------|
| Speed Racer Letters Flow Rate 1 | `POL_17_L_SR.json` | 23 | `1.0, 1.174, 1.348` → 23 → 27 → 31 |
| Speed Racer Words Flow Rate 1 | `POL_17_W_SR.json` | 23 | same |
| Speed Racer Letters Flow Rate 2 | `POL_21_L_SR.json` | 27 | `1.0, 1.148, 1.296` → 27 → 31 → 35 |
| Speed Racer Words Flow Rate 2 | `POL_21_W_SR.json` | 27 | same |

Pair with lessons such as **`OVERLEARN LETTERS`** / **`OVERLEARN WORDS`** under the correct class and letter group (e.g. BC1 + REA). Lesson names come from `src/wordfilesconfigs/wordlists.json` (`display` field).

### Original OverLearn presets (unchanged)

| PRESETS display name | Config file | Mechanism |
|---------------------|-------------|-----------|
| OverLearn Letters Flow Rate 1 | `POL_17_L.json` | Legacy **`numberOfRepeats`** (typically 2), Speed Racer off |
| OverLearn Words Flow Rate 1 | `POL_17_W.json` | same |
| OverLearn Letters Flow Rate 2 | `POL_21_L.json` | same |
| OverLearn Words Flow Rate 2 | `POL_21_W.json` | same |

Use **Speed Racer …** preset names for the new multiplier engine. Use **OverLearn …** for the old repeat-based behavior.

---

## 5. Preset JSON keys

These keys serialize in preset JSON and in saved settings (`morseSettingsHandler.ts`):

| Key | Type | Meaning |
|-----|------|---------|
| `speedRacerEnabled` | boolean | Turn Speed Racer on |
| `speedRacerMultipliers` | string | Comma-separated multipliers; `0` skips a slot |
| `speedRacerFinalPlay` | boolean | **Replay Base Speed** after the ladder |
| `speedRacerSpeakBeforeReplay` | boolean | **Speak** toggle; recap uses Voice Options when on (enable Voice manually to configure Spell/delays) |
| `speedRacerKeepFwpm` | boolean | Legacy/preset compat only — FWPM always stays at saved base during racing |

### App defaults (`legacymixin.json`)

When a preset JSON omits a key, `legacymixin.json` fills it in at load time (`applyLegacyMixin` in `morseLessonPlugin.ts`):

| Key | Default |
|-----|---------|
| `speedRacerEnabled` | `false` |
| `speedRacerMultipliers` | `"1.5, 1.35, 1.175, 1.0"` |
| `speedRacerFinalPlay` | `true` |
| `speedRacerSpeakBeforeReplay` | `true` |
| `speedRacerKeepFwpm` | `true` |

Constructor defaults in `speedSettings.ts` match the above (except `speedRacerEnabled` starts false until turned on or loaded from a preset).

### Speed Racer Overlearn preset files (`POL_*_SR.json`)

These files explicitly set:

| Key | Value | Notes |
|-----|-------|-------|
| `speedRacerEnabled` | `true` | |
| `speedRacerMultipliers` | FR1 or FR2 ladder | See table in §4 |
| `speedRacerFinalPlay` | `false` | Pure Overlearn — end on fastest variation |
| `numberOfRepeats` | `0` | Speed Racer replaces repeats |
| `speakFirstAdditionalWordspaces` | `2` | Gap between variation plays (Overlearn pacing) |

They do **not** include `speedRacerSpeakBeforeReplay`. With `speedRacerFinalPlay: false`, speak never runs regardless. To make intent explicit in JSON, add the key (see §6).

### Example: replay on, speak off

```json
{
  "key": "speedRacerEnabled",
  "value": true
},
{
  "key": "speedRacerMultipliers",
  "value": "1.5, 1.35, 1.175, 1.0"
},
{
  "key": "speedRacerFinalPlay",
  "value": true
},
{
  "key": "speedRacerSpeakBeforeReplay",
  "value": false
}
```

After adding or removing files under `src/presets/configs/`, run **`npm run prebuild`**.

---

## 6. Replay vs speak combinations

| Replay Base Speed | Speak | Behavior |
|-------------------|-------|----------|
| On | On | Variations → **speak** → base-speed replay *(Jay-style default)* |
| On | Off | Variations → base-speed replay, **no speak** |
| Off | Off | Variation ladder only — stop after last (fastest) variation |
| Off | On | Variations → **speak** after the last variation *(no base-speed replay)* |

The speak toggle label is **Speak Before Replay** when replay is on, or **Speak** when replay is off. It is always clickable while Speed Racer is on.

The **Overlearn** button in Advanced sets FR1 multipliers and turns **both** toggles off.

---

## 7. Jay-style vs Overlearn

### Jay-style Speed Racer

Default multipliers: **`1.5, 1.35, 1.175, 1.0`**.

Typical defaults: **Replay Base Speed** on, **Speak Before Replay** on (**Reset to defaults** restores this).

Sequence idea: faster variations, then speak, then one play at base speed (speed from the **first** multiplier in the list).

### Overlearn (Speed Racer engine)

Multipliers slow→fast, e.g. FR1: **`1.0, 1.174, 1.348`** at base 23 WPM.

**Replay Base Speed** and **Speak Before Replay** both **off** — drill ends at the fastest variation.

Use preset **`Speed Racer … Flow Rate N`** or the **Overlearn** button in Advanced.

---

## 8. What Speed Racer is *not*

| Feature | Relationship to Speed Racer |
|---------|----------------------------|
| **Voice Options → Voice** | Normal lesson voice trail; skipped during Speed Racer racing |
| **`speakFirst` in preset JSON** | Separate “speak before first play” path; Speed Racer bypasses it so it does not delay the first variation |
| **Speed Intervals** | Mutually exclusive with Speed Racer |
| **`numberOfRepeats`** | SR Overlearn presets set this to `0`; multipliers replace repeats |

---

## 9. Link cheat sheet

**Overlearn letters, Speed Racer FR1 (BC1 REA):**

```
?selectedClass=BC1&selectedGroup=REA&selectedLesson=OVERLEARN%20LETTERS&selectedPreset=Speed%20Racer%20Letters%20Flow%20Rate%201
```

**Overlearn words, Speed Racer FR2:**

```
?selectedClass=BC1&selectedGroup=REA&selectedLesson=OVERLEARN%20WORDS&selectedPreset=Speed%20Racer%20Words%20Flow%20Rate%202
```

Swap `selectedClass`, `selectedGroup`, and `selectedLesson` for other classes, letter groups, and lesson display names from `wordlists.json`.

**Club base URL:** `https://longislandcw.github.io/morsebrowser/index.html`

**Fork Workers previews:** use the preview URL from the PR deploy comment; same query string works.
