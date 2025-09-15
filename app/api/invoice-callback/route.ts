import { type NextRequest, NextResponse } from "next/server"
import InvoiceStateManager from "@/lib/invoice-state"

// Invoice callback API endpoint to receive PDF URLs from Make.com
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pdf_url, invoice_number, status, message } = body

    console.log("📩 Invoice callback received:")
    console.log("  - Invoice Number:", invoice_number)
    console.log("  - PDF URL:", pdf_url)
    console.log("  - Status:", status)
    console.log("  - Message:", message)

    // Validate required fields
    if (!pdf_url) {
      console.error("❌ Missing pdf_url in callback")
      return NextResponse.json(
        { error: "pdf_url is required" },
        { status: 400 }
      )
    }

    if (!invoice_number) {
      console.error("❌ Missing invoice_number in callback")
      return NextResponse.json(
        { error: "invoice_number is required" },
        { status: 400 }
      )
    }

    // Validate PDF URL format
    try {
      new URL(pdf_url)
    } catch {
      console.error("❌ Invalid PDF URL format:", pdf_url)
      return NextResponse.json(
        { error: "Invalid PDF URL format" },
        { status: 400 }
      )
    }

    // 👉 Update invoice status in state management
    const updatedStatus = InvoiceStateManager.markAsCompleted(invoice_number, pdf_url)
    
    if (!updatedStatus) {
      console.warn(`⚠️ Invoice ${invoice_number} not found in state, creating new entry`)
      InvoiceStateManager.createInvoice(invoice_number)
      InvoiceStateManager.markAsCompleted(invoice_number, pdf_url)
    }

    console.log("✅ Invoice callback processed successfully")
    console.log(`📄 PDF ready for download: ${pdf_url}`)
    console.log(`📊 Updated status for invoice: ${invoice_number}`)

    // TODO: Implement database storage
    // await saveInvoiceToDatabase({
    //   invoice_number,
    //   pdf_url,
    //   status: 'completed',
    //   created_at: new Date(),
    //   updated_at: new Date()
    // })

    // TODO: Implement WebSocket notification
    // await notifyClient(invoice_number, pdf_url)

    // TODO: Implement email notification
    // await sendEmailNotification(invoice_number, pdf_url)

    return NextResponse.json({ 
      message: "Invoice callback received successfully",
      invoice_number,
      pdf_url,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("❌ Invoice callback error:", error)
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({
    message: "Invoice callback endpoint is active",
    endpoint: "/api/invoice-callback",
    method: "POST",
    expected_body: {
      pdf_url: "https://example.com/invoice.pdf",
      invoice_number: "INV-2025-001",
      status: "success",
      message: "Invoice generated successfully"
    },
    timestamp: new Date().toISOString()
  })
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  )
}
