# `src/` Directory

Application source for the Morse Practice Page.

| Path | Purpose |
|------|---------|
| `index.js` | Webpack entry. Imports CSS, applies the saved theme, and binds `MorseViewModel`. |
| `template.html` | Main HTML template and Knockout bindings. Webpack turns this into `dist/index.html`. |
| `assets/` | Logo and favicon assets. |
| `css/` | Bootstrap overrides, settings layout, mobile sizing, and dark-theme styles. |
| `configs/` | Startup defaults and voice punctuation mapping. |
| `morse/` | Main TypeScript application modules. |
| `morse-pro/` | Local LICW-modified copy of SG Phillips' morse-pro code. Keep changes narrow. |
| `presets/` | Preset sets, preset configs, overrides, and legacy mixins. |
| `wordfiles/` | Lesson content files (`.json` and `.txt`). |
| `wordfilesconfigs/` | `wordlists.json`, the lesson catalog that drives LICW Lessons. |

## Generated Finder Files

The prebuild scripts generate dynamic import maps in `src/morse/`:

- `morseLessonFinder.js`
- `morsePresetFinder.js`
- `morsePresetSetFinder.js`

Run `npm run prebuild` after adding or removing lesson, preset config, or preset set files. `npm run build` runs this automatically.

## Main UI Areas

`template.html` renders:

- Header with logo, help link, and dark-mode toggle
- Basic speed settings
- LICW Lessons
- Lesson Options, Voice Options, Tone Options, Input Options, Output Options
- Optional RSS and Noise accordions
- Working text stats
- Playback controls
- Cards
- Help, credits, keyboard shortcuts, and screen-reader status
