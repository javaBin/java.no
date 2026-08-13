import { test, expect, type Page } from "@playwright/test"
import { VIEWPORT } from "../playwright.config"

/**
 * Regression coverage for cropping very tall / very high resolution receipts.
 *
 * The source image is a smooth greyscale ramp down its height, which makes the
 * vertical offset of a crop directly measurable: sample a pixel in the result
 * and its brightness decodes back to the y it came from in the original.
 *
 * A ramp rather than discrete colour bands on purpose — bands put cliffs in the
 * assertion, so a selection landing near a boundary flips the expected value and
 * the test flakes. Brightness degrades smoothly instead.
 *
 * Division of labour between the two tests, which was established by
 * reintroducing each defect and observing which test failed:
 *
 * - The fitting test is the guard for the original bug. It fails with
 *   `max-height: 100%` on the image, because that percentage never resolves.
 * - The offset test canNOT catch that bug, and is not meant to. It derives its
 *   expectations from the selection that actually landed, and Playwright can
 *   dispatch pointer events at off-viewport coordinates, so ReactCrop accepts a
 *   selection on an overflowing image that no human could reach. What it does
 *   guard is that the output matches the selection end to end through the real
 *   component — i.e. a gross offset or axis regression in the crop maths.
 */

const IMAGE_WIDTH = 900
const IMAGE_HEIGHT = 9000

/**
 * Generous enough to absorb drag imprecision and JPEG noise (255 levels over
 * 9000px, so one level is ~35px), while still far tighter than the defect being
 * guarded against, which displaced the crop by thousands of pixels.
 */
const OFFSET_TOLERANCE_PX = 450

/** Inverse of the ramp: brightness back to a y coordinate in the original. */
function decodeY(brightness: number) {
  return (brightness / 255) * IMAGE_HEIGHT
}

// Mirrors MAX_OUTPUT_DIMENSION in src/components/FileUploader.tsx.
const MAX_OUTPUT_DIMENSION = 1800

// The crop dialog caps the image at 60vh.
const IMAGE_CAP_PX = VIEWPORT.height * 0.6

async function openCropDialogWithTallImage(page: Page) {
  await page.goto("/no/utlegg")

  await page.evaluate(
    async ({ width, height }) => {
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")!

      // Greyscale so the signal survives JPEG chroma subsampling.
      const ramp = ctx.createLinearGradient(0, 0, 0, height)
      ramp.addColorStop(0, "rgb(0,0,0)")
      ramp.addColorStop(1, "rgb(255,255,255)")
      ctx.fillStyle = ramp
      ctx.fillRect(0, 0, width, height)

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      )

      const input = document.querySelector<HTMLInputElement>(
        'input[type="file"]',
      )!
      const transfer = new DataTransfer()
      transfer.items.add(
        new File([blob!], "tall-receipt.png", { type: "image/png" }),
      )
      input.files = transfer.files
      input.dispatchEvent(new Event("change", { bubbles: true }))
    },
    { width: IMAGE_WIDTH, height: IMAGE_HEIGHT },
  )

  const image = page.locator(".ReactCrop img")
  await expect(image).toBeVisible()
  // The initial selection is seeded on load; wait for it before measuring.
  await expect(page.locator(".ReactCrop__crop-selection")).toBeVisible()

  return image
}

test("a very tall image is fitted into the crop dialog rather than overflowing", async ({
  page,
}) => {
  const image = await openCropDialogWithTallImage(page)

  const metrics = await image.evaluate((element) => {
    const img = element as HTMLImageElement
    const wrapper = img.closest(".ReactCrop__child-wrapper")!
    const imgBox = img.getBoundingClientRect()
    const wrapperBox = wrapper.getBoundingClientRect()

    return {
      naturalHeight: img.naturalHeight,
      renderedHeight: imgBox.height,
      renderedWidth: imgBox.width,
      imgBottom: imgBox.bottom,
      wrapperBottom: wrapperBox.bottom,
      maxHeight: getComputedStyle(img).maxHeight,
    }
  })

  // Guards the actual defect: the cap used to be a percentage resolved against
  // an auto-height wrapper, so it was dropped and the image rendered at its full
  // natural height. A definite px value here is the fix.
  expect(metrics.maxHeight).toMatch(/^\d+(\.\d+)?px$/)

  expect(metrics.naturalHeight).toBe(IMAGE_HEIGHT)
  expect(metrics.renderedHeight).toBeGreaterThan(100)
  expect(metrics.renderedHeight).toBeLessThanOrEqual(IMAGE_CAP_PX + 2)

  // Nothing clipped: the whole image sits inside the overflow-hidden wrapper,
  // so every part of it can actually be selected.
  expect(metrics.imgBottom).toBeLessThanOrEqual(metrics.wrapperBottom + 1)

  // Aspect ratio preserved, which is what makes the percent -> natural mapping exact.
  expect(metrics.renderedWidth / metrics.renderedHeight).toBeCloseTo(
    IMAGE_WIDTH / IMAGE_HEIGHT,
    2,
  )
})

