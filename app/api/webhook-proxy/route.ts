import { type NextRequest, NextResponse } from "next/server"

// This API route acts as a proxy to handle CORS issues and add server-side processing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] Received request body:", JSON.stringify(body, null, 2))

    // Get webhook URL from environment or request
    const webhookUrl = process.env.WEBHOOK_URL || body.webhook_url

    if (!webhookUrl) {
      console.log("[v0] No webhook URL configured")
      return NextResponse.json({ status: "error", message: "No webhook URL configured" }, { status: 400 })
    }

    console.log("[v0] Proxying request to webhook:", webhookUrl)

    // Extract webhook headers and payload
    const { webhook_url, webhook_headers, ...payload } = body
    console.log("[v0] Payload to send:", JSON.stringify(payload, null, 2))

    // Forward the request to the actual webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(webhook_headers || {}),
        ...(process.env.WEBHOOK_TOKEN && {
          Authorization: `Bearer ${process.env.WEBHOOK_TOKEN}`,
        }),
      },
      body: JSON.stringify(payload),
    })

    console.log("[v0] Webhook response status:", webhookResponse.status)

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      console.log("[v0] Webhook error:", errorText)
      return NextResponse.json(
        { status: "error", message: `Webhook failed: ${webhookResponse.statusText} - ${errorText}` },
        { status: webhookResponse.status },
      )
    }

    const responseData = await webhookResponse.json()
    console.log("[v0] Webhook response:", responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("[v0] Webhook proxy error:", error)
    console.error("[v0] Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ 
      status: "error", 
      message: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 })
  }
}
