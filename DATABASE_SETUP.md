# Database Setup - SQLite Storage

This project now uses SQLite with `better-sqlite3` for persistent data storage instead of in-memory storage. This ensures that data from Make.com webhooks persists across server restarts.

## What's Changed

### 1. Database Schema
- **invoices table**: Stores invoice status, PDF URLs, and metadata
- **webhook_data table**: Stores all Make.com webhook data with full payloads

### 2. Key Files Added/Modified
- `lib/database.ts` - Database connection and utilities
- `lib/invoice-state.ts` - Updated to use SQLite instead of Map
- `app/api/webhooks/make/route.ts` - Now stores webhook data in database
- `app/api/webhook-data/route.ts` - New API to retrieve webhook data
- `app/api/database-test/route.ts` - Database testing endpoints
- `components/database-status.tsx` - UI component to view database status

### 3. Database Location
- Database file: `data/invoice_app.db`
- Automatically created on first run
- Uses WAL mode for better concurrency

## API Endpoints

### Database Testing
- `GET /api/database-test?action=test` - Test database connection
- `GET /api/database-test?action=stats` - Get database statistics
- `GET /api/database-test?action=sample` - Create sample invoice
- `GET /api/database-test?action=cleanup` - Clean up old data

### Webhook Data
- `GET /api/webhook-data` - Get webhook data with pagination
- `POST /api/webhook-data` - Get webhook statistics

### Query Parameters for webhook-data
- `eventType` - Filter by event type
- `invoiceNumber` - Filter by invoice number
- `limit` - Number of records (default: 50)
- `offset` - Pagination offset (default: 0)

## Benefits

1. **Persistence**: Data survives server restarts
2. **Reliability**: No more lost webhook data
3. **Querying**: Can search and filter webhook data
4. **Statistics**: Track webhook performance and activity
5. **Scalability**: SQLite handles concurrent reads efficiently

## Testing

Visit `http://localhost:3000` to see the database status component on the main page. It shows:
- Database connection status
- Invoice counts by status
- Webhook statistics
- Recent activity

## Make.com Integration

The webhook handler now:
1. Stores all incoming webhook data in the database
2. Updates invoice status based on webhook events
3. Maintains full audit trail of all webhook interactions
4. Provides better error handling and logging

This ensures that your Make.com workflows can reliably communicate with the invoice system and data won't be lost between server restarts.
