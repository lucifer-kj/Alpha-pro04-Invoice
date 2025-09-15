export const runtime = 'nodejs'
import { type NextRequest, NextResponse } from "next/server"
import InvoiceStateManager from "@/lib/invoice-state"

// Get invoice status by invoice number
export async function GET(
  request: NextRequest,
  { params }: { params: { invoiceNumber: string } }
) {
  try {
    const { invoiceNumber } = params

    if (!invoiceNumber) {
      return NextResponse.json(
        { error: "Invoice number is required" },
        { status: 400 }
      )
    }

    const status = InvoiceStateManager.getInvoiceStatus(invoiceNumber)

    if (!status) {
      // Return a default pending status instead of 404 for better UX
      return NextResponse.json(
        { 
          invoice_number: invoiceNumber,
          status: "pending",
          message: "Invoice submitted, waiting for processing",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { status: 200 }
      )
    }

    console.log(`[INVOICE-STATUS] Retrieved status for ${invoiceNumber}:`, status.status)

    return NextResponse.json({
      ...status,
      message: "Invoice status retrieved successfully"
    })

  } catch (error) {
    console.error("[INVOICE-STATUS] Error:", error)
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// Update invoice status (for manual updates if needed)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { invoiceNumber: string } }
) {
  try {
    const { invoiceNumber } = params
    const body = await request.json()
    const { status, pdf_url, error_message } = body

    if (!invoiceNumber) {
      return NextResponse.json(
        { error: "Invoice number is required" },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['pending', 'generating', 'completed', 'failed']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const updatedStatus = InvoiceStateManager.updateInvoiceStatus(invoiceNumber, {
      status,
      pdf_url,
      error_message
    })

    if (!updatedStatus) {
      return NextResponse.json(
        { 
          error: "Invoice not found",
          invoice_number: invoiceNumber
        },
        { status: 404 }
      )
    }

    console.log(`[INVOICE-STATUS] Updated status for ${invoiceNumber}:`, updatedStatus.status)

    return NextResponse.json({
      ...updatedStatus,
      message: "Invoice status updated successfully"
    })

  } catch (error) {
    console.error("[INVOICE-STATUS] Update error:", error)
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
