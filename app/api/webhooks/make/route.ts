export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDatabase } from '@/lib/database'
import InvoiceStateManager from '@/lib/invoice-state'

// Enhanced validation schema for Make.com webhook data
const makeWebhookSchema = z.object({
  eventType: z.string(),
  payload: z.record(z.any()),
  metadata: z.object({
    scenarioId: z.string().optional(),
    executionId: z.string().optional(),
    invoice_number: z.string().optional(),
    pdf_url: z.string().optional(),
    timestamp: z.string().optional(),
    source: z.string().optional(),
  }).optional()
})

// Enhanced invoice processing schema with more detailed validation
const invoiceProcessedSchema = z.object({
  invoice_number: z.string().min(1, "Invoice number is required"),
  client_name: z.string().min(1, "Client name is required"),
  total_due: z.number().positive("Total due must be positive"),
  pdf_url: z.string().url("PDF URL must be valid"),
  invoice_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  status: z.enum(['success', 'error', 'pending', 'processing']),
  message: z.string().optional(),
  client_email: z.string().email().optional(),
  subtotal: z.number().optional(),
  tax_amount: z.number().optional(),
})

// Data processing schema for workflow events
const dataProcessedSchema = z.object({
  id: z.string(),
  processedData: z.any(),
  timestamp: z.string(),
  status: z.enum(['completed', 'failed', 'partial']),
  metadata: z.record(z.any()).optional(),
})

// Workflow completion schema
const workflowCompletedSchema = z.object({
  workflowId: z.string(),
  executionId: z.string(),
  status: z.enum(['success', 'error', 'timeout']),
  duration: z.number().optional(),
  results: z.record(z.any()).optional(),
  errors: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Enhanced authentication with better error messages
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.MAKE_WEBHOOK_SECRET || 'default-secret'}`
    
    if (!authHeader) {
      console.warn('[Make.com] Missing authorization header')
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Authorization header is required'
        }, 
        { status: 401 }
      )
    }
    
    if (authHeader !== expectedToken) {
      console.warn('[Make.com] Invalid authorization token')
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Invalid authorization token'
        }, 
        { status: 401 }
      )
    }

    // Enhanced request parsing with better error handling
    let rawData: any
    try {
      rawData = await request.json()
    } catch (parseError) {
      console.error('[Make.com] JSON parsing error:', parseError)
      return NextResponse.json(
        { 
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        },
        { status: 400 }
      )
    }

    console.log('[Make.com] Received webhook data:', JSON.stringify(rawData, null, 2))

    // Enhanced validation with detailed error reporting
    const validationResult = makeWebhookSchema.safeParse(rawData)

    if (!validationResult.success) {
      console.error('[Make.com] Validation error:', validationResult.error.format())
      return NextResponse.json(
        { 
          error: 'Invalid data format', 
          message: 'Request data does not match expected schema',
          details: validationResult.error.format() 
        },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    // Process based on event type with enhanced handling
    let processedResult
    try {
      switch (validatedData.eventType) {
        case 'invoice_processed':
          processedResult = await handleInvoiceProcessed(validatedData.payload)
          break
        case 'invoice_generated':
          processedResult = await handleInvoiceGenerated(validatedData.payload)
          break
        case 'data_processed':
          processedResult = await handleDataProcessed(validatedData.payload)
          break
        case 'workflow_completed':
          processedResult = await handleWorkflowCompleted(validatedData.payload)
          break
        default:
          console.log('[Make.com] Unknown event type:', validatedData.eventType)
          processedResult = { 
            success: false,
            message: `Event type '${validatedData.eventType}' is not supported`,
            supportedTypes: ['invoice_processed', 'invoice_generated', 'data_processed', 'workflow_completed']
          }
      }
    } catch (processingError) {
      console.error('[Make.com] Event processing error:', processingError)
      processedResult = {
        success: false,
        error: 'Event processing failed',
        message: processingError instanceof Error ? processingError.message : 'Unknown processing error'
      }
    }

    // Store webhook data in SQLite database
    const db = getDatabase()
    const insertWebhookData = db.prepare(`
      INSERT INTO webhook_data (
        event_type, 
        payload, 
        metadata, 
        processed_result, 
        received_at, 
        processing_time,
        invoice_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    try {
      insertWebhookData.run(
        validatedData.eventType,
        JSON.stringify(validatedData.payload),
        validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
        JSON.stringify(processedResult),
        new Date().toISOString(),
        Date.now() - startTime,
        validatedData.metadata?.invoice_number || null
      )
      
      console.log(`[Make.com] Webhook data stored in database for event: ${validatedData.eventType}`)
    } catch (dbError) {
      console.error('[Make.com] Error storing webhook data:', dbError)
      // Don't fail the webhook if database storage fails
    }

    const processingTime = Date.now() - startTime
    console.log(`[Make.com] Webhook processed successfully: ${validatedData.eventType} (${processingTime}ms)`)

    return NextResponse.json(
      { 
        success: true, 
        message: 'Webhook processed successfully',
        eventType: validatedData.eventType,
        processedAt: new Date().toISOString(),
        processingTime,
        result: processedResult
      },
      { status: 200 }
    )

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('[Make.com] Webhook processing error:', error)
    
    // Enhanced error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // Log detailed error information
    console.error('[Make.com] Error details:', {
      message: errorMessage,
      stack: errorStack,
      processingTime,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing the webhook',
        timestamp: new Date().toISOString(),
        processingTime
      },
      { status: 500 }
    )
  }
}

