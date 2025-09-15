"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getMakeWebhookData, type MakeWebhookData } from "@/lib/webhook-client"
import { useToast } from "@/hooks/use-toast"
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Zap,
  ExternalLink,
  Copy
} from "lucide-react"

interface WebhookDataItem extends MakeWebhookData {
  receivedAt: string
  processedResult?: any
}

export function MakeWebhookData() {
  const { toast } = useToast()
  const [data, setData] = useState<WebhookDataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchWebhookData()
  }, [])

  const fetchWebhookData = async () => {
    try {
      setRefreshing(true)
      const webhookData = await getMakeWebhookData()
      setData(webhookData)
    } catch (error) {
      console.error("Error fetching webhook data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch webhook data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Data copied to clipboard",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "invoice_processed":
        return <FileText className="h-4 w-4 text-green-600" />
      case "invoice_generated":
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case "workflow_completed":
        return <Zap className="h-4 w-4 text-purple-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getEventBadge = (eventType: string) => {
    const variants = {
      invoice_processed: "default",
      invoice_generated: "secondary",
      workflow_completed: "outline",
    } as const

    return (
      <Badge variant={variants[eventType as keyof typeof variants] || "outline"}>
        {eventType.replace(/_/g, " ")}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading webhook data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
              <Zap className="h-4 w-4 text-purple-600" />
            </div>
            Make.com Webhook Data
            <Badge variant="outline" className="text-xs">
              {data.length} events
            </Badge>
          </CardTitle>
          <Button
            onClick={fetchWebhookData}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Real-time data received from Make.com webhooks (development only)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm italic">No webhook data received yet</p>
            <p className="text-xs mt-1">
              Trigger a Make.com scenario to see data here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item, index) => (
              <Card key={index} className="border border-border/50">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getEventIcon(item.eventType)}
                        <span className="font-medium text-sm">
                          {item.eventType.replace(/_/g, " ")}
                        </span>
                        {getEventBadge(item.eventType)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(item.receivedAt)}
                      </div>
                    </div>

                    <Separator />

                    {/* Payload Data */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Payload Data</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(item.payload, null, 2))}
                          className="h-6 px-2 text-xs"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg border">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(item.payload, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Metadata */}
                    {item.metadata && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Metadata</h4>
                        <div className="bg-muted/30 p-3 rounded-lg border">
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(item.metadata, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Processed Result */}
                    {item.processedResult && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Processing Result</h4>
                        <div className="bg-muted/30 p-3 rounded-lg border">
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(item.processedResult, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* PDF URL Link */}
                    {item.payload?.pdf_url && (
                      <div className="pt-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                        >
                          <a
                            href={item.payload.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View PDF
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <span>Development mode only</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
