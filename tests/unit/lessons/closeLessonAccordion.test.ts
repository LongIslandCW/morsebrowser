import { beforeEach, describe, expect, it, vi } from 'vitest'

/** Mirrors MorseLessonPlugin.closeLessonAccordianIfAutoClosing when auto-close is on */
function closeLessonAccordianIfAutoClosing (autoCloseEnabled: boolean) {
  if (!autoCloseEnabled) {
    return
  }
  const panel = document.getElementById('accordianItemLessonControls')
  const button = document.getElementById('lessonAccordianButton')
  if (!panel?.classList.contains('show')) {
    return
  }
  panel.classList.remove('show')
  button?.classList.add('collapsed')
  button?.setAttribute('aria-expanded', 'false')
}

describe('closeLessonAccordianIfAutoClosing', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="lessonAccordianButton" class="accordion-button" aria-expanded="true">LICW Lessons</button>
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