test("cropping the bottom of a tall image returns the bottom of the image", async ({
  page,
}) => {
  const image = await openCropDialogWithTallImage(page)

  const imageBox = (await image.boundingBox())!

  // Drag the north handle most of the way down, leaving roughly the bottom
  // fifth of the receipt selected.
  const northHandle = page.locator(".ReactCrop__drag-handle.ord-n")
  const handleBox = (await northHandle.boundingBox())!

  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + handleBox.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(
    imageBox.x + imageBox.width / 2,
    imageBox.y + imageBox.height * 0.8,
    { steps: 12 },
  )
  await page.mouse.up()

  // Derive expectations from the selection that actually landed, rather than
  // assuming the drag was pixel-exact.
  const selection = await page
    .locator(".ReactCrop__crop-selection")
    .evaluate((element) => {
      const box = element.getBoundingClientRect()
      return { top: box.top, height: box.height, width: box.width }
    })

  const topFraction = (selection.top - imageBox.y) / imageBox.height
  const heightFraction = selection.height / imageBox.height
  const widthFraction = selection.width / imageBox.width

  expect(topFraction).toBeGreaterThan(0.5)

  // Capture the cropped File as the preview is created for it.
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

  // Exact match: ReactCrop's drag handles are also role=button, and their
  // aria-labels contain the word "crop".
  await page
    .getByRole("button", { name: "Crop og fortsett", exact: true })
    .click()

  // Two steps on purpose: a synchronous predicate to wait on, then a single
  // async decode. An async predicate inside waitForFunction resolved to null
  // intermittently.
  await page.waitForFunction(() =>
    (window as unknown as { __captured: Blob[] }).__captured.some(
      (candidate) => candidate.type === "image/jpeg",
    ),
  )

  const cropped = await page.evaluate(async () => {
    const captured = (window as unknown as { __captured: Blob[] }).__captured
    const blob = captured.find((candidate) => candidate.type === "image/jpeg")!

    const bitmap = await createImageBitmap(blob)
    const canvas = document.createElement("canvas")
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(bitmap, 0, 0)

    const sample = (x: number, y: number) =>
      ctx.getImageData(x, y, 1, 1).data[0]!

    const midX = Math.floor(bitmap.width / 2)

    return {
      width: bitmap.width,
      height: bitmap.height,
      topBrightness: sample(midX, 1),
      centreBrightness: sample(midX, Math.floor(bitmap.height / 2)),
      bottomBrightness: sample(midX, bitmap.height - 2),
    }
  })

  // The ramp decodes each sample back to the y it was taken from, so the crop's
  // top, middle and bottom should line up with the selected span of the original.
  const expectedTopY = topFraction * IMAGE_HEIGHT
  const expectedBottomY = (topFraction + heightFraction) * IMAGE_HEIGHT

  const offsets = {
    top: Math.abs(decodeY(cropped.topBrightness) - expectedTopY),
    centre: Math.abs(
      decodeY(cropped.centreBrightness) - (expectedTopY + expectedBottomY) / 2,
    ),
    bottom: Math.abs(decodeY(cropped.bottomBrightness) - expectedBottomY),
  }

  expect(offsets.top).toBeLessThan(OFFSET_TOLERANCE_PX)
  expect(offsets.centre).toBeLessThan(OFFSET_TOLERANCE_PX)
  expect(offsets.bottom).toBeLessThan(OFFSET_TOLERANCE_PX)

  // The defect returned the top of the image regardless of what was selected.
  expect(decodeY(cropped.centreBrightness)).toBeGreaterThan(IMAGE_HEIGHT / 2)

  // Output stays within the upload pipeline's bounds, so nothing re-encodes it.
  expect(Math.max(cropped.width, cropped.height)).toBeLessThanOrEqual(
    MAX_OUTPUT_DIMENSION,
  )

  // Shape follows the selection.
  expect(cropped.width / cropped.height).toBeCloseTo(
    (widthFraction * IMAGE_WIDTH) / (heightFraction * IMAGE_HEIGHT),
    1,
  )
})

test("the preview of a cropped tall image shows the whole image", async ({
  page,
}) => {
  await openCropDialogWithTallImage(page)

  // Accept the default full-image selection; the result is still ~1:10.
  await page
    .getByRole("button", { name: "Crop og fortsett", exact: true })
    .click()

  await page.getByRole("button", { name: "tall-receipt.png" }).click()

  const preview = page.locator('[role="dialog"] img[alt="tall-receipt.png"]')
  await expect(preview).toBeVisible()

  const metrics = await preview.evaluate((element) => {
    const img = element as HTMLImageElement
    const box = img.getBoundingClientRect()
    const containerBox = img.parentElement!.getBoundingClientRect()
    return {
      naturalHeight: img.naturalHeight,
      renderedHeight: box.height,
      bottom: box.bottom,
      containerBottom: containerBox.bottom,
      maxHeight: getComputedStyle(img).maxHeight,
      viewportHeight: window.innerHeight,
    }
  })

  // A tall receipt is far taller than the viewport at its natural size, so a
  // percentage cap that fails to resolve leaves it overflowing rather than fitted.
  expect(metrics.maxHeight).toMatch(/^\d+(\.\d+)?px$/)
  expect(metrics.renderedHeight).toBeGreaterThan(50)
  expect(metrics.renderedHeight).toBeLessThanOrEqual(metrics.viewportHeight)
  expect(metrics.bottom).toBeLessThanOrEqual(metrics.containerBottom + 1)
})

test("the upload, crop and preview flow logs no React or a11y warnings", async ({
  page,
}) => {
  // React reports both of these through console.error at runtime only, so a
  // rendering test is the only thing that catches them.
  const problems: string[] = []
  page.on("console", (message) => {
    if (message.type() !== "error" && message.type() !== "warning") return
    const text = message.text()
    if (
      /cannot be given refs|Missing `Description`|aria-describedby/i.test(text)
    ) {
      problems.push(text)
    }
  })

  await openCropDialogWithTallImage(page)
  await page
    .getByRole("button", { name: "Crop og fortsett", exact: true })
    .click()
  await page.getByRole("button", { name: "tall-receipt.png" }).click()
  await expect(
    page.locator('[role="dialog"] img[alt="tall-receipt.png"]'),
  ).toBeVisible()

  expect(problems).toEqual([])
})
