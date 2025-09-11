import type { InvoiceData } from "@/components/invoice-form"

export function calculateInvoiceTotals(invoiceData: InvoiceData): InvoiceData {
  // Calculate subtotal from line items
  const subtotal = invoiceData.line_items.reduce((sum, item) => sum + item.total, 0)

  // Calculate taxes
  const taxes = (subtotal * invoiceData.tax_rate) / 100

  // Calculate total due
  const total_due = subtotal + taxes

  // Generate invoice number if not set
  let invoice_number = invoiceData.invoice_number
  if (!invoice_number) {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "")
    const randomSuffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    invoice_number = `INV-${dateStr}-${randomSuffix}`
  }

  return {
    ...invoiceData,
    invoice_number,
    subtotal: Number.parseFloat(subtotal.toFixed(2)),
    taxes: Number.parseFloat(taxes.toFixed(2)),
    total_due: Number.parseFloat(total_due.toFixed(2)),
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
