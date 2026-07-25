import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Collapse } from 'bootstrap'

/**
 * Mirrors MorseLessonPlugin.closeLessonAccordianIfAutoClosing when auto-close
 * is on — drives Bootstrap Collapse so its cached _isShown stays in sync.
 */
function closeLessonAccordianIfAutoClosing (autoCloseEnabled: boolean) {
  if (!autoCloseEnabled) {
    return
  }
  const panel = document.getElementById('accordianItemLessonControls')
  const button = document.getElementById('lessonAccordianButton')
  if (!panel?.classList.contains('show')) {
    return
  }
  const hadFocusInside = panel.contains(document.activeElement)
  Collapse.getOrCreateInstance(panel, { toggle: false }).hide()
  if (hadFocusInside) {
    button?.focus({ preventScroll: true })
  }
}

describe('closeLessonAccordianIfAutoClosing', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="lessonAccordianButton" class="accordion-button" type="button"
        data-bs-toggle="collapse" data-bs-target="#accordianItemLessonControls"
        aria-expanded="true" aria-controls="accordianItemLessonControls">LICW Lessons</button>
      <div id="accordianItemLessonControls" class="accordion-collapse collapse show"></div>
      <button id="lessonsPickerLessonToggle" type="button">Lesson</button>
    `
  })

  it('collapses the lessons panel without focusing the accordion button', () => {
    const accordionButton = document.getElementById('lessonAccordianButton') as HTMLButtonElement
    const lessonToggle = document.getElementById('lessonsPickerLessonToggle') as HTMLButtonElement
    const clickSpy = vi.spyOn(accordionButton, 'click')
    lessonToggle.focus()

    closeLessonAccordianIfAutoClosing(true)

    expect(document.getElementById('accordianItemLessonControls')?.classList.contains('show')).toBe(false)
    expect(accordionButton.classList.contains('collapsed')).toBe(true)
    expect(accordionButton.getAttribute('aria-expanded')).toBe('false')
    expect(clickSpy).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(lessonToggle)
  })

  it('does nothing when auto-close is off', () => {
    closeLessonAccordianIfAutoClosing(false)
    expect(document.getElementById('accordianItemLessonControls')?.classList.contains('show')).toBe(true)
    expect(document.getElementById('lessonAccordianButton')?.getAttribute('aria-expanded')).toBe('true')
  })
})
