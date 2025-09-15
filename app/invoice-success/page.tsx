"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Download, ArrowLeft, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

  useEffect(() => {
    // Get invoice data from URL params or session storage
    const invoiceNumber = searchParams.get("invoice_number")
    const clientName = searchParams.get("client_name")
    const totalDue = searchParams.get("total_due")
    const pdfUrl = searchParams.get("pdf_url")
    const invoiceDate = searchParams.get("invoice_date")
    const dueDate = searchParams.get("due_date")

    if (invoiceNumber && clientName && totalDue && pdfUrl) {
      setInvoiceData({
        invoice_number: invoiceNumber,
        client_name: clientName,
        total_due: parseFloat(totalDue),
        pdf_url: pdfUrl,
        invoice_date: invoiceDate || "",
        due_date: dueDate || "",
      })
    } else {
      // Try to get from session storage as fallback
      const storedData = sessionStorage.getItem("lastInvoiceData")
      if (storedData) {
        setInvoiceData(JSON.parse(storedData))
      }
    }
  }, [searchParams])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Success Header */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-green-800 mb-2">
              Invoice Generated Successfully!
            </h1>
            <p className="text-green-700">
              Your professional invoice has been created and is ready for download.
            </p>
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
                <Badge variant="secondary" className="text-green-700 bg-green-100">
                  Ready for Download
                </Badge>
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
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
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
                Download Invoice PDF
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
