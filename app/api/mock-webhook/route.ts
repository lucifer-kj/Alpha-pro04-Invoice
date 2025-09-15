import { type NextRequest, NextResponse } from "next/server"

// Mock webhook endpoint for testing invoice generation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log("[v0] Mock webhook received:", JSON.stringify(body, null, 2))
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Generate a mock PDF URL (in real scenario, this would be the actual PDF generation)
    const mockPdfUrl = `https://example.com/invoices/${body.invoice_number || 'INV-001'}.pdf`
    
    const response = {
      status: "success",
      message: "Invoice generated successfully",
      pdf_url: mockPdfUrl,
      invoice_number: body.invoice_number,
      generated_at: new Date().toISOString()
    }
    
    console.log("[v0] Mock webhook response:", response)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Mock webhook error:", error)
    return NextResponse.json(
      { status: "error", message: "Mock webhook failed" },
      { status: 500 }
    )
  }
}
