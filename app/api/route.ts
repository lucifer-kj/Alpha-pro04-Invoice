import { type NextRequest, NextResponse } from "next/server"

// Simple API endpoint to receive invoice data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log("[v0] Received invoice data:", JSON.stringify(body, null, 2))
    
    // Here you can process the invoice data
    // For example: save to database, send to external service, etc.
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Return success response
    const response = {
      status: "success",
      message: "Invoice data received successfully",
      invoice_number: body.invoice_number,
      total_due: body.totals?.total_due,
      received_at: new Date().toISOString()
    }
    
    console.log("[v0] Sending response:", response)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { status: "error", message: "Failed to process invoice data" },
      { status: 500 }
    )
  }
}
