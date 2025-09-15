import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// Database file path
const DB_PATH = path.join(process.cwd(), 'data', 'invoice_app.db')

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Database instance
let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    
    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL')
    
    // Create tables if they don't exist
    initializeTables(db)
    
    console.log(`[DATABASE] Connected to SQLite database: ${DB_PATH}`)
  }
  
  return db
}

function initializeTables(database: Database.Database) {
  // Create invoices table
  database.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      invoice_number TEXT PRIMARY KEY,
      status TEXT NOT NULL CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
      pdf_url TEXT,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create webhook_data table for storing Make.com webhook data
  database.exec(`
    CREATE TABLE IF NOT EXISTS webhook_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL, -- JSON string
      metadata TEXT, -- JSON string
      processed_result TEXT, -- JSON string
      received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      processing_time INTEGER,
      invoice_number TEXT,
      FOREIGN KEY (invoice_number) REFERENCES invoices (invoice_number)
    )
  `)

  // Create index for faster lookups
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status);
    CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices (created_at);
    CREATE INDEX IF NOT EXISTS idx_webhook_data_event_type ON webhook_data (event_type);
    CREATE INDEX IF NOT EXISTS idx_webhook_data_invoice_number ON webhook_data (invoice_number);
    CREATE INDEX IF NOT EXISTS idx_webhook_data_received_at ON webhook_data (received_at);
  `)

  console.log('[DATABASE] Tables initialized successfully')
}

// Close database connection (for cleanup)
export function closeDatabase() {
  if (db) {
    db.close()
    db = null
    console.log('[DATABASE] Database connection closed')
  }
}

// Database utility functions
export class DatabaseUtils {
  static async executeTransaction<T>(callback: (db: Database.Database) => T): Promise<T> {
    const database = getDatabase()
    const transaction = database.transaction(callback)
    return transaction()
  }

  static async cleanupOldData(maxAgeHours: number = 24): Promise<{ invoices: number, webhooks: number }> {
    const database = getDatabase()
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString()
    
    const deleteInvoices = database.prepare(`
      DELETE FROM invoices WHERE created_at < ?
    `)
    
    const deleteWebhooks = database.prepare(`
      DELETE FROM webhook_data WHERE received_at < ?
    `)
    
    const invoiceCount = deleteInvoices.run(cutoffTime).changes
    const webhookCount = deleteWebhooks.run(cutoffTime).changes
    
    console.log(`[DATABASE] Cleaned up ${invoiceCount} old invoices and ${webhookCount} old webhook entries`)
    
    return { invoices: invoiceCount, webhooks: webhookCount }
  }

  static async getDatabaseStats(): Promise<{
    totalInvoices: number
    totalWebhooks: number
    pendingInvoices: number
    completedInvoices: number
    failedInvoices: number
  }> {
    const database = getDatabase()
    
    const totalInvoices = database.prepare('SELECT COUNT(*) as count FROM invoices').get() as { count: number }
    const totalWebhooks = database.prepare('SELECT COUNT(*) as count FROM webhook_data').get() as { count: number }
    const pendingInvoices = database.prepare('SELECT COUNT(*) as count FROM invoices WHERE status = ?').get('pending') as { count: number }
    const completedInvoices = database.prepare('SELECT COUNT(*) as count FROM invoices WHERE status = ?').get('completed') as { count: number }
    const failedInvoices = database.prepare('SELECT COUNT(*) as count FROM invoices WHERE status = ?').get('failed') as { count: number }
    
    return {
      totalInvoices: totalInvoices.count,
      totalWebhooks: totalWebhooks.count,
      pendingInvoices: pendingInvoices.count,
      completedInvoices: completedInvoices.count,
      failedInvoices: failedInvoices.count
    }
  }
}

export default getDatabase
