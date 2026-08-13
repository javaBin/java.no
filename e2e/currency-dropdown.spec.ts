import { test, expect } from "@playwright/test"

/**
 * Regression test for a real bug: the currency dropdown's `slim` trigger (used
 * on the expense row) is only ~76px wide, and the popover's width was briefly
 * bound directly to that anchor width, shrinking the whole currency list and
 * search box down to the same ~76px and truncating every entry to one letter.
 *
 * It only ever surfaced here, not in the fork it was ported from, because our
 * `tailwind-merge` correctly recognises the conflicting `w-` utility and strips
 * the shared component's `w-72` default; the fork's installed `tailwind-merge`
 * version doesn't parse its newer Tailwind v4 arbitrary-value syntax, so the
 * conflicting class doesn't take effect there and `w-72` wins by accident.
 */
test("the currency popover stays readable, not shrunk to the slim trigger's width", async ({
  page,
}) => {
  await page.goto("/no/utlegg")

  const trigger = page.getByRole("button", { name: "Valuta" })
  const anchorWidth = (await trigger.boundingBox())!.width

  await trigger.click()
  await page.getByPlaceholder("Søk valuta...").fill("US")

  const option = page.getByRole("option").filter({ hasText: "USD" }).first()
  await expect(option).toBeVisible()

  // The full currency name must actually render, not just exist in the DOM
  // clipped to nothing.
  await expect(option).toContainText("amerikanske dollar")

  const popoverWidth = (await option.evaluate((el) => {
    const content = el.closest('[data-radix-popper-content-wrapper] > *')
    return content?.getBoundingClientRect().width
  }))!

  expect(popoverWidth).toBeGreaterThan(anchorWidth * 2)
})
