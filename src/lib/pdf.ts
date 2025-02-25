import { createExpenseSchemas } from "@/lib/expense"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { z } from "zod"

export async function generatePDF({
  name,
  streetAddress,
  postalCode,
  city,
  country,
  bankAccount,
  email,
  date,
  expenses,
}: z.infer<ReturnType<typeof createExpenseSchemas>["formSchema"]>) {
  const pdfDoc = await PDFDocument.create()
  const coverPage = pdfDoc.addPage()
  const { height } = coverPage.getSize()
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Title
  coverPage.drawText("Utleggsrapport", {
    x: 50,
    y: height - 50,
    size: 24,
    font,
    color: rgb(0, 0, 0),
  })

  // Format date
  const formattedDate = new Date(date).toLocaleDateString("no-NO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Personal information
  const infoLines = [
    { label: "Navn:", value: name },
    { label: "Adresse:", value: `${streetAddress}, ${postalCode} ${city}, ${country}` },
    { label: "Kontonummer:", value: bankAccount.replace(/\s/g, "") },
    { label: "E-post:", value: email },
    { label: "Dato:", value: formattedDate },
  ]

  infoLines.forEach((line, index) => {
    // Draw label
    coverPage.drawText(line.label, {
      x: 50,
      y: height - 120 - index * 30,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    })

    // Draw value
    coverPage.drawText(line.value, {
      x: 150,
      y: height - 120 - index * 30,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    })
  })

  // Add expense items table
  const tableTop = height - 275
  const rowHeight = 30
  const pageWidth = coverPage.getWidth();
  const margin = 50; // Left and right page margins
  const usableWidth = pageWidth - (2 * margin);
  
  // Adjust column widths to ensure amounts fit
  const columns = {
    attachment: { x: margin, width: usableWidth * 0.1 },
    description: { x: margin + (usableWidth * 0.1), width: usableWidth * 0.4 },
    category: { x: margin + (usableWidth * 0.5), width: usableWidth * 0.3 },
    amount: { x: margin + (usableWidth * 0.8), width: usableWidth * 0.2 },
  }

  // Table headers
  Object.entries(columns).forEach(([key, { x }]) => {
    const headerTexts = {
      attachment: "#",
      description: "Beskrivelse",
      category: "Kategori",
      amount: "Beløp"
    };
    
    coverPage.drawText(headerTexts[key as keyof typeof headerTexts], {
      x,
      y: tableTop,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    })
  })

  // Table rows
  let totalAmount = 0
  
  // Create Norwegian number formatter
  const numberFormatter = new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  expenses.forEach((expense, index) => {
    const y = tableTop - (index + 1) * rowHeight

    coverPage.drawText(expense.description, {
      x: columns.description.x,
      y,
      size: 10,
      font: regularFont,
      color: rgb(0, 0, 0),
      maxWidth: columns.description.width,
    })

    coverPage.drawText(expense.category, {
      x: columns.category.x,
      y,
      size: 10,
      font: regularFont,
      color: rgb(0, 0, 0),
      maxWidth: columns.category.width,
    })

    // Format amount using Norwegian locale
    const formattedAmount = numberFormatter.format(expense.amount)
    
    // Right-align the amount within its column
    coverPage.drawText(formattedAmount, {
      x: columns.amount.x + columns.amount.width - 
         regularFont.widthOfTextAtSize(formattedAmount, 10),
      y,
      size: 10,
      font: regularFont,
      color: rgb(0, 0, 0),
    })

    if (expense.attachment) {
      coverPage.drawText(`${index + 1}`, {
        x: columns.attachment.x,
        y,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0),
        maxWidth: columns.attachment.width,
      })
    }

    totalAmount += expense.amount
  })

  // Format total amount using Norwegian locale
  const formattedTotalAmount = numberFormatter.format(totalAmount)
  const totalAmountWidth = font.widthOfTextAtSize(formattedTotalAmount, 12)
  const totalLabelWidth = font.widthOfTextAtSize("Total:", 12)
  const totalLabelSpacing = 10 // Space between label and amount
  
  // Position the total label to the left of the amount, ensuring no overlap
  coverPage.drawText("Total:", {
    x: columns.amount.x + columns.amount.width - totalAmountWidth - totalLabelWidth - totalLabelSpacing,
    y: tableTop - (expenses.length + 1) * rowHeight,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  })

  // Position the total amount right-aligned in its column
  coverPage.drawText(formattedTotalAmount, {
    x: columns.amount.x + columns.amount.width - totalAmountWidth,
    y: tableTop - (expenses.length + 1) * rowHeight,
    size: 12,
    font,
    color: rgb(0, 0, 0),
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
      // Add a header to identify which expense this attachment belongs to
      const attachmentPage = pdfDoc.addPage(page)
      attachmentPage.drawText(
        `Vedlegg for utlegg #${index + 1}: ${expense.description}`,
        {
          x: 50,
          y: attachmentPage.getHeight() - (regularFont.heightAtSize(12) + 5),
          size: 12,
          font,
          color: rgb(0, 0, 0),
        },
      )
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
