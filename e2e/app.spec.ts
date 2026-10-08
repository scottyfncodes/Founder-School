import { expect, test, type Page } from '@playwright/test'
import { LESSONS } from '../src/content/curriculum'
import { SCENARIOS } from '../src/content/scenarios'

const WIDTHS = [320, 375, 390, 430, 768, 1280]

function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  return errors
}

async function noHorizontalScroll(page: Page) {
  const { sw, w } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: window.innerWidth }))
  expect(sw, 'horizontal page scroll').toBeLessThanOrEqual(w)
}

/** Answer the visible quiz by trying options until the correct one is found. */
async function solveQuiz(page: Page) {
  const group = page.getByRole('group', { name: 'Answer options' })
  const count = await group.getByRole('button').count()
  for (let k = 0; k < count; k++) {
    const opt = group.getByRole('button').nth(k)
    if (await opt.isDisabled()) continue
    await opt.click()
    if (await page.locator('.callout.good').count()) return
  }
}

for (const width of WIDTHS) {
  test(`main screens fit at ${width}px`, async ({ page }) => {
    const errors = trackErrors(page)
    await page.setViewportSize({ width, height: 800 })
    for (const route of ['/', '/#/map', '/#/glossary', '/#/progress', '/#/scenarios', '/#/capstone', '/#/world/w1']) {
      await page.goto(route)
      await page.waitForTimeout(150)
      await noHorizontalScroll(page)
    }
    expect(errors).toEqual([])
  })
}

test('home shows the essentials', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Learn how the machine works.')).toBeVisible()
  await expect(page.getByText('Current level')).toBeVisible()
  await expect(page.getByText('How does a web app actually work?').first()).toBeVisible()
  await expect(page.locator('.world-tile')).toHaveCount(12)
})

// Play every lesson start to finish (activities skipped, quizzes solved).
for (const lesson of LESSONS) {
  test(`lesson ${lesson.id} plays to completion`, async ({ page }) => {
    const errors = trackErrors(page)
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto(`/#/lesson/${lesson.id}`)
    for (let i = 0; i < lesson.steps.length; i++) {
      const step = lesson.steps[i]
      await expect(page.getByText(`· ${i + 1}/${lesson.steps.length}`)).toBeVisible()
      await noHorizontalScroll(page)
      if (step.kind === 'quiz') await solveQuiz(page)
      if (step.kind === 'widget') await page.getByRole('button', { name: 'Skip activity' }).click()
      const next = page.getByRole('button', { name: /Continue|Finish lesson/ })
      await expect(next).toBeEnabled()
      await next.click()
    }
    await expect(page.getByText('Lesson complete')).toBeVisible()
    await noHorizontalScroll(page)
    expect(errors).toEqual([])
  })
}

test('progress is tracked, persisted and resettable', async ({ page }) => {
  const first = LESSONS[0]
  await page.goto(`/#/lesson/${first.id}`)
  for (const step of first.steps) {
    if (step.kind === 'quiz') {
      // answer correctly first time
      const right = step.options.find((o) => o.correct)!
      await page.getByRole('button', { name: right.text }).click()
    }
    if (step.kind === 'widget') await page.getByRole('button', { name: 'Skip activity' }).click()
    await page.getByRole('button', { name: /Continue|Finish lesson/ }).click()
  }
  await expect(page.getByText('Lesson complete')).toBeVisible()
  await page.reload()
  await page.goto('/#/')
  await expect(page.locator('.stat').first()).toContainText('1')
  await page.goto('/#/progress')
  await page.getByRole('button', { name: 'Reset all progress…' }).click()
  await page.getByRole('button', { name: 'Yes, erase everything' }).click()
  await expect(page.getByText('Progress reset. Fresh start.')).toBeVisible()
  await page.goto('/#/')
  await expect(page.locator('.stat').first()).toContainText('0')
})

test('architecture map explains a box', async ({ page }) => {
  await page.goto('/#/map')
  await page.getByRole('switch', { name: 'Preview all boxes' }).click()
  await page.getByRole('button', { name: 'Database', exact: true }).click()
  await expect(page.getByText('If it fails:')).toBeVisible()
  await expect(page.getByText('Why you care:')).toBeVisible()
})

test('glossary search and deep link', async ({ page }) => {
  await page.goto('/#/glossary')
  await page.getByPlaceholder(/Search/).fill('churn')
  await expect(page.locator('li.card').first()).toContainText(/churn/i)
  await page.goto('/#/glossary/api')
  await expect(page.getByText('What it is')).toBeVisible()
})

for (const s of SCENARIOS) {
  test(`scenario ${s.id} plays to the takeaway`, async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto(`/#/scenarios/${s.id}`)
    for (let i = 0; i < s.steps.length; i++) {
      await solveQuiz(page)
      await page.getByRole('button', { name: /Next decision|See the takeaway/ }).click()
    }
    await expect(page.getByText('Remember this')).toBeVisible()
    await noHorizontalScroll(page)
    expect(errors).toEqual([])
  })
}

test('reduced motion is respected', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await page.goto('/#/lesson/w1-machine')
  await page.getByRole('button', { name: 'Continue' }).click()
  const t0 = Date.now()
  await page.getByRole('button', { name: /Save a contact/ }).click()
  await expect(page.getByText('Maria Lopez saved')).toBeVisible()
  expect(Date.now() - t0).toBeLessThan(4000)
  await ctx.close()
})