// Helper functions for different event types
async function handleInvoiceProcessed(payload: any) {
  console.log('[Make.com] Processing invoice:', payload)
  
  // Validate invoice data structure
  const invoiceValidation = invoiceProcessedSchema.safeParse(payload)
  if (!invoiceValidation.success) {
    console.error('[Make.com] Invoice validation failed:', invoiceValidation.error.format())
    return { 
      success: false, 
      error: 'Invalid invoice data format',
      details: invoiceValidation.error.format()
    }
  }

  const invoiceData = invoiceValidation.data
  
  try {
    // Update invoice status in database
    // Ensure invoice exists
    if (!InvoiceStateManager.getInvoiceStatus(invoiceData.invoice_number)) {
      InvoiceStateManager.createInvoice(invoiceData.invoice_number)
    }

    if (invoiceData.status === 'success' && invoiceData.pdf_url) {
      InvoiceStateManager.markAsCompleted(invoiceData.invoice_number, invoiceData.pdf_url)
      console.log(`[Make.com] Invoice ${invoiceData.invoice_number} marked as completed`)
    } else if (invoiceData.status === 'error') {
      InvoiceStateManager.markAsFailed(invoiceData.invoice_number, invoiceData.message || 'Processing failed')
      console.log(`[Make.com] Invoice ${invoiceData.invoice_number} marked as failed`)
    } else {
      InvoiceStateManager.markAsGenerating(invoiceData.invoice_number)
      console.log(`[Make.com] Invoice ${invoiceData.invoice_number} marked as generating`)
    }
  } catch (error) {
    console.error('[Make.com] Error updating invoice status:', error)
  }
  
  return {
    success: true,
    message: `Invoice ${invoiceData.invoice_number} processed successfully`,
    invoice_number: invoiceData.invoice_number,
    pdf_url: invoiceData.pdf_url
  }
}

async function handleInvoiceGenerated(payload: any) {
  console.log('[Make.com] Invoice generated:', payload)
  
  try {
    // Ensure invoice exists and update status if we have invoice number and PDF URL
    if (payload.invoice_number) {
      if (!InvoiceStateManager.getInvoiceStatus(payload.invoice_number)) {
        InvoiceStateManager.createInvoice(payload.invoice_number)
      }
    }

    if (payload.invoice_number && payload.pdf_url) {
      InvoiceStateManager.markAsCompleted(payload.invoice_number, payload.pdf_url)
      console.log(`[Make.com] Invoice ${payload.invoice_number} marked as completed with PDF`)
    }
  } catch (error) {
    console.error('[Make.com] Error updating invoice status:', error)
  }
  
  return {
    success: true,
    message: 'Invoice generation completed',
    pdf_url: payload.pdf_url || null
  }
}

async function handleDataProcessed(payload: any) {
  console.log('[Make.com] Processing data:', payload)
  
  // Validate data processing structure
  const dataValidation = dataProcessedSchema.safeParse(payload)
  if (!dataValidation.success) {
    console.error('[Make.com] Data validation failed:', dataValidation.error.format())
    return { 
      success: false, 
      error: 'Invalid data processing format',
      details: dataValidation.error.format()
    }
  }

  const processedData = dataValidation.data
  
  // Here you could:
  // 1. Store processed data
  // 2. Trigger downstream workflows
  // 3. Send notifications
  // 4. Update system state
  
  return {
    success: true,
    message: `Data processing completed for ID: ${processedData.id}`,
    id: processedData.id,
    status: processedData.status,
    timestamp: processedData.timestamp
  }
}

async function handleWorkflowCompleted(payload: any) {
  console.log('[Make.com] Workflow completed:', payload)
  
  // Validate workflow completion structure
  const workflowValidation = workflowCompletedSchema.safeParse(payload)
  if (!workflowValidation.success) {
    console.error('[Make.com] Workflow validation failed:', workflowValidation.error.format())
    return { 
      success: false, 
      error: 'Invalid workflow completion format',
      details: workflowValidation.error.format()
    }
  }

  const workflowData = workflowValidation.data
  
  // Handle workflow completion based on status
  if (workflowData.status === 'error') {
    console.error('[Make.com] Workflow failed:', workflowData.errors)
    return {
      success: false,
      message: `Workflow ${workflowData.workflowId} failed`,
      workflowId: workflowData.workflowId,
      executionId: workflowData.executionId,
      errors: workflowData.errors
    }
  }
  
  return {
    success: true,
    message: `Workflow ${workflowData.workflowId} completed successfully`,
    workflowId: workflowData.workflowId,
    executionId: workflowData.executionId,
    duration: workflowData.duration,
    results: workflowData.results
  }
}

// GET endpoint to retrieve received webhook data (development only)
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  return NextResponse.json({
    data: global.makeWebhookData || [],
    count: (global.makeWebhookData || []).length,
    lastUpdated: new Date().toISOString()
  })
}
