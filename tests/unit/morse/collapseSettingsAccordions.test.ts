import { describe, expect, it, beforeEach } from 'vitest'

/** Mirrors MorseViewModel.collapseSettingsAccordions DOM behavior */
function collapseSettingsAccordions () {
  const area = document.getElementById('accordionArea')
  if (!area) {
    return
  }
  area.querySelectorAll('.accordion-collapse.show').forEach((panel) => {
    panel.classList.remove('show')
  })
  area.querySelectorAll('.accordion-button').forEach((button) => {
    button.classList.add('collapsed')
    button.setAttribute('aria-expanded', 'false')
  })
}

describe('collapseSettingsAccordions', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="accordionArea">
        <div class="accordion-collapse collapse show" id="panel1"></div>
        <button class="accordion-button" aria-expanded="true">One</button>
        <div class="accordion-collapse collapse" id="panel2"></div>
        <button class="accordion-button collapsed" aria-expanded="false">Two</button>
      </div>
    `
  })

  it('removes show from open panels and collapses buttons', () => {
    collapseSettingsAccordions()
    expect(document.querySelector('#panel1')?.classList.contains('show')).toBe(false)
    const buttons = document.querySelectorAll('#accordionArea .accordion-button')
    buttons.forEach((btn) => {
      expect(btn.classList.contains('collapsed')).toBe(true)
      expect(btn.getAttribute('aria-expanded')).toBe('false')
    })
  })
})
