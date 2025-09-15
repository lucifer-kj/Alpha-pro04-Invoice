import { NextRequest, NextResponse } from 'next/server'
import DatabaseAdmin from '@/lib/database-admin'
import InvoiceStateManager from '@/lib/invoice-state'

// Test database connection and operations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'test'

    switch (action) {
      case 'test':
        const testResult = await DatabaseAdmin.testConnection()
        return NextResponse.json({
          success: true,
          test: testResult,
          message: testResult.connected ? 'Database connection successful' : 'Database connection failed'
        })

      case 'stats':
        const stats = await DatabaseAdmin.getStats()
        return NextResponse.json({
          success: true,
          stats
        })

      case 'cleanup':
        const cleanupResult = await DatabaseAdmin.cleanup()
        return NextResponse.json({
          success: true,
          cleanup: cleanupResult,
          message: `Cleaned up ${cleanupResult.invoices} invoices and ${cleanupResult.webhooks} webhook entries`
        })

      case 'sample':
        // Create a sample invoice to test the system
        const sampleInvoiceNumber = `TEST-${Date.now()}`
        const sampleInvoice = InvoiceStateManager.createInvoice(sampleInvoiceNumber)
        
        // Update it to completed status
        InvoiceStateManager.markAsCompleted(sampleInvoiceNumber, 'https://example.com/sample.pdf')
        
        // Retrieve it back
        const retrievedInvoice = InvoiceStateManager.getInvoiceStatus(sampleInvoiceNumber)
        
        return NextResponse.json({
          success: true,
          sample: {
            created: sampleInvoice,
            updated: retrievedInvoice,
            message: 'Sample invoice created and updated successfully'
          }
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: test, stats, cleanup, or sample' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('[DATABASE-TEST] Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
