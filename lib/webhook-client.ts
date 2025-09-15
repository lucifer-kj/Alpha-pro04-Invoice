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

export interface MakeWebhookData {
  eventType: string
  payload: Record<string, any>
  metadata?: {
    scenarioId?: string
    executionId?: string
    invoice_number?: string
    pdf_url?: string
  }
}

// Default webhook configuration - simple localhost API
const DEFAULT_WEBHOOK_CONFIG: WebhookConfig = {
  url: "http://localhost:5678/webhook-test/invoice-webhook",
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

    console.log("[v0] Submitting invoice to localhost API:", config.url)
    console.log("[v0] Payload:", JSON.stringify(payload, null, 2))

    // Simple fetch to localhost API - exactly as requested
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    console.log("[v0] API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] API error:", errorText)
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    let responseData
    try {
      responseData = await response.json()
      console.log("[v0] API response data:", responseData)
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
    console.error("[v0] API submission error:", error)

    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

function transformInvoiceDataForWebhook(invoiceData: InvoiceData) {
  // Clean, simple data structure for n8n webhook
  return {
    // Invoice basic info
    invoice_number: invoiceData.invoice_number,
    invoice_date: invoiceData.invoice_date,
    due_date: invoiceData.due_date,
    
    // Client details
    client: {
      name: invoiceData.client_name,
      email: invoiceData.client_email,
      phone: invoiceData.client_phone,
      address: invoiceData.client_address,
      city: invoiceData.client_city,
      state_zip: invoiceData.client_state_zip,
    },
    
    // Services/Items
    services: invoiceData.line_items.map((item, index) => ({
      id: index + 1,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
    })),
    
    // Financial summary
    totals: {
      subtotal: invoiceData.subtotal,
      tax_rate: invoiceData.tax_rate,
      taxes: invoiceData.taxes,
      total_due: invoiceData.total_due,
    },
    
    // Additional info
    notes: invoiceData.notes,
    
    // Metadata
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

    console.log("[v0] Testing n8n webhook connection:", config.url)

    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    })

    console.log("[v0] n8n webhook test response:", response.status)
    return response.ok
  } catch (error) {
    console.error("[v0] n8n webhook connection test failed:", error)
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

// Function to send data to Make.com webhook endpoint
export async function sendToMakeWebhook(
  data: MakeWebhookData,
  config: WebhookConfig = { url: "/api/webhooks/make" }
): Promise<WebhookResponse> {
  try {
    console.log("[Make.com] Sending data to webhook:", config.url)
    console.log("[Make.com] Data:", JSON.stringify(data, null, 2))

    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_MAKE_WEBHOOK_SECRET || 'default-secret'}`,
        ...(config.headers || {}),
      },
      body: JSON.stringify(data),
    })

    console.log("[Make.com] Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[Make.com] Error response:", errorText)
      throw new Error(`Make.com webhook failed: ${response.status} ${response.statusText}`)
    }

    const responseData = await response.json()
    console.log("[Make.com] Response data:", responseData)

    return {
      status: "success",
      message: responseData.message || "Data sent to Make.com successfully",
    }
  } catch (error) {
    console.error("[Make.com] Send error:", error)

    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Function to get Make.com webhook data (development only)
export async function getMakeWebhookData(): Promise<MakeWebhookData[]> {
  try {
    const response = await fetch("/api/webhooks/make")
    
    if (!response.ok) {
      throw new Error(`Failed to fetch webhook data: ${response.status}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error("[Make.com] Fetch error:", error)
    return []
  }
}
