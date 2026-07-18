import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SmoothedSoundsContext } from '../../../src/morse/player/soundmakers/SmoothedSounds/SmoothedSoundsContext'

class FakeOscillator {
  connect = vi.fn()
  start = vi.fn()
  stop = vi.fn()
  type = 'sine'
  frequency = { setValueAtTime: vi.fn() }
}

class FakeBiquadFilter {
  connect = vi.fn()
  type = 'bandpass'
  Q = { setValueAtTime: vi.fn() }
  frequency = { setValueAtTime: vi.fn() }
}

class FakeGain {
  connect = vi.fn()
  gain = { setValueAtTime: vi.fn(), setTargetAtTime: vi.fn() }
}

class FakeAudioContext {
  state = 'running'
  currentTime = 0
  destination = {}
  close = vi.fn(async () => {
    this.state = 'closed'
  })

  createGain () {
    return new FakeGain()
  }

  createOscillator () {
    return new FakeOscillator()
  }

  createBiquadFilter () {
    return new FakeBiquadFilter()
  }
}

describe('SmoothedSoundsContext.stopAndCloseContext', () => {
  beforeEach(() => {
    vi.stubGlobal('AudioContext', FakeAudioContext)
  })

  it('does not call close twice when stopAndCloseContext is repeated', async () => {
    const ctx = new SmoothedSoundsContext(false, 0)
    const audioContext = ctx.audioContext as unknown as FakeAudioContext

    await new Promise<void>((resolve) => {
      ctx.stopAndCloseContext(() => resolve())
    })
    expect(ctx.contextClosed).toBe(true)
    expect(audioContext.close).toHaveBeenCalledTimes(1)
    expect(audioContext.state).toBe('closed')

    const secondCallback = vi.fn()
    await new Promise<void>((resolve) => {
      ctx.stopAndCloseContext(() => {
        secondCallback()
        resolve()
      })
    })

    expect(secondCallback).toHaveBeenCalledTimes(1)
    expect(audioContext.close).toHaveBeenCalledTimes(1)
  })
})
