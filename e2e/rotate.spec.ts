import { test, expect } from "@playwright/test"

/**
 * The source is a landscape rectangle with one corner marked red, everything
 * else white. A 90° clockwise turn moves that mark from the top-left to the
 * top-right — checking a marked corner (rather than just swapped dimensions)
 * catches a rotation that runs the wrong direction, or one that resizes
 * without actually turning the pixels.
 */
const WIDTH = 300
const HEIGHT = 150
const MARK_SIZE = 40

async function uploadMarkedImage(page: import("@playwright/test").Page) {
  await page.goto("/no/utlegg")

  await page.evaluate(
    async ({ width, height, markSize }) => {
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")!

      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = "red"
      ctx.fillRect(0, 0, markSize, markSize)

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      )

      const input = document.querySelector<HTMLInputElement>(
        'input[type="file"]',
      )!
      const transfer = new DataTransfer()
      transfer.items.add(
        new File([blob!], "marked.png", { type: "image/png" }),
      )
      input.files = transfer.files
      input.dispatchEvent(new Event("change", { bubbles: true }))
    },
    { width: WIDTH, height: HEIGHT, markSize: MARK_SIZE },
  )

  const image = page.locator(".ReactCrop img")
  await expect(image).toBeVisible()
  await expect(page.locator(".ReactCrop__crop-selection")).toBeVisible()
  return image
}

/** Reads the colour at (x, y) of whatever the crop dialog is currently showing. */
function sampleDisplayedImage(
  image: import("@playwright/test").Locator,
  x: number,
  y: number,
) {
  return image.evaluate((element, coords) => {
    const img = element as HTMLImageElement
    const canvas = document.createElement("canvas")
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(img, 0, 0)
    return [...ctx.getImageData(coords.x, coords.y, 1, 1).data]
  }, { x, y })
}

test("rotating turns the image 90 degrees clockwise, not just its dimensions", async ({
  page,
}) => {
  const image = await uploadMarkedImage(page)

  const before = await image.evaluate((el) => {
    const img = el as HTMLImageElement
    return { width: img.naturalWidth, height: img.naturalHeight }
  })
  expect(before).toEqual({ width: WIDTH, height: HEIGHT })

  await page
    .getByRole("button", { name: "Roter 90 grader", exact: true })
    .click()

  await expect
    .poll(() =>
      image.evaluate((el) => (el as HTMLImageElement).naturalWidth),
    )
    .toBe(HEIGHT)

  const after = await image.evaluate((el) => {
    const img = el as HTMLImageElement
    return { width: img.naturalWidth, height: img.naturalHeight }
  })
  expect(after).toEqual({ width: HEIGHT, height: WIDTH })

  // The mark started at the top-left; a clockwise turn should land it at the
  // top-right, with the (now vacated) top-left back to background white.
  const topRight = await sampleDisplayedImage(image, HEIGHT - 5, 5)
  const topLeft = await sampleDisplayedImage(image, 5, 5)

  expect(topRight.slice(0, 3)).toEqual([255, 0, 0])
  expect(topLeft.slice(0, 3)).toEqual([255, 255, 255])
})

test("a rotation survives into the cropped output", async ({ page }) => {
  const image = await uploadMarkedImage(page)

  await page
    .getByRole("button", { name: "Roter 90 grader", exact: true })
    .click()
  await expect
    .poll(() =>
      image.evaluate((el) => (el as HTMLImageElement).naturalWidth),
    )
    .toBe(HEIGHT)

  await page.evaluate(() => {
    const original = URL.createObjectURL.bind(URL)
    ;(window as unknown as { __captured?: Blob[] }).__captured = []
    URL.createObjectURL = (obj: Blob | MediaSource) => {
      if (obj instanceof Blob) {
        ;(window as unknown as { __captured: Blob[] }).__captured.push(obj)
      }
      return original(obj as Blob)
    }
  })

  await page
    .getByRole("button", { name: "Crop og fortsett", exact: true })
    .click()

  await page.waitForFunction(() =>
    (window as unknown as { __captured: Blob[] }).__captured.some(
      (candidate) => candidate.type === "image/jpeg",
    ),
  )

  const result = await page.evaluate(async () => {
    const captured = (window as unknown as { __captured: Blob[] }).__captured
    const blob = captured.find((candidate) => candidate.type === "image/jpeg")!
    const bitmap = await createImageBitmap(blob)
    const canvas = document.createElement("canvas")
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(bitmap, 0, 0)
    return {
      width: bitmap.width,
      height: bitmap.height,
      topRight: [...ctx.getImageData(bitmap.width - 3, 2, 1, 1).data].slice(
        0,
        3,
      ),
    }
  })

  expect(result.width).toBe(HEIGHT)
  expect(result.height).toBe(WIDTH)
  // Approximate: JPEG's lossy encode introduces a few levels of quantization
  // noise at a hard-edged colour boundary like this mark.
  expect(result.topRight[0]).toBeGreaterThan(240)
  expect(result.topRight[1]).toBeLessThan(15)
  expect(result.topRight[2]).toBeLessThan(15)
})
