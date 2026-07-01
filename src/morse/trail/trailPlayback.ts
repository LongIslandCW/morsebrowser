export type NeedToTrailInput = {
  racerOn: boolean
  trailReveal: boolean
  fromVoiceOrTrail: boolean
  hasMoreMorse: boolean
}

export function computeNeedToTrail (input: NeedToTrailInput): boolean {
  return !input.racerOn &&
    input.trailReveal &&
    !input.fromVoiceOrTrail &&
    !input.hasMoreMorse
}

export function trailDelayMs (value: unknown): number {
  const parsed = parseFloat(String(value))
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }
  return parsed * 1000
}

export type AdvanceTrailInput = {
  preDelaySec: unknown
  postDelaySec: unknown
  speakAndTrail: boolean
  onReveal: () => void
  onContinue: () => void
  schedule?: typeof setTimeout
}

export function runAdvanceTrail (input: AdvanceTrailInput): void {
  const schedule = input.schedule ?? setTimeout
  const preMs = input.speakAndTrail ? 0 : trailDelayMs(input.preDelaySec)
  const postMs = input.speakAndTrail ? 0 : trailDelayMs(input.postDelaySec)

  schedule(() => {
    input.onReveal()
    schedule(() => {
      input.onContinue()
    }, postMs)
  }, preMs)
}

export type FinalizeTrailInput = {
  finalDelaySec: unknown
  onDone: () => void
  schedule?: typeof setTimeout
}

export function runFinalizeTrail (input: FinalizeTrailInput): void {
  const schedule = input.schedule ?? setTimeout
  schedule(() => {
    input.onDone()
  }, trailDelayMs(input.finalDelaySec))
}
