import { createExpenseSchemas } from "@/lib/expense-schema"
import {
  formatIBANForDisplay,
  formatNorwegianBBANForDisplay,
  getBankCountryType,
} from "@/lib/banking"
import { resolvePayoutCurrency } from "@/lib/currency-country"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { z } from "zod"
import { formatCurrency } from "./utils"
import { convertCurrency, formatExchangeRate } from "./exchange-rates"

function bankDetailsLines(
  residesInNorway: boolean,
  bankCountryIso2: string,
  bankCountryDisplayName: string,
  bankIban: string,
  bankRoutingNumber: string,
  bankAccountNumber: string,
  bankAccountType: string,
  bankSwiftBic: string,
  bankName: string,
  bankAddress: string,
  bankAccountHolderName: string,
): { label: string; value: string }[] {
  if (residesInNorway) {
    return [
      {
        label: "Kontonummer:",
        value: formatNorwegianBBANForDisplay(bankAccountNumber || ""),
      },
    ]
  }

  const type = getBankCountryType(bankCountryIso2 || "")
  if (type === "sepa") {
    return [
      { label: "Land:", value: bankCountryDisplayName || "" },
      {
        label: "IBAN:",
        value: formatIBANForDisplay(bankIban || ""),
      },
      ...(bankSwiftBic
        ? [{ label: "SWIFT/BIC:", value: bankSwiftBic }]
        : []),
    ]
  }
  if (type === "us") {
    return [
      { label: "Land:", value: bankCountryDisplayName || "" },
      { label: "Routing (ABA):", value: bankRoutingNumber || "" },
      { label: "Kontonummer:", value: bankAccountNumber || "" },
      {
        label: "Kontotype:",
        value: bankAccountType === "savings" ? "Savings" : "Checking",
      },
      { label: "SWIFT/BIC:", value: bankSwiftBic || "" },
      { label: "Bank:", value: bankName || "" },
      { label: "Bankadresse:", value: bankAddress || "" },
      { label: "Kontoinnehaver:", value: bankAccountHolderName || "" },
    ]
  }
  return [
    { label: "Land:", value: bankCountryDisplayName || "" },
    { label: "Kontonummer:", value: bankAccountNumber || "" },
    ...(bankIban
      ? [{ label: "IBAN:", value: formatIBANForDisplay(bankIban) }]
      : []),
    { label: "SWIFT/BIC:", value: bankSwiftBic || "" },
    { label: "Bank:", value: bankName || "" },
    { label: "Bankadresse:", value: bankAddress || "" },
    { label: "Kontoinnehaver:", value: bankAccountHolderName || "" },
  ]
}

