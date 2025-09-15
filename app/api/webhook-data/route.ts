import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

// Get webhook data from database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventType = searchParams.get('eventType')
    const invoiceNumber = searchParams.get('invoiceNumber')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const db = getDatabase()
    
    let query = 'SELECT * FROM webhook_data'
    const params: any[] = []
    const conditions: string[] = []

    if (eventType) {
      conditions.push('event_type = ?')
      params.push(eventType)
    }

    if (invoiceNumber) {
      conditions.push('invoice_number = ?')
      params.push(invoiceNumber)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' ORDER BY received_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const webhookData = db.prepare(query).all(...params) as any[]

    // Parse JSON fields
    const parsedData = webhookData.map(item => ({
      id: item.id,
      eventType: item.event_type,
      payload: JSON.parse(item.payload),
      metadata: item.metadata ? JSON.parse(item.metadata) : null,
      processedResult: item.processed_result ? JSON.parse(item.processed_result) : null,
      receivedAt: item.received_at,
      processingTime: item.processing_time,
      invoiceNumber: item.invoice_number
    }))

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as count FROM webhook_data'
    const countParams: any[] = []
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ')
      countParams.push(...params.slice(0, -2)) // Remove limit and offset
    }

    const totalCount = db.prepare(countQuery).get(...countParams) as { count: number }

    return NextResponse.json({
      success: true,
      data: parsedData,
      pagination: {
        total: totalCount.count,
        limit,
        offset,
        hasMore: offset + limit < totalCount.count
      }
    })

  } catch (error) {
    console.error('[WEBHOOK-DATA] Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get webhook data statistics
export async function POST(request: NextRequest) {
  try {
    const db = getDatabase()
    
    // Get statistics
    const stats = {
      totalWebhooks: db.prepare('SELECT COUNT(*) as count FROM webhook_data').get() as { count: number },
      byEventType: db.prepare(`
        SELECT event_type, COUNT(*) as count 
        FROM webhook_data 
        GROUP BY event_type 
        ORDER BY count DESC
      `).all() as Array<{ event_type: string, count: number }>,
      recentActivity: db.prepare(`
        SELECT DATE(received_at) as date, COUNT(*) as count
        FROM webhook_data 
        WHERE received_at >= datetime('now', '-7 days')
        GROUP BY DATE(received_at)
        ORDER BY date DESC
      `).all() as Array<{ date: string, count: number }>,
      averageProcessingTime: db.prepare(`
        SELECT AVG(processing_time) as avg_time
        FROM webhook_data 
        WHERE processing_time IS NOT NULL
      `).get() as { avg_time: number | null }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalWebhooks: stats.totalWebhooks.count,
        byEventType: stats.byEventType,
        recentActivity: stats.recentActivity,
        averageProcessingTime: stats.averageProcessingTime.avg_time || 0
      }
    })

  } catch (error) {
    console.error('[WEBHOOK-DATA] Stats error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
