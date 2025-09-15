import axios from "axios"

export interface WebhookTestResult {
  success: boolean
  responseTime: number
  statusCode?: number
  response?: any
  error?: string
}

export interface WebhookTestConfig {
  url: string
  timeout?: number
  headers?: Record<string, string>
}

// Test webhook with sample invoice data
export async function testWebhookWithSampleData(config: WebhookTestConfig): Promise<WebhookTestResult> {
  const startTime = Date.now()
  
  const samplePayload = {
    invoice_number: "INV-TEST-2025-001",
    invoice_date: "Jan 15, 2025",
    due_date: "Jan 22, 2025",
    client_name: "Test Client Company",
    client_address: "123 Test Street",
    client_city: "Test City",
    client_state_zip: "TC 12345",
    client_email: "test@example.com",
    client_phone: "+1 555-123-4567",
    item1: "Test Service",
    price1: "$100.00",
    item2: "Another Service",
    price2: "$50.00",
    subtotal: "$150.00",
    tax_rate: "10%",
    taxes: "$15.00",
    total_due: "$165.00"
  }

  try {
    console.log("[WEBHOOK-TEST] Testing webhook:", config.url)
    console.log("[WEBHOOK-TEST] Sample payload:", JSON.stringify(samplePayload, null, 2))

    const response = await axios.post(config.url, samplePayload, {
      headers: {
        "Content-Type": "application/json",
        ...config.headers
      },
      timeout: config.timeout || 15000
    })

    const responseTime = Date.now() - startTime

    console.log("[WEBHOOK-TEST] Response status:", response.status)
    console.log("[WEBHOOK-TEST] Response data:", JSON.stringify(response.data, null, 2))

    // Validate response format
    const isValidResponse = validateWebhookResponse(response.data)
    
    return {
      success: isValidResponse.success,
      responseTime,
      statusCode: response.status,
      response: response.data,
      error: isValidResponse.error
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    
    console.error("[WEBHOOK-TEST] Error:", error.message)
    
    return {
      success: false,
      responseTime,
      statusCode: error.response?.status,
      response: error.response?.data,
      error: error.message
    }
  }
}

// Validate webhook response format
export function validateWebhookResponse(response: any): { success: boolean; error?: string } {
  if (!response) {
    return { success: false, error: "No response received" }
  }

  if (typeof response !== "object") {
    return { success: false, error: "Response is not a JSON object" }
  }

  // Check for required fields
  if (!response.pdf_url) {
    return { 
      success: false, 
      error: "Missing 'pdf_url' field in response. Make.com must return: { status: 'success', pdf_url: 'https://...' }" 
    }
  }

  if (!response.status) {
    return { 
      success: false, 
      error: "Missing 'status' field in response" 
    }
  }

  // Validate PDF URL format
  try {
    new URL(response.pdf_url)
  } catch {
    return { 
      success: false, 
      error: "Invalid PDF URL format in response" 
    }
  }

  return { success: true }
}

// Test local webhook endpoint
export async function testLocalWebhook(): Promise<WebhookTestResult> {
  return testWebhookWithSampleData({
    url: "http://localhost:3000/api/test-webhook",
    timeout: 5000
  })
}

// Test Make.com webhook
export async function testMakeWebhook(): Promise<WebhookTestResult> {
  return testWebhookWithSampleData({
    url: "https://hook.eu2.make.com/84agsujsolsdlfazqvco8mo06ctypst9",
    timeout: 15000
  })
}

// Comprehensive webhook testing
export async function runWebhookDiagnostics(): Promise<{
  localTest: WebhookTestResult
  makeTest: WebhookTestResult
  recommendations: string[]
}> {
  console.log("[WEBHOOK-DIAGNOSTICS] Starting comprehensive webhook tests...")
  
  const localTest = await testLocalWebhook()
  const makeTest = await testMakeWebhook()
  
  const recommendations: string[] = []
  
  // Analyze results and provide recommendations
  if (!localTest.success) {
    recommendations.push("❌ Local test webhook failed. Check if the development server is running.")
  } else {
    recommendations.push("✅ Local test webhook is working correctly.")
  }
  
  if (!makeTest.success) {
    recommendations.push("❌ Make.com webhook test failed. Check your Make.com scenario configuration.")
    if (makeTest.error?.includes("pdf_url")) {
      recommendations.push("🔧 Fix: Ensure your Make.com webhook response includes 'pdf_url' field.")
    }
    if (makeTest.error?.includes("timeout")) {
      recommendations.push("⏱️ Fix: Your Make.com scenario is taking too long. Optimize the workflow.")
    }
  } else {
    recommendations.push("✅ Make.com webhook is working correctly.")
  }
  
  if (makeTest.responseTime && makeTest.responseTime > 10000) {
    recommendations.push("⚠️ Warning: Make.com webhook response is slow (>10s). Consider optimizing your scenario.")
  }
  
  return {
    localTest,
    makeTest,
    recommendations
  }
}
