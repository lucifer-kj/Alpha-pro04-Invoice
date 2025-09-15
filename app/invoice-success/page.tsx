"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Download, ArrowLeft, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useInvoiceStatus } from "@/hooks/use-invoice-status"

interface InvoiceSuccessData {
  invoice_number: string
  client_name: string
  total_due: number
  pdf_url: string
  invoice_date: string
  due_date: string
}

function InvoiceSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [invoiceData, setInvoiceData] = useState<InvoiceSuccessData | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [shouldStopPolling, setShouldStopPolling] = useState(false)
  const invoiceNumber = searchParams.get("invoice_number")
  const { status, isGenerating, isPending, isCompleted, isFailed, isTimedOut, timeRemaining } = useInvoiceStatus(invoiceNumber, { 
    enabled: Boolean(invoiceNumber) && !shouldStopPolling, // Stop polling when we decide to stop
    pollInterval: 2000, 
    maxPollAttempts: 60 // Poll for 2 minutes to give Make.com enough time (60 × 2s = 120s)
  })

  useEffect(() => {
    // Prefer server status; fallback to any session data for display continuity
    const storedData = typeof window !== 'undefined' ? sessionStorage.getItem("lastInvoiceData") : null
    const base = storedData ? JSON.parse(storedData) as Partial<InvoiceSuccessData> : {}

    if (invoiceNumber) {
      setInvoiceData(prev => ({
        invoice_number: invoiceNumber,
        client_name: prev?.client_name || base.client_name || "",
        total_due: prev?.total_due || base.total_due || 0,
        pdf_url: status?.pdf_url || prev?.pdf_url || "",
        invoice_date: prev?.invoice_date || base.invoice_date || "",
        due_date: prev?.due_date || base.due_date || "",
      } as InvoiceSuccessData))
    }
  }, [searchParams, status?.pdf_url, invoiceNumber])

  // Stop polling when we get a PDF URL (success) or when invoice fails
  useEffect(() => {
    if (status?.pdf_url || status?.status === 'failed') {
      setShouldStopPolling(true)
    }
  }, [status?.pdf_url, status?.status])

  const handleDownload = async () => {
    if (!invoiceData?.pdf_url) return

    setIsDownloading(true)
    try {
      // Open PDF in new tab for download
      window.open(invoiceData.pdf_url, "_blank")

      toast({
        title: "Download Started",
        description: "Your invoice PDF is being downloaded.",
      })
    } catch (error) {
      toast({
        title: "Download Error",
        description: "Failed to download the invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleBackToForm = () => {
    router.push("/")
  }

  if (!invoiceData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading invoice data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If we have a PDF URL available, force UI to completed state and enable download
  const effectivePdfUrl = status?.pdf_url || invoiceData?.pdf_url || ""
  const showCompleted = Boolean(effectivePdfUrl)
  const showTimeout = isTimedOut && !effectivePdfUrl

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Success Header */}
        <Card className={`${showTimeout ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className={`rounded-full p-3 ${showTimeout ? 'bg-amber-100' : 'bg-green-100'}`}>
                <CheckCircle className={`h-8 w-8 ${showTimeout ? 'text-amber-600' : 'text-green-600'}`} />
              </div>
            </div>
            <h1 className={`text-2xl font-bold mb-2 ${showTimeout ? 'text-amber-800' : 'text-green-800'}`}>
              {showTimeout ? 'Invoice Processing' : 'Invoice Generated Successfully!'}
            </h1>
            <p className={showTimeout ? 'text-amber-700' : 'text-green-700'}>
              {showTimeout ? (
                <>
                  Your invoice is taking longer than expected to generate.
                  {timeRemaining > 0 && ` Time remaining: ${Math.ceil(timeRemaining / 1000)}s`}
                </>
              ) : (
                'Your professional invoice has been created and is ready for download.'
              )}
            </p>
            {shouldStopPolling && !status?.pdf_url && (
              <p className="text-sm text-gray-600 mt-2">
                Status checking has stopped. You can refresh the page or try generating another invoice.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Invoice Number</label>
                <p className="text-lg font-semibold">{invoiceData.invoice_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Client</label>
                <p className="text-lg font-semibold">{invoiceData.client_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                <p className="text-lg font-semibold text-green-600">
                  ${invoiceData.total_due.toFixed(2)}
                </p>
              </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  {showCompleted ? (
                    <Badge variant="secondary" className="text-green-700 bg-green-100">Completed</Badge>
                  ) : isFailed ? (
                    <Badge variant="secondary" className="text-red-700 bg-red-100">Failed</Badge>
                  ) : shouldStopPolling && !status?.pdf_url ? (
                    <Badge variant="secondary" className="text-gray-700 bg-gray-100">Check Manually</Badge>
                  ) : showTimeout ? (
                    <Badge variant="secondary" className="text-amber-700 bg-amber-100">Processing...</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-amber-700 bg-amber-100">Generating...</Badge>
                  )}
                </div>
            </div>

            {invoiceData.invoice_date && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Invoice Date</label>
                  <p className="text-sm">{invoiceData.invoice_date}</p>
                </div>
                {invoiceData.due_date && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                    <p className="text-sm">{invoiceData.due_date}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {showTimeout ? (
            <>
              <Button
                onClick={handleBackToForm}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
                size="lg"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Try Another Invoice
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Refresh Status
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleDownload}
                disabled={isDownloading || !effectivePdfUrl}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isDownloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {effectivePdfUrl ? 'Download Invoice' : 'Waiting for PDF URL...'}
                  </>
                )}
              </Button>

              <Button
                onClick={handleBackToForm}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Create Another Invoice
              </Button>
            </>
          )}
        </div>

        {/* Additional Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-100 p-2 mt-0.5">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-800 mb-1">What's Next?</h3>
                <p className="text-sm text-blue-700">
                  Your invoice has been generated and sent to your webhook endpoint.
                  You can now download the PDF or create another invoice.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function InvoiceSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading invoice data...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <InvoiceSuccessContent />
    </Suspense>
  )
}
