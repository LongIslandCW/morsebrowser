# Playback Architecture: Toward a Testable, Decoupled Design

This outlines a cleaner approach to handling playback (`doPlay`/`doPause`) by decoupling orchestration from side effects and treating the flow as a state machine.

## Goals
- Make the “what happens next?” logic testable without real audio/TTS/DOM.
- Keep Knockout observables and UI wiring thin.
- Provide a simple action log for integration tests.

## Core Ideas
### 1) Playback Controller (Service)
Encapsulate playback orchestration in a controller that:
- Takes injected collaborators:
  - `morsePlayer` (play/pause callbacks)
  - `voicePlayer` (speakPhrase)
  - `clock/timers` (schedulable, fakeable in tests)
  - `logger` (action log)
  - `settings/flags`
  - `wordProvider` (`words()`, `currentIndex`, `advance`)
- Exposes methods: `play(startReason)`, `pause(reason)`, `onWordEnded()`, `onSpeakEnded()`, etc.
- Computes decisions: speak-first vs after, repeats, delays, buffering.
- Emits side-effect intents (e.g., “play morse word X”, “speak text Y”, “schedule delay Z”) rather than doing them directly.

### 2) State Machine Mindset
Model states and events:
- States: `idle`, `playing-morse`, `speaking-first`, `pausing`, `looping`, etc.
- Events: `play-button`, `pause-button`, `word-ended`, `speak-ended`, `loop-tick`.
- Transitions are pure data; side effects hang off entry/exit hooks.
- Test state transitions and decisions with plain data.

### 3) Dependency Injection
Pass collaborators into the controller:
- **Players**: `morsePlayer`, `voicePlayer` (stubbable)
- **Clock/Timers**: injectable `setTimeout/clearTimeout` or a scheduler abstraction
- **Logger**: `actionLog(event)` (no-op in production by default)
- **Settings/Flags**: a simple object (speakFirst, repeats, loop, shuffle, etc.)
- **Word Provider**: `words()`, `currentIndex`, `setIndex`, `buffer` for voice/morse if needed

### 4) Action Log
- Keep the logging hook you added, but formalize the schema:
```ts
type ActionEvent =
  | { seq:number, type:'play', reason:'user'|'loop'; index:number }
  | { seq:number, type:'pause', reason:'user'|'auto'|'stop'; index:number }
  | { seq:number, type:'morse', index:number, word:string }
  | { seq:number, type:'speak', index:number, text:string }
  | { seq:number, type:'repeat', count:number }
  | { seq:number, type:'delay', ms:number };
```
- Append-only, ordered by `seq`; omit timestamps for determinism. In production, default to no-op; in tests, inject a collector.

### 5) Pure Helpers
Extract small pure functions:
- Repeat count calculation
- Next-word selection (with buffering constraints)
- Speak-first gating logic
- Delay computation (pre/post/voice-thinking)
- Voice buffer prep
Each can be unit-tested independently.

## Wiring Back to the ViewModel
- `MorseViewModel` holds KO observables and constructs the controller with real collaborators.
- The controller issues intents (play/speak/delay). The VM forwards to actual `morseWordPlayer`, `morseVoice`, timers, etc.
- Logging hook is passed in (no-op by default).
- UI handlers (`play`, `pause`, etc.) call controller methods; controller updates index/state via injected setters.

## Test Strategy
- **Unit tests**: pure helpers and state transitions (no KO, no timers).
- **Integration tests (headless)**: controller with fakes for players/clock/logger; use fake timers; assert action log order.
- **Minimal UI tests**: only if needed to ensure wiring to KO/DOM.

## Benefits
- More predictable, testable playback flow.
- Side effects isolated behind interfaces; easy to stub/mock.
- Action log provides traceability for “Rube Goldberg” scenarios (repeat, speak-first, shuffle, loop).
