// Invoice state management for tracking invoice generation status
export interface InvoiceStatus {
  invoice_number: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  pdf_url?: string
  error_message?: string
  created_at: Date
  updated_at: Date
}

// In-memory store for demo purposes
// In production, use a database or Redis
const invoiceStore = new Map<string, InvoiceStatus>()

export class InvoiceStateManager {
  // Create a new invoice status
  static createInvoice(invoiceNumber: string): InvoiceStatus {
    const status: InvoiceStatus = {
      invoice_number: invoiceNumber,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    }
    
    invoiceStore.set(invoiceNumber, status)
    console.log(`[INVOICE-STATE] Created invoice status for: ${invoiceNumber}`)
    return status
  }

  // Update invoice status
  static updateInvoiceStatus(
    invoiceNumber: string, 
    updates: Partial<Omit<InvoiceStatus, 'invoice_number' | 'created_at'>>
  ): InvoiceStatus | null {
    const existing = invoiceStore.get(invoiceNumber)
    if (!existing) {
      console.error(`[INVOICE-STATE] Invoice not found: ${invoiceNumber}`)
      return null
    }

    const updated: InvoiceStatus = {
      ...existing,
      ...updates,
      updated_at: new Date()
    }

    invoiceStore.set(invoiceNumber, updated)
    console.log(`[INVOICE-STATE] Updated invoice ${invoiceNumber}:`, updates)
    return updated
  }

  // Get invoice status
  static getInvoiceStatus(invoiceNumber: string): InvoiceStatus | null {
    return invoiceStore.get(invoiceNumber) || null
  }

  // Get all invoices
  static getAllInvoices(): InvoiceStatus[] {
    return Array.from(invoiceStore.values())
  }

  // Mark invoice as generating
  static markAsGenerating(invoiceNumber: string): InvoiceStatus | null {
    return this.updateInvoiceStatus(invoiceNumber, { status: 'generating' })
  }

  // Mark invoice as completed with PDF URL
  static markAsCompleted(invoiceNumber: string, pdfUrl: string): InvoiceStatus | null {
    return this.updateInvoiceStatus(invoiceNumber, { 
      status: 'completed',
      pdf_url: pdfUrl
    })
  }

  // Mark invoice as failed
  static markAsFailed(invoiceNumber: string, errorMessage: string): InvoiceStatus | null {
    return this.updateInvoiceStatus(invoiceNumber, { 
      status: 'failed',
      error_message: errorMessage
    })
  }

  // Clean up old invoices (optional)
  static cleanupOldInvoices(maxAgeHours: number = 24): number {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000)
    let cleanedCount = 0

    for (const [invoiceNumber, status] of invoiceStore.entries()) {
      if (status.created_at < cutoffTime) {
        invoiceStore.delete(invoiceNumber)
        cleanedCount++
      }
    }

    console.log(`[INVOICE-STATE] Cleaned up ${cleanedCount} old invoices`)
    return cleanedCount
  }
}

// Export for use in API routes and components
export default InvoiceStateManager
