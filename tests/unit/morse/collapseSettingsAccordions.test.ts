import { describe, expect, it, beforeEach, vi } from 'vitest'
import { Collapse } from 'bootstrap'

/** Mirrors MorseViewModel.collapseSettingsAccordions — Bootstrap Collapse API */
function collapseSettingsAccordions () {
  const area = document.getElementById('accordionArea')
  if (!area) {
    return
  }
  area.querySelectorAll('.accordion-collapse.show').forEach((panel) => {
    Collapse.getOrCreateInstance(panel as HTMLElement, { toggle: false }).hide()
  })
}

function scrollPlaybackIntoView () {
  document.querySelector('.playback-controls')?.scrollIntoView({ block: 'start', behavior: 'auto' })
}

function maybeCollapseSettingsAccordions (autoCloseSettingsAccordions: boolean) {
  if (autoCloseSettingsAccordions) {
    collapseSettingsAccordions()
  }
}

describe('collapseSettingsAccordions', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="accordionArea">
        <button class="accordion-button" type="button" data-bs-toggle="collapse"
          data-bs-target="#panel1" aria-expanded="true" aria-controls="panel1">One</button>
        <div class="accordion-collapse collapse show" id="panel1"></div>
        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
          data-bs-target="#panel2" aria-expanded="false" aria-controls="panel2">Two</button>
        <div class="accordion-collapse collapse" id="panel2"></div>
      </div>
    `
  })

  it('removes show from open panels and collapses buttons', () => {
    collapseSettingsAccordions()
    expect(document.querySelector('#panel1')?.classList.contains('show')).toBe(false)
    const button = document.querySelector('#accordionArea .accordion-button[data-bs-target="#panel1"]')
    expect(button?.classList.contains('collapsed')).toBe(true)
    expect(button?.getAttribute('aria-expanded')).toBe('false')
  })

  it('skips collapse when autoCloseSettingsAccordions is false', () => {
    maybeCollapseSettingsAccordions(false)
    expect(document.querySelector('#panel1')?.classList.contains('show')).toBe(true)
    const button = document.querySelector('#accordionArea .accordion-button[data-bs-target="#panel1"]')
    expect(button?.classList.contains('collapsed')).toBe(false)
    expect(button?.getAttribute('aria-expanded')).toBe('true')
  })

  it('collapses when autoCloseSettingsAccordions is true', () => {
    maybeCollapseSettingsAccordions(true)
    expect(document.querySelector('#panel1')?.classList.contains('show')).toBe(false)
  })
})

function expandVoiceOptionsAccordionIfClosed () {
  const panel = document.getElementById('collapsevoiceoptions')
  if (panel?.classList.contains('show')) {
    return
  }
  if (!panel) {
    return
  }
  Collapse.getOrCreateInstance(panel, { toggle: false }).show()
}

describe('expandVoiceOptionsAccordionIfClosed', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="accordionArea">
        <button id="voiceOptionsAccordionButton" class="accordion-button collapsed" type="button"
          data-bs-toggle="collapse" data-bs-target="#collapsevoiceoptions"
          aria-expanded="false" aria-controls="collapsevoiceoptions">Voice</button>
        <div class="accordion-collapse collapse" id="collapsevoiceoptions"></div>
      </div>
    `
  })

  it('expands the Voice Options panel and button when collapsed', async () => {
    const panel = document.getElementById('collapsevoiceoptions') as HTMLElement
    const shown = new Promise<void>((resolve) => {
      panel.addEventListener('shown.bs.collapse', () => resolve(), { once: true })
    })
    expandVoiceOptionsAccordionIfClosed()
    await shown
    expect(panel.classList.contains('show')).toBe(true)
    const button = document.getElementById('voiceOptionsAccordionButton')
    expect(button?.classList.contains('collapsed')).toBe(false)
    expect(button?.getAttribute('aria-expanded')).toBe('true')
  })

  it('does not change an already-open Voice Options panel', () => {
    document.getElementById('collapsevoiceoptions')?.classList.add('show')
    const button = document.getElementById('voiceOptionsAccordionButton')
    button?.classList.remove('collapsed')
    button?.setAttribute('aria-expanded', 'true')

    expandVoiceOptionsAccordionIfClosed()

    expect(document.querySelector('#collapsevoiceoptions')?.classList.contains('show')).toBe(true)
    expect(button?.classList.contains('collapsed')).toBe(false)
    expect(button?.getAttribute('aria-expanded')).toBe('true')
  })
})

describe('scrollPlaybackIntoView', () => {
  it('scrolls the playback controls into view', () => {
    const el = document.createElement('section')
    el.className = 'playback-controls'
    el.scrollIntoView = vi.fn()
    document.body.appendChild(el)

    scrollPlaybackIntoView()

    expect(el.scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'auto' })
  })
})
