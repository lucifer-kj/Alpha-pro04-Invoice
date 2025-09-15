import { NextRequest, NextResponse } from "next/server"
import InvoiceStateManager from "@/lib/invoice-state"

// Create or ensure an invoice record exists
export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { invoice_number, status }: { invoice_number?: string; status?: 'pending' | 'generating' | 'completed' | 'failed' } = body || {}

		if (!invoice_number) {
			return NextResponse.json(
				{ error: "invoice_number is required" },
				{ status: 400 }
			)
		}

		// If already exists, just optionally update status
		const existing = InvoiceStateManager.getInvoiceStatus(invoice_number)
		if (!existing) {
			InvoiceStateManager.createInvoice(invoice_number)
		}

		if (status) {
			InvoiceStateManager.updateInvoiceStatus(invoice_number, { status })
		}

		const current = InvoiceStateManager.getInvoiceStatus(invoice_number)

		return NextResponse.json({
			success: true,
			invoice: current,
			message: existing ? "Invoice ensured" : "Invoice created",
		})
	} catch (error) {
		return NextResponse.json(
			{
				error: "Internal server error",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		)
	}
}
