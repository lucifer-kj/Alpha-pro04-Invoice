import { getDatabase, DatabaseUtils } from './database'
import InvoiceStateManager from './invoice-state'

export class DatabaseAdmin {
  // Initialize database and create tables
  static async initialize(): Promise<void> {
    try {
      const db = getDatabase()
      console.log('[DATABASE-ADMIN] Database initialized successfully')
    } catch (error) {
      console.error('[DATABASE-ADMIN] Database initialization failed:', error)
      throw error
    }
  }

  // Get comprehensive database statistics
  static async getStats(): Promise<{
    invoices: any
    webhooks: any
    database: any
  }> {
    try {
      const invoiceStats = await DatabaseUtils.getDatabaseStats()
      const webhookStats = await DatabaseUtils.getDatabaseStats()
      
      return {
        invoices: invoiceStats,
        webhooks: webhookStats,
        database: {
          path: process.cwd() + '/data/invoice_app.db',
          initialized: true
        }
      }
    } catch (error) {
      console.error('[DATABASE-ADMIN] Error getting stats:', error)
      throw error
    }
  }

  // Clean up old data
  static async cleanup(maxAgeHours: number = 24): Promise<{
    invoices: number
    webhooks: number
  }> {
    try {
      const invoiceCleanup = InvoiceStateManager.cleanupOldInvoices(maxAgeHours)
      const webhookCleanup = await DatabaseUtils.cleanupOldData(maxAgeHours)
      
      return {
        invoices: invoiceCleanup,
        webhooks: webhookCleanup.webhooks
      }
    } catch (error) {
      console.error('[DATABASE-ADMIN] Error during cleanup:', error)
      throw error
    }
  }

  // Test database connection and operations
  static async testConnection(): Promise<{
    connected: boolean
    tablesExist: boolean
    canRead: boolean
    canWrite: boolean
    error?: string
  }> {
    try {
      const db = getDatabase()
      
      // Test basic connection
      const connected = !!db
      
      // Test if tables exist
      const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('invoices', 'webhook_data')
      `).all() as Array<{ name: string }>
      
      const tablesExist = tables.length === 2
      
      // Test read operation
      const canRead = (() => {
        try {
          db.prepare('SELECT COUNT(*) FROM invoices').get()
          return true
        } catch {
          return false
        }
      })()
      
      // Test write operation
      const canWrite = (() => {
        try {
          const testInvoice = 'TEST-' + Date.now()
          db.prepare('INSERT INTO invoices (invoice_number, status) VALUES (?, ?)').run(testInvoice, 'pending')
          db.prepare('DELETE FROM invoices WHERE invoice_number = ?').run(testInvoice)
          return true
        } catch {
          return false
        }
      })()
      
      return {
        connected,
        tablesExist,
        canRead,
        canWrite
      }
    } catch (error) {
      return {
        connected: false,
        tablesExist: false,
        canRead: false,
        canWrite: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export default DatabaseAdmin
