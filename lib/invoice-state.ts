import { getDatabase } from './database'

// Invoice state management for tracking invoice generation status
export interface InvoiceStatus {
  invoice_number: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  pdf_url?: string
  error_message?: string
  created_at: Date
  updated_at: Date
}

export class InvoiceStateManager {
  // Create a new invoice status
  static createInvoice(invoiceNumber: string): InvoiceStatus {
    const db = getDatabase()
    const now = new Date()
    
    const insertInvoice = db.prepare(`
      INSERT INTO invoices (invoice_number, status, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `)
    
    try {
      insertInvoice.run(invoiceNumber, 'pending', now.toISOString(), now.toISOString())
      
      const status: InvoiceStatus = {
        invoice_number: invoiceNumber,
        status: 'pending',
        created_at: now,
        updated_at: now
      }
      
      console.log(`[INVOICE-STATE] Created invoice status for: ${invoiceNumber}`)
      return status
    } catch (error) {
      console.error(`[INVOICE-STATE] Error creating invoice ${invoiceNumber}:`, error)
      throw error
    }
  }

  // Update invoice status
  static updateInvoiceStatus(
    invoiceNumber: string, 
    updates: Partial<Omit<InvoiceStatus, 'invoice_number' | 'created_at'>>
  ): InvoiceStatus | null {
    const db = getDatabase()
    
    // Check if invoice exists
    const existing = db.prepare('SELECT * FROM invoices WHERE invoice_number = ?').get(invoiceNumber) as any
    if (!existing) {
      console.error(`[INVOICE-STATE] Invoice not found: ${invoiceNumber}`)
      return null
    }

    // Build update query dynamically
    const updateFields = []
    const updateValues = []
    
    if (updates.status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(updates.status)
    }
    if (updates.pdf_url !== undefined) {
      updateFields.push('pdf_url = ?')
      updateValues.push(updates.pdf_url)
    }
    if (updates.error_message !== undefined) {
      updateFields.push('error_message = ?')
      updateValues.push(updates.error_message)
    }
    
    updateFields.push('updated_at = ?')
    updateValues.push(new Date().toISOString())
    updateValues.push(invoiceNumber)

    const updateQuery = db.prepare(`
      UPDATE invoices 
      SET ${updateFields.join(', ')}
      WHERE invoice_number = ?
    `)

    try {
      updateQuery.run(...updateValues)
      
      // Get updated record
      const updated = db.prepare('SELECT * FROM invoices WHERE invoice_number = ?').get(invoiceNumber) as any
      
      const result: InvoiceStatus = {
        invoice_number: updated.invoice_number,
        status: updated.status,
        pdf_url: updated.pdf_url,
        error_message: updated.error_message,
        created_at: new Date(updated.created_at),
        updated_at: new Date(updated.updated_at)
      }
      
      console.log(`[INVOICE-STATE] Updated invoice ${invoiceNumber}:`, updates)
      return result
    } catch (error) {
      console.error(`[INVOICE-STATE] Error updating invoice ${invoiceNumber}:`, error)
      return null
    }
  }

  // Get invoice status
  static getInvoiceStatus(invoiceNumber: string): InvoiceStatus | null {
    const db = getDatabase()
    
    try {
      const result = db.prepare('SELECT * FROM invoices WHERE invoice_number = ?').get(invoiceNumber) as any
      
      if (!result) {
        return null
      }
      
      return {
        invoice_number: result.invoice_number,
        status: result.status,
        pdf_url: result.pdf_url,
        error_message: result.error_message,
        created_at: new Date(result.created_at),
        updated_at: new Date(result.updated_at)
      }
    } catch (error) {
      console.error(`[INVOICE-STATE] Error getting invoice ${invoiceNumber}:`, error)
      return null
    }
  }

  // Get all invoices
  static getAllInvoices(): InvoiceStatus[] {
    const db = getDatabase()
    
    try {
      const results = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all() as any[]
      
      return results.map(result => ({
        invoice_number: result.invoice_number,
        status: result.status,
        pdf_url: result.pdf_url,
        error_message: result.error_message,
        created_at: new Date(result.created_at),
        updated_at: new Date(result.updated_at)
      }))
    } catch (error) {
      console.error(`[INVOICE-STATE] Error getting all invoices:`, error)
      return []
    }
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
    const db = getDatabase()
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString()
    
    try {
      const deleteQuery = db.prepare('DELETE FROM invoices WHERE created_at < ?')
      const result = deleteQuery.run(cutoffTime)
      
      console.log(`[INVOICE-STATE] Cleaned up ${result.changes} old invoices`)
      return result.changes
    } catch (error) {
      console.error(`[INVOICE-STATE] Error cleaning up old invoices:`, error)
      return 0
    }
  }
}

// Export for use in API routes and components
export default InvoiceStateManager
