import type { InvoiceData } from "@/components/invoice-form"

export interface WebhookResponse {
  status: "success" | "error"
  pdf_url?: string
  message?: string
}

export interface WebhookConfig {
  url: string
  headers?: Record<string, string>
}

// Default webhook configuration - hardcoded for security
const DEFAULT_WEBHOOK_CONFIG: WebhookConfig = {
  url: "http://localhost:5678/webhook-test/88743cc0-d465-4fdb-a322-91f402cf6386",
  headers: {
    "Content-Type": "application/json",
  },
}

export async function submitInvoiceToWebhook(
  invoiceData: InvoiceData,
  config: WebhookConfig = DEFAULT_WEBHOOK_CONFIG,
): Promise<WebhookResponse> {
  try {
    // Transform invoice data to match the expected JSON schema
    const payload = transformInvoiceDataForWebhook(invoiceData)

    console.log("[v0] Submitting invoice to webhook:", config.url)
    console.log("[v0] Payload:", JSON.stringify(payload, null, 2))

    const response = await fetch(config.url, {
      method: "POST",
      headers: config.headers || {},
      body: JSON.stringify(payload),
    })

    console.log("[v0] Webhook response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] Webhook error response:", errorText)
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`)
    }

    let responseData
    try {
      responseData = await response.json()
      console.log("[v0] Webhook response data:", responseData)
    } catch {
      // If response is not JSON, treat as success
      responseData = { status: "success" }
    }

    // Check for PDF URL in various possible response formats
    const pdfUrl = responseData.pdf_url || responseData.pdfUrl || responseData.download_url || responseData.url

    return {
      status: "success",
      pdf_url: pdfUrl,
      message: responseData.message || "Invoice submitted successfully",
    }
  } catch (error) {
    console.error("[v0] Webhook submission error:", error)

    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

function transformInvoiceDataForWebhook(invoiceData: InvoiceData) {
  // Transform line items to individual item/price pairs for template placeholders
  const itemPlaceholders: Record<string, string | number> = {}

  invoiceData.line_items.forEach((item, index) => {
    const itemNum = index + 1
    itemPlaceholders[`item${itemNum}`] = item.description
    itemPlaceholders[`price${itemNum}`] = item.unit_price
    itemPlaceholders[`quantity${itemNum}`] = item.quantity
    itemPlaceholders[`total${itemNum}`] = item.total
  })

  return {
    // Invoice metadata
    invoice_number: invoiceData.invoice_number,
    invoice_date: invoiceData.invoice_date,
    due_date: invoiceData.due_date,

    // Client information
    client_name: invoiceData.client_name,
    client_address: invoiceData.client_address,
    client_city: invoiceData.client_city,
    client_state_zip: invoiceData.client_state_zip,
    client_email: invoiceData.client_email,
    client_phone: invoiceData.client_phone,

    // Line items as individual placeholders (for template compatibility)
    ...itemPlaceholders,

    // Structured line items array (for modern processing)
    line_items: invoiceData.line_items,

    // Totals
    subtotal: invoiceData.subtotal,
    tax_rate: invoiceData.tax_rate,
    taxes: invoiceData.taxes,
    total_due: invoiceData.total_due,

    // Additional information
    notes: invoiceData.notes,

    // Metadata for webhook processing
    timestamp: new Date().toISOString(),
    source: "alpha-business-digital-invoice-app",
  }
}

export async function testWebhookConnection(config: WebhookConfig = DEFAULT_WEBHOOK_CONFIG): Promise<boolean> {
  try {
    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      message: "Connection test from Alpha Business Digital Invoice App",
    }

    const response = await fetch(config.url, {
      method: "POST",
      headers: config.headers || {},
      body: JSON.stringify(testPayload),
    })

    return response.ok
  } catch (error) {
    console.error("[v0] Webhook connection test failed:", error)
    return false
  }
}

// Utility function to validate webhook URL format
export function validateWebhookUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:"
  } catch {
    return false
  }
}
