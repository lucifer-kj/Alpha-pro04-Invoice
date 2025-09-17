"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Database, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"

interface DatabaseStats {
  invoices: {
    totalInvoices: number
    pendingInvoices: number
    completedInvoices: number
    failedInvoices: number
  }
  webhooks: {
    totalWebhooks: number
  }
  database: {
    path: string
    initialized: boolean
  }
}

interface WebhookStats {
  totalWebhooks: number
  byEventType: Array<{ event_type: string, count: number }>
  recentActivity: Array<{ date: string, count: number }>
  averageProcessingTime: number
}

export function DatabaseStatus() {
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [webhookStats, setWebhookStats] = useState<WebhookStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Test database connection
      const testResponse = await fetch('/api/database-test?action=test')
      const testData = await testResponse.json()
      
      if (!testData.success) {
        throw new Error('Database connection failed')
      }

      // Get database stats
      const statsResponse = await fetch('/api/database-test?action=stats')
      const statsData = await statsResponse.json()
      
      if (statsData.success) {
        setStats(statsData.stats)
      }

      // Get webhook stats
      const webhookResponse = await fetch('/api/webhook-data', { method: 'POST' })
      const webhookData = await webhookResponse.json()
      
      if (webhookData.success) {
        setWebhookStats(webhookData.stats)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch database status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const getStatusIcon = (connected: boolean) => {
    return connected ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  const getStatusBadge = (connected: boolean) => {
    return connected ? (
      <Badge variant="default" className="bg-green-500">Connected</Badge>
    ) : (
      <Badge variant="destructive">Disconnected</Badge>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="transition-all duration-300 ease-in-out">
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <CardTitle>Database Status</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={(e) => {
                  e.stopPropagation()
                  fetchStats()
                }}
                disabled={loading}
                size="sm"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
          </div>
          <CardDescription>
            SQLite database status and statistics for invoice and webhook data
          </CardDescription>
        </CardHeader>
        {isExpanded && (
          <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(stats.database.initialized)}
                  <span className="font-medium">Database Connection</span>
                </div>
                <div className="text-sm text-gray-600">
                  Path: {stats.database.path}
                </div>
                {getStatusBadge(stats.database.initialized)}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Invoices</h4>
                <div className="text-sm space-y-1">
                  <div>Total: {stats.invoices.totalInvoices}</div>
                  <div>Pending: {stats.invoices.pendingInvoices}</div>
                  <div>Completed: {stats.invoices.completedInvoices}</div>
                  <div>Failed: {stats.invoices.failedInvoices}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Webhooks</h4>
                <div className="text-sm space-y-1">
                  <div>Total: {stats.webhooks.totalWebhooks}</div>
                  {webhookStats && (
                    <>
                      <div>Avg Processing: {webhookStats.averageProcessingTime.toFixed(2)}ms</div>
                      <div>Recent Activity: {webhookStats.recentActivity.length} days</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {webhookStats && webhookStats.byEventType.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Webhook Events by Type</h4>
              <div className="flex flex-wrap gap-2">
                {webhookStats.byEventType.map((event) => (
                  <Badge key={event.event_type} variant="outline">
                    {event.event_type}: {event.count}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
