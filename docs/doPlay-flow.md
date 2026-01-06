# Playback Flow (doPlay)

This describes what happens when the user hits **Play** (calling `doPlay`). It focuses on order of operations, side effects, and where timers/callbacks fire. Logging refers to the optional `actionLog` hook.

## Entry
- Guard: if `rawText` is empty, return.
- Log: `{type:'play', playJustEnded, fromPlayButton, index}` (if logger provided).
- Establish state: clear `isPaused`, set `playerPlaying(true)`, set/refresh `lastPlayFullStart`.
- Fresh start (fromPlayButton when not already playing):
  - zero `runningPlayMs`
  - clear `morseVoice.voiceBuffer`
  - `morseVoice.primeThePump()`
  - clear card buffer, reset `charsPlayed`
  - reset `speakFirstLastCardIndex`

## Schedule actual playback
- Clear any prior `doPlayTimeout`.
- Set `doPlayTimeout`:
  - First `morseWordPlayer.pause(...)` to ensure any prior audio stops and to prep trail reveal (`maxRevealedTrail(currentIndex-1)`).
  - Build `config` for the next Morse audio:
    - compute repeats from settings (`numberOfRepeats`)
    - get next Morse chunk from `cardBufferManager`
  - `addToVoiceBuffer()` enqueues voice text (speak-after scenarios).
  - Define `playerCmd`: plays Morse audio if speak-first is not blocking.
    - Log: `{type:'morse', index, word: config.word}`
    - Call `morseWordPlayer.play(config, onEnd)`; on end increments `charsPlayed` and calls `playEnded`.
  - Speak-first handling:
    - If not speak-first (or already spoke this index), call `playerCmd` immediately.
    - Else:
      - Pull phrase from voice buffer.
      - `setTimeout` with `voiceThinkingTime` then:
        - prep phrase (`prepPhraseToSpeakForFinal`)
        - Log: `{type:'speak', index, text}`
        - `morseVoice.speakPhrase(phrase, onDone)`; onDone marks `speakFirstLastCardIndex` and then runs `playerCmd`.
  - Mark timing: `lastPartialPlayStart = Date.now()`
  - Mark pre-space used.
  - Timeout delay: `0ms` if invoked by play button or just ended; otherwise `1000ms` to add a short gap when navigating manually.

## After Morse finishes (`playEnded`)
- (Not detailed here, but typically advances index, handles trail reveal, loops, etc.)

## Pausing (`doPause`)
- Log: `{type:'pause', reason: 'stop' | 'pause-button' | 'auto', index, fullRewind}`
- If stop: clear pending `doPlayTimeout`.
- If pause-button: accumulate `runningPlayMs` and toggle `isPaused`.
- Always: set `playerPlaying(false)`, call `morseWordPlayer.pause(...)`.
- On pause callback:
  - update `lastFullPlayTime`
  - invoke RSS callback if present
  - reset `preSpaceUsed`
  - if looping (and not stop/pause-button): optionally reshuffle then `doPlay` again.
- Handle `fullRewind`, `maxRevealedTrail` reset, clear `cardSpaceTimerHandle`.

## Notes for Testing
- Use the `actionLog` hook to capture `{seq, type, ...}` events instead of exercising audio/TTS.
- Stub `morseWordPlayer` and `morseVoice` in tests to log and immediately invoke callbacks.
- Use fake timers for `doPlayTimeout` and `voiceThinkingTime` to get deterministic ordering.
