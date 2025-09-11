import { type NextRequest, NextResponse } from "next/server"

// This API route acts as a proxy to handle CORS issues and add server-side processing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Get webhook URL from environment or request
    const webhookUrl = process.env.WEBHOOK_URL || body.webhook_url

    if (!webhookUrl) {
      return NextResponse.json({ status: "error", message: "No webhook URL configured" }, { status: 400 })
    }

    console.log("[v0] Proxying request to webhook:", webhookUrl)

    // Forward the request to the actual webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.WEBHOOK_TOKEN && {
          Authorization: `Bearer ${process.env.WEBHOOK_TOKEN}`,
        }),
      },
      body: JSON.stringify(body),
    })

    console.log("[v0] Webhook response status:", webhookResponse.status)

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      console.log("[v0] Webhook error:", errorText)
      return NextResponse.json(
        { status: "error", message: `Webhook failed: ${webhookResponse.statusText}` },
        { status: webhookResponse.status },
      )
    }

    const responseData = await webhookResponse.json()
    console.log("[v0] Webhook response:", responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("[v0] Webhook proxy error:", error)
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 })
  }
}
