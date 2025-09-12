import { type NextRequest, NextResponse } from "next/server"

// Test endpoint to verify Make.com webhook setup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log("[TEST] Received test request:", JSON.stringify(body, null, 2))
    
    // Simulate the expected Make.com webhook response
    const mockResponse = {
      status: "success",
      pdf_url: "https://example.com/test-invoice.pdf",
      message: "Test invoice generated successfully",
      timestamp: new Date().toISOString(),
      test_mode: true
    }
    
    console.log("[TEST] Returning mock response:", JSON.stringify(mockResponse, null, 2))
    
    return NextResponse.json(mockResponse)
  } catch (error) {
    console.error("[TEST] Test webhook error:", error)
    
    return NextResponse.json(
      { 
        status: "error", 
        message: "Test webhook failed",
        error: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    )
  }
}

// GET endpoint to test webhook connectivity
export async function GET() {
  return NextResponse.json({
    message: "Test webhook endpoint is active",
    timestamp: new Date().toISOString(),
    endpoints: {
      POST: "/api/test-webhook - Test webhook response format",
      GET: "/api/test-webhook - Check endpoint status"
    }
  })
}
