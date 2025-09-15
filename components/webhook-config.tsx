"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, CheckCircle, XCircle, Loader2 } from "lucide-react"

// Simple webhook URL validation
function validateWebhookUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:"
  } catch {
    return false
  }
}

// Simple webhook connection test
async function testWebhookConnection(config: { url: string; headers?: Record<string, string> }): Promise<boolean> {
  try {
    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      message: "Connection test from Alpha Business Digital Invoice App",
    }

    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
      body: JSON.stringify(testPayload),
    })

    return response.ok
  } catch (error) {
    console.error("Webhook connection test failed:", error)
    return false
  }
}

interface WebhookConfigProps {
  onConfigChange?: (config: { url: string }) => void
}

export function WebhookConfig({ onConfigChange }: WebhookConfigProps) {
  const [webhookUrl, setWebhookUrl] = useState(
    "https://hook.eu2.make.com/84agsujsolsdlfazqvco8mo06ctypst9",
  )
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle")

  const handleTestConnection = async () => {
    if (!validateWebhookUrl(webhookUrl)) {
      setConnectionStatus("error")
      return
    }

    setIsTestingConnection(true)
    setConnectionStatus("idle")

    try {
      const isConnected = await testWebhookConnection({
        url: webhookUrl,
        headers: {
          "Content-Type": "application/json",
        },
      })

      setConnectionStatus(isConnected ? "success" : "error")

      if (isConnected && onConfigChange) {
        onConfigChange({ url: webhookUrl })
      }
    } catch (error) {
      setConnectionStatus("error")
    } finally {
      setIsTestingConnection(false)
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case "success":
        return (
          <Badge variant="secondary" className="text-green-700 bg-green-100">
            Connected
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Connection Failed</Badge>
      default:
        return <Badge variant="outline">Not Tested</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Webhook Configuration
        </CardTitle>
        <p className="text-sm text-muted-foreground">Configure your webhook endpoint for invoice processing</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="webhook-url">Webhook URL</Label>
          <Input
            id="webhook-url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hook.eu2.make.com/..."
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusBadge()}
          </div>

          <Button
            onClick={handleTestConnection}
            disabled={isTestingConnection || !webhookUrl}
            variant="outline"
            size="sm"
          >
            {isTestingConnection ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>
        </div>

        {connectionStatus === "error" && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            <p className="font-medium">Connection failed</p>
            <p>Please check your webhook URL and ensure the endpoint is accessible.</p>
          </div>
        )}

        {connectionStatus === "success" && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
            <p className="font-medium">Connection successful</p>
            <p>Your webhook is ready to receive invoice data.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
