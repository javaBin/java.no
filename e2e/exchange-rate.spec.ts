import { test, expect } from "@playwright/test"

/**
 * The Norges Bank lookup is mocked so the assertion is on our own maths and
 * formatting rather than on a live rate.
 *
 * UNIT_MULT of "2" means the quote is per 100 units, so 12.3456 quoted against
 * 250 USD is 250 * 12.3456 / 100 = 30.864 NOK.
 */
const RATE = "12.3456"
const UNIT_MULT = "2"
const QUOTE_DATE = "2026-08-10"
const AMOUNT = 250
const EXPECTED_NOK = "30,86"

test("the Norges Bank rate and converted total are shown under the amount", async ({
  page,
}) => {
  await page.route("**/data.norges-bank.no/**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          structure: {
            attributes: {
              series: [{ id: "UNIT_MULT", values: [{ id: UNIT_MULT }] }],
            },
            dimensions: {
              observation: [{ id: "TIME_PERIOD", values: [{ id: QUOTE_DATE }] }],
            },
          },
          dataSets: [
            { series: { "0:0:0:0": { observations: { "0": [RATE] } } } },
          ],
        },
      }),
    }),
  )

  await page.goto("/no/utlegg")

  // Currency defaults to NOK, which deliberately shows no rate.
  await expect(page.getByText(/Valutakurs fra Norges Bank/)).toHaveCount(0)

  // Both controls are label-associated, so their accessible name is the field
  // label rather than the displayed value.
  await page.getByRole("button", { name: "Valuta" }).click()
  await page.getByPlaceholder("Søk valuta...").fill("USD")
  await page.getByRole("option").filter({ hasText: "USD" }).first().click()

  const amount = page.getByRole("textbox", { name: "Beløp (inkl. mva)" })
  await amount.fill(String(AMOUNT))
  await amount.blur()

  const rateLine = page.getByText(/Valutakurs fra Norges Bank/)
  await expect(rateLine).toBeVisible()
  // Quote date comes from the response, not the expense date.
  await expect(rateLine).toContainText(QUOTE_DATE)
  await expect(rateLine).toContainText("12,35")
  await expect(rateLine).toContainText("per 100 USD")

  await expect(page.getByText(/Du får tilbake/)).toContainText(EXPECTED_NOK)
})
