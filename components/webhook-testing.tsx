"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { runWebhookDiagnostics, testMakeWebhook, testLocalWebhook } from "@/lib/webhook-testing"
import { CheckCircle, XCircle, Loader2, AlertTriangle, ExternalLink, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function WebhookTesting() {
  const { toast } = useToast()
  const [isTesting, setIsTesting] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)

  const runTests = async () => {
    setIsTesting(true)
    setTestResults(null)
    
    try {
      const results = await runWebhookDiagnostics()
      setTestResults(results)
      
      toast({
        title: "Webhook Tests Complete",
        description: "Check the results below for any issues.",
      })
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "An error occurred while running webhook tests.",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    })
  }

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge variant="secondary" className="text-green-700 bg-green-100">
        Success
      </Badge>
    ) : (
      <Badge variant="destructive">Failed</Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-primary" />
          Webhook Testing & Diagnostics
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test your Make.com webhook setup and diagnose any issues
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Run Comprehensive Tests</h3>
            <p className="text-sm text-muted-foreground">
              Test both local and Make.com webhooks with sample data
            </p>
          </div>
          <Button onClick={runTests} disabled={isTesting} size="sm">
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              "Run Tests"
            )}
          </Button>
        </div>

        {testResults && (
          <div className="space-y-4">
            {/* Local Test Results */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(testResults.localTest.success)}
                  <h4 className="font-medium">Local Test Webhook</h4>
                </div>
                {getStatusBadge(testResults.localTest.success)}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Response Time:</span>
                  <span className="ml-2 font-mono">{testResults.localTest.responseTime}ms</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status Code:</span>
                  <span className="ml-2 font-mono">{testResults.localTest.statusCode || "N/A"}</span>
                </div>
              </div>

              {testResults.localTest.error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <strong>Error:</strong> {testResults.localTest.error}
                </div>
              )}

              {testResults.localTest.response && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Response Data:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(testResults.localTest.response, null, 2))}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <pre className="text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
                    {JSON.stringify(testResults.localTest.response, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Make.com Test Results */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(testResults.makeTest.success)}
                  <h4 className="font-medium">Make.com Webhook</h4>
                </div>
                {getStatusBadge(testResults.makeTest.success)}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Response Time:</span>
                  <span className="ml-2 font-mono">{testResults.makeTest.responseTime}ms</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status Code:</span>
                  <span className="ml-2 font-mono">{testResults.makeTest.statusCode || "N/A"}</span>
                </div>
              </div>

              {testResults.makeTest.error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <strong>Error:</strong> {testResults.makeTest.error}
                </div>
              )}

              {testResults.makeTest.response && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Response Data:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(testResults.makeTest.response, null, 2))}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <pre className="text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
                    {JSON.stringify(testResults.makeTest.response, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h4 className="font-medium">Recommendations</h4>
              </div>
              
              <div className="space-y-2">
                {testResults.recommendations.map((rec: string, index: number) => (
                  <div key={index} className="text-sm">
                    {rec}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("https://www.make.com", "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Make.com
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard("https://hook.eu2.make.com/84agsujsolsdlfazqvco8mo06ctypst9")}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Webhook URL
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Setup Instructions</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Create a new scenario in Make.com</li>
            <li>Add a Webhook module as the trigger</li>
            <li>Configure your PDF generation workflow</li>
            <li>Add a Webhook Response module that returns: <code className="bg-blue-100 px-1 rounded">{`{"status": "success", "pdf_url": "https://..."}`}</code></li>
            <li>Run the tests above to verify everything works</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