export async function generatePDF({
  name,
  streetAddress,
  postalCode,
  city,
  country,
  residesInNorway,
  bankCountryIso2,
  bankCountryDisplayName = "",
  bankIban,
  bankRoutingNumber,
  bankAccountNumber,
  bankAccountType,
  bankSwiftBic,
  bankName,
  bankAddress,
  bankAccountHolderName,
  email,
  expenses,
  validationSkipped = false,
  logoPngBytes,
  countryDisplayName,
}: z.infer<ReturnType<typeof createExpenseSchemas>["formSchema"]> & {
  validationSkipped?: boolean
  logoPngBytes?: ArrayBuffer
  /** Full country name for address (e.g. "Norge"). When not set, `country` is used. */
  countryDisplayName?: string
  /** Full bank country name for report (e.g. "Tyskland"). */
  bankCountryDisplayName?: string
}) {
  const pdfDoc = await PDFDocument.create()
  const now = new Date()
  pdfDoc.setTitle("Utleggsrapport – javaBin")
  pdfDoc.setAuthor("javaBin")
  pdfDoc.setCreationDate(now)
  pdfDoc.setModificationDate(now)

  const coverPage = pdfDoc.addPage()
  const { height, width: pageWidth } = coverPage.getSize()
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // javaBin brand colors (rgb 0–1)
  const jzDark = rgb(0x22 / 255, 0x22 / 255, 0x22 / 255)
  const jzYellow = rgb(0xfe / 255, 0xd1 / 255, 0x36 / 255)
  const jzGray = rgb(0.92, 0.92, 0.92)
  const borderGray = rgb(0.5, 0.5, 0.5)

  // Payout in the bank country's currency (NOK for Norwegian accounts)
  const payoutCurrency = resolvePayoutCurrency(
    residesInNorway ?? true,
    bankCountryIso2 || "",
  )

  const hasLogo = logoPngBytes != null && logoPngBytes.byteLength > 0
  const headerBarHeight = hasLogo ? 36 : 8
  const headerTop = height - headerBarHeight

  coverPage.drawRectangle({
    x: 0,
    y: headerTop,
    width: pageWidth,
    height: headerBarHeight,
    color: jzDark,
  })

  if (hasLogo) {
    const logoImage = await pdfDoc.embedPng(new Uint8Array(logoPngBytes))
    const logoDrawHeight = 26
    const scaled = logoImage.scaleToFit(9999, logoDrawHeight)
    const logoX = 50
    const logoY = headerTop + (headerBarHeight - scaled.height) / 2
    coverPage.drawImage(logoImage, {
      x: logoX,
      y: logoY,
      width: scaled.width,
      height: scaled.height,
    })
  }

  const titleY = headerTop - 28
  coverPage.drawText("Utleggsrapport", {
    x: 50,
    y: titleY,
    size: 24,
    font,
    color: jzDark,
  })
  if (!hasLogo) {
    coverPage.drawText("javaBin", {
      x: 50,
      y: titleY - 23,
      size: 11,
      font: regularFont,
      color: jzYellow,
    })
  }

  const bankCountryDisplay = bankCountryDisplayName ?? ""
  const bankLines = bankDetailsLines(
    residesInNorway ?? true,
    bankCountryIso2 ?? "",
    bankCountryDisplay,
    bankIban ?? "",
    bankRoutingNumber ?? "",
    bankAccountNumber ?? "",
    bankAccountType ?? "checking",
    bankSwiftBic ?? "",
    bankName ?? "",
    bankAddress ?? "",
    bankAccountHolderName ?? "",
  )

  const addressCountry = (countryDisplayName ?? country ?? "").trim()
  const addressParts = [
    streetAddress?.trim(),
    [postalCode?.trim(), city?.trim()].filter(Boolean).join(" "),
    addressCountry,
  ].filter(Boolean)
  const addressLine = addressParts
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(", ")
    .replace(/\s+/g, " ")
    .trim()

  type InfoLine =
    | { label: string; value: string }
    | { label: string; value: string; sectionHeader: true }
  const infoLines: InfoLine[] = [
    { label: "Navn:", value: name?.trim() ?? "" },
    { label: "Adresse:", value: addressLine },
    { label: "E-post:", value: email },
    { label: "", value: "Bankinformasjon", sectionHeader: true },
    ...bankLines,
    { label: "Utbetalingsvaluta:", value: payoutCurrency },
  ]

  // Section: Rapportinfo
  let infoStartY = height - 118
  coverPage.drawText("Rapportinfo", {
    x: 50,
    y: infoStartY,
    size: 10,
    font,
    color: borderGray,
  })
  infoStartY -= 22

  if (validationSkipped) {
    coverPage.drawText("ADVARSEL: Kontonummer validering ble hoppet over!", {
      x: 50,
      y: infoStartY,
      size: 12,
      font,
      color: rgb(0.8, 0, 0), // Red color
    })
    infoStartY -= 20
    coverPage.drawText("Vennligst sjekk at kontonummeret er korrekt.", {
      x: 50,
      y: infoStartY,
      size: 10,
      font: regularFont,
      color: rgb(0.6, 0, 0), // Darker red
    })
    infoStartY -= 20
  }

  const labelFontSize = 12
  const margin = 50
  const maxLabelWidth = Math.max(
    ...infoLines.map((line) =>
      font.widthOfTextAtSize(line.label, labelFontSize),
    ),
  )
  const valueX = 50 + maxLabelWidth + 15
  const valueMaxWidth = pageWidth - margin - valueX

  function wrapToWidth(
    text: string,
    maxWidth: number,
    measureFont = regularFont,
    measureSize = labelFontSize,
  ): string[] {
    const lines: string[] = []
    let remaining = text
    while (remaining.length > 0) {
      if (measureFont.widthOfTextAtSize(remaining, measureSize) <= maxWidth) {
        lines.push(remaining)
        break
      }
      let low = 1
      let high = remaining.length
      while (low < high) {
        const mid = Math.ceil((low + high) / 2)
        const candidate = remaining.slice(0, mid)
        if (measureFont.widthOfTextAtSize(candidate, measureSize) <= maxWidth)
          low = mid
        else high = mid - 1
      }
      const chunk = remaining.slice(0, low)
      const lastSpace = chunk.lastIndexOf(" ")
      const splitAt =
        lastSpace > 0 && lastSpace > chunk.length * 0.5 ? lastSpace + 1 : low
      lines.push(remaining.slice(0, splitAt).trimEnd())
      remaining = remaining.slice(splitAt).trimStart()
    }
    return lines
  }

  type InfoLineRow = { label: string; value: string; sectionHeader?: boolean }
  const expandedInfoLines: InfoLineRow[] = []
  for (const line of infoLines) {
    if ("sectionHeader" in line && line.sectionHeader) {
      expandedInfoLines.push({
        label: "",
        value: line.value,
        sectionHeader: true,
      })
      continue
    }
    const value = line.value
    const wrapped = wrapToWidth(value, valueMaxWidth)
    wrapped.forEach((chunk, i) => {
      expandedInfoLines.push({
        label: i === 0 ? line.label : "",
        value: chunk,
      })
    })
  }

  const lineHeight = 24
  expandedInfoLines.forEach((line, index) => {
    const y = infoStartY - index * lineHeight
    if (line.sectionHeader) {
      coverPage.drawText(line.value, {
        x: 50,
        y,
        size: 10,
        font,
        color: borderGray,
      })
      return
    }
    if (line.label) {
      coverPage.drawText(line.label, {
        x: 50,
        y,
        size: labelFontSize,
        font,
        color: jzDark,
      })
    }
    coverPage.drawText(line.value, {
      x: valueX,
      y,
      size: labelFontSize,
      font: regularFont,
      color: rgb(0, 0, 0),
    })
  })

  // Add expense items table (position below variable-length bank details)
  const gapAboveTable = 36
  const tableTopY = infoStartY - expandedInfoLines.length * lineHeight - gapAboveTable
  const usableWidth = pageWidth - 2 * margin

  // Separator line above table
  coverPage.drawLine({
    start: { x: margin, y: tableTopY + 18 },
    end: { x: pageWidth - margin, y: tableTopY + 18 },
    thickness: 0.5,
    color: borderGray,
  })

  const tableTop = tableTopY
  const headerHeight = 30

  const headerTextY = tableTop - 14
  const headerBottomY = tableTop - headerHeight
  const gapHeaderToFirstRow = 6
  const firstRowTopY = headerBottomY - gapHeaderToFirstRow

  // Rebalance columns: keep NOK amount clean and move FX details into its own column.
  const rebalancedColumns = {
    attachment: { x: margin, width: usableWidth * 0.05 },
    description: { x: margin + usableWidth * 0.05, width: usableWidth * 0.33 },
    date: { x: margin + usableWidth * 0.38, width: usableWidth * 0.14 },
    exchange: { x: margin + usableWidth * 0.52, width: usableWidth * 0.22 },
    amount: { x: margin + usableWidth * 0.74, width: usableWidth * 0.26 },
  }

  // Table header background and headers
  coverPage.drawRectangle({
    x: margin,
    y: tableTop - headerHeight,
    width: usableWidth,
    height: headerHeight,
    color: jzGray,
  })
  const headerTexts = {
    attachment: "#",
    description: "Beskrivelse",
    date: "Dato",
    exchange: "Valutakurs",
    exchangeSubtext: "Norges Bank",
    amount: `Beløp (${payoutCurrency})`,
  }
  for (const key of Object.keys(rebalancedColumns) as Array<
    keyof typeof rebalancedColumns
  >) {
    coverPage.drawText(headerTexts[key], {
      x: rebalancedColumns[key].x,
      y: headerTextY,
      size: 11,
      font,
      color: jzDark,
    })
    if (key === "exchange") {
      coverPage.drawText(headerTexts.exchangeSubtext, {
        x: rebalancedColumns[key].x,
        y: headerTextY - 12,
        size: 8,
        font: regularFont,
        color: borderGray,
      })
    }
  }

  const dataFontSize = 10
  const dataLineHeight = 12
  const rowPaddingTop = 8
  const rowPaddingBottom = 8
  const baseRowHeight = dataLineHeight + rowPaddingTop + rowPaddingBottom

  const preparedRows: Array<{
    index: number
    hasAttachment: boolean
    descriptionLines: string[]
    dateText: string
    exchangeLines: string[]
    amountText: string
    rowHeight: number
  }> = []

  let totalAmount = 0
  for (const [index, expense] of expenses.entries()) {
    const expenseDate = new Date(expense.date)
    const dateText = expenseDate.toLocaleDateString("no-NO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })

    let amountInTarget: number | null
    let exchangeRawLines: string[]

    // Convert expense currency to payout currency
    if (expense.currency === payoutCurrency) {
      amountInTarget = expense.amount
      exchangeRawLines = ["-"]
    } else {
      const conversion = await convertCurrency(
        expense.amount,
        expense.currency,
        payoutCurrency,
        expenseDate,
      )
      if (conversion) {
        amountInTarget = conversion.amount
        exchangeRawLines = [
          `${formatCurrency(expense.amount)} ${expense.currency}`,
          `1 ${expense.currency} = ${formatExchangeRate(conversion.rate, conversion.unitMultiplier)} ${payoutCurrency}`,
          `Kursdato: ${conversion.rateDate.toLocaleDateString("no-NO", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })}`,
        ]
      } else {
        // Don't mix an unconverted amount into the payout-currency total
        amountInTarget = null
        exchangeRawLines = [
          `${formatCurrency(expense.amount)} ${expense.currency}`,
          "Kurs: ikke tilgjengelig",
        ]
      }
    }
    if (amountInTarget != null) {
      totalAmount += amountInTarget
    }

    const amountText =
      amountInTarget != null ? formatCurrency(amountInTarget) : "—"

    const descriptionLines = wrapToWidth(
      expense.description,
      rebalancedColumns.description.width,
    )
    const exchangeLines = exchangeRawLines.flatMap((line) =>
      wrapToWidth(line, rebalancedColumns.exchange.width),
    )

    const normalizedDescriptionLines =
      descriptionLines.length > 0 ? descriptionLines : [""]
    const normalizedExchangeLines = exchangeLines.length > 0 ? exchangeLines : [""]
    const lineCount = Math.max(
      normalizedDescriptionLines.length,
      normalizedExchangeLines.length,
      1,
    )
    const dynamicRowHeight = Math.max(
      baseRowHeight,
      rowPaddingTop + rowPaddingBottom + lineCount * dataLineHeight,
    )

    preparedRows.push({
      index,
      hasAttachment: Boolean(expense.attachment),
      descriptionLines: normalizedDescriptionLines,
      dateText,
      exchangeLines: normalizedExchangeLines,
      amountText,
      rowHeight: dynamicRowHeight,
    })
  }

  let currentRowTopY = firstRowTopY
  for (const row of preparedRows) {
    const rowBottomY = currentRowTopY - row.rowHeight
    const baselineY = currentRowTopY - rowPaddingTop - dataFontSize

    if (row.index % 2 === 1) {
      coverPage.drawRectangle({
        x: margin,
        y: rowBottomY,
        width: usableWidth,
        height: row.rowHeight,
        color: jzGray,
      })
    }

    row.descriptionLines.forEach((line, lineIndex) => {
      coverPage.drawText(line, {
        x: rebalancedColumns.description.x,
        y: baselineY - lineIndex * dataLineHeight,
        size: dataFontSize,
        font: regularFont,
        color: rgb(0, 0, 0),
      })
    })

    coverPage.drawText(row.dateText, {
      x: rebalancedColumns.date.x,
      y: baselineY,
      size: dataFontSize,
      font: regularFont,
      color: rgb(0, 0, 0),
    })

    row.exchangeLines.forEach((line, lineIndex) => {
      coverPage.drawText(line, {
        x: rebalancedColumns.exchange.x,
        y: baselineY - lineIndex * dataLineHeight,
        size: dataFontSize,
        font: regularFont,
        color: rgb(0, 0, 0),
      })
    })

    coverPage.drawText(row.amountText, {
      x:
        rebalancedColumns.amount.x +
        rebalancedColumns.amount.width -
        regularFont.widthOfTextAtSize(row.amountText, dataFontSize),
      y: baselineY,
      size: dataFontSize,
      font: regularFont,
      color: rgb(0, 0, 0),
    })

    if (row.hasAttachment) {
      coverPage.drawText(`${row.index + 1}`, {
        x: rebalancedColumns.attachment.x,
        y: baselineY,
        size: dataFontSize,
        font: regularFont,
        color: rgb(0, 0, 0),
      })
    }

    currentRowTopY = rowBottomY
  }

  const gapBeforeTotalRow = 12
  const totalRowHeight = 30
  const totalRowTopY = currentRowTopY - gapBeforeTotalRow

  coverPage.drawLine({
    start: { x: margin, y: totalRowTopY + 2 },
    end: { x: pageWidth - margin, y: totalRowTopY + 2 },
    thickness: 0.5,
    color: borderGray,
  })
  coverPage.drawRectangle({
    x: margin,
    y: totalRowTopY - totalRowHeight,
    width: usableWidth,
    height: totalRowHeight,
    color: jzGray,
  })

  const formattedTotalAmount = `${formatCurrency(totalAmount)} ${payoutCurrency}`
  const totalAmountWidth = font.widthOfTextAtSize(formattedTotalAmount, 12)
  const totalLabelWidth = font.widthOfTextAtSize("Total:", 12)
  const totalLabelSpacing = 10
  const totalBaselineY = totalRowTopY - 21

  coverPage.drawText("Total:", {
    x:
      rebalancedColumns.amount.x +
      rebalancedColumns.amount.width -
      totalAmountWidth -
      totalLabelWidth -
      totalLabelSpacing,
    y: totalBaselineY,
    size: 12,
    font,
    color: jzDark,
  })
  coverPage.drawText(formattedTotalAmount, {
    x: rebalancedColumns.amount.x + rebalancedColumns.amount.width - totalAmountWidth,
    y: totalBaselineY,
    size: 12,
    font,
    color: jzDark,
  })

  // Footer on cover page
  const footerY = 36
  const generatedStr = now.toLocaleDateString("no-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  coverPage.drawText(`Generert: ${generatedStr}`, {
    x: margin,
    y: footerY,
    size: 9,
    font: regularFont,
    color: borderGray,
  })
  coverPage.drawText("javaBin · Utleggsrapport", {
    x: pageWidth - margin - regularFont.widthOfTextAtSize("javaBin · Utleggsrapport", 9),
    y: footerY,
    size: 9,
    font: regularFont,
    color: borderGray,
  })

  // Add attachments with labels
  for (const [index, expense] of expenses.entries()) {
    let receiptBytes: ArrayBufferLike
    const attachment = expense.attachment
    // Convert images to PDF if needed
    if (attachment.type.startsWith("image/")) {
      const pdfBytes = await imageFileToPdf(attachment)
      receiptBytes = pdfBytes.buffer as ArrayBuffer
    } else {
      receiptBytes = (await attachment.arrayBuffer()) as ArrayBuffer
    }

    const receiptPdf = await PDFDocument.load(receiptBytes)
    const receiptPages = await pdfDoc.copyPages(
      receiptPdf,
      receiptPdf.getPageIndices(),
    )

    for (const page of receiptPages) {
      const attachmentPage = pdfDoc.addPage(page)
      const expenseDate = new Date(expense.date)
      const formattedDate = expenseDate.toLocaleDateString("no-NO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      const headerText = `Bilag for utlegg #${index + 1}: ${expense.description} (${formattedDate})`
      const attachmentHeaderWidth = attachmentPage.getWidth() - 2 * margin
      const headerLines = wrapToWidth(headerText, attachmentHeaderWidth, font, 12)
      const headerLineHeight = 14
      const headerTopY =
        attachmentPage.getHeight() - (regularFont.heightAtSize(12) + 5)
      headerLines.forEach((line, lineIndex) => {
        attachmentPage.drawText(line, {
          x: margin,
          y: headerTopY - lineIndex * headerLineHeight,
          size: 12,
          font,
          color: jzDark,
        })
      })
    }
  }

  return pdfDoc.save()
}

// Add helper function to convert image to PDF
const imageFileToPdf = async (file: File): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4 size in points

  const imageBytes = await file.arrayBuffer()
  let image

  if (file.type === "image/jpeg") {
    image = await pdfDoc.embedJpg(imageBytes)
  } else if (file.type === "image/png") {
    image = await pdfDoc.embedPng(imageBytes)
  } else {
    throw new Error("Unsupported image format")
  }

  // Calculate dimensions to fit the page while maintaining aspect ratio
  const { width, height } = image.scale(1)
  const aspectRatio = width / height
  const maxWidth = 500 // Leave some margin
  const maxHeight = 747 // Leave some margin
  let scaledWidth = width
  let scaledHeight = height

  if (width > maxWidth || height > maxHeight) {
    if (width / maxWidth > height / maxHeight) {
      scaledWidth = maxWidth
      scaledHeight = maxWidth / aspectRatio
    } else {
      scaledHeight = maxHeight
      scaledWidth = maxHeight * aspectRatio
    }
  }

  page.drawImage(image, {
    x: (page.getWidth() - scaledWidth) / 2,
    y: (page.getHeight() - scaledHeight) / 2,
    width: scaledWidth,
    height: scaledHeight,
  })

  return await pdfDoc.save()
}
