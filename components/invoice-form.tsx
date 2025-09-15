"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ConversationalInput } from "./conversational-input"
import { InvoicePreview } from "./invoice-preview"
import { WebhookConfig } from "./webhook-config"
import { calculateInvoiceTotals } from "@/lib/invoice-calculations"
import { validateInvoiceData } from "@/lib/validation"
import { submitInvoiceToWebhook } from "@/lib/webhook-client"
import { useToast } from "@/hooks/use-toast"
import { Download, ExternalLink, User, Settings2 } from "lucide-react"

export interface LineItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface InvoiceData {
  invoice_number: string
  invoice_date: string
  due_date: string
  client_name: string
  client_address: string
  client_city: string
  client_state_zip: string
  client_email: string
  client_phone: string
  line_items: LineItem[]
  subtotal: number
  tax_rate: number
  taxes: number
  total_due: number
  notes: string
}

export function InvoiceForm() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [showWebhookConfig, setShowWebhookConfig] = useState(false)
  const [webhookConfig, setWebhookConfig] = useState({
    url: "http://localhost:5678/webhook-test/88743cc0-d465-4fdb-a322-91f402cf6386",
  })

  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoice_number: "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    client_name: "",
    client_address: "",
    client_city: "",
    client_state_zip: "",
    client_email: "",
    client_phone: "",
    line_items: [],
    subtotal: 0,
    tax_rate: 18,
    taxes: 0,
    total_due: 0,
    notes: "",
  })

  const handleClientInfoChange = (field: keyof InvoiceData, value: string | number) => {
    setInvoiceData((prev) => {
      const updated = { ...prev, [field]: value }
      return calculateInvoiceTotals(updated)
    })
  }

  const handleServicesTextParsed = (lineItems: LineItem[]) => {
    setInvoiceData((prev) => {
      const updated = { ...prev, line_items: lineItems }
      return calculateInvoiceTotals(updated)
    })
  }

  const handleSubmit = async () => {
    const validation = validateInvoiceData(invoiceData)
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(", "),
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      console.log("[v0] Starting invoice submission...")

      const response = await submitInvoiceToWebhook(invoiceData, {
        url: webhookConfig.url,
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("[v0] Webhook response received:", response)

      if (response.status === "success") {
        // Store invoice data for the success page
        const successData = {
          invoice_number: invoiceData.invoice_number,
          client_name: invoiceData.client_name,
          total_due: invoiceData.total_due,
          pdf_url: response.pdf_url || "",
          invoice_date: invoiceData.invoice_date,
          due_date: invoiceData.due_date,
        }
        
        // Store in session storage as backup
        sessionStorage.setItem("lastInvoiceData", JSON.stringify(successData))
        
        // Redirect to success page with data as URL params
        const params = new URLSearchParams({
          invoice_number: invoiceData.invoice_number,
          client_name: invoiceData.client_name,
          total_due: invoiceData.total_due.toString(),
          pdf_url: response.pdf_url || "",
          invoice_date: invoiceData.invoice_date,
          due_date: invoiceData.due_date,
        })
        
        window.location.href = `/invoice-success?${params.toString()}`
      } else {
        throw new Error(response.message || "Failed to generate PDF")
      }
    } catch (error) {
      console.error("[v0] Invoice submission error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate invoice",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
      {/* Left Column - Form (2/3 width on xl screens) */}
      <div className="xl:col-span-2 space-y-6">
        {/* Webhook Configuration - Collapsible on mobile */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Configuration
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWebhookConfig(!showWebhookConfig)}
              className="md:hidden"
            >
              {showWebhookConfig ? "Hide" : "Show"}
            </Button>
          </div>
          <div className={`${showWebhookConfig ? "block" : "hidden"} md:block`}>
            <WebhookConfig onConfigChange={setWebhookConfig} />
          </div>
        </div>

        {/* Client Information */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_name" className="text-sm font-medium">
                  Client Name *
                </Label>
                <Input
                  id="client_name"
                  value={invoiceData.client_name}
                  onChange={(e) => handleClientInfoChange("client_name", e.target.value)}
                  placeholder="Enter client name"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_email" className="text-sm font-medium">
                  Email *
                </Label>
                <Input
                  id="client_email"
                  type="email"
                  value={invoiceData.client_email}
                  onChange={(e) => handleClientInfoChange("client_email", e.target.value)}
                  placeholder="client@example.com"
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_phone" className="text-sm font-medium">
                  Phone
                </Label>
                <Input
                  id="client_phone"
                  value={invoiceData.client_phone}
                  onChange={(e) => handleClientInfoChange("client_phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_rate" className="text-sm font-medium">
                  Tax Rate (%)
                </Label>
                <Input
                  id="tax_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={invoiceData.tax_rate}
                  onChange={(e) => handleClientInfoChange("tax_rate", Number.parseFloat(e.target.value) || 0)}
                  placeholder="18"
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_address" className="text-sm font-medium">
                Address
              </Label>
              <Input
                id="client_address"
                value={invoiceData.client_address}
                onChange={(e) => handleClientInfoChange("client_address", e.target.value)}
                placeholder="Street address"
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_city" className="text-sm font-medium">
                  City
                </Label>
                <Input
                  id="client_city"
                  value={invoiceData.client_city}
                  onChange={(e) => handleClientInfoChange("client_city", e.target.value)}
                  placeholder="City"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_state_zip" className="text-sm font-medium">
                  State & ZIP
                </Label>
                <Input
                  id="client_state_zip"
                  value={invoiceData.client_state_zip}
                  onChange={(e) => handleClientInfoChange("client_state_zip", e.target.value)}
                  placeholder="CA 90210"
                  className="h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversational Input */}
        <ConversationalInput onServicesParsed={handleServicesTextParsed} />

        {/* Additional Notes */}
        <Card className="shadow-sm border-border/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Additional Notes
              </Label>
              <Textarea
                id="notes"
                value={invoiceData.notes}
                onChange={(e) => handleClientInfoChange("notes", e.target.value)}
                placeholder="Any additional notes or terms..."
                rows={3}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons - Sticky on mobile */}
        <div className="sticky bottom-4 z-10 bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-border/50 md:bg-transparent md:backdrop-blur-none md:border-none md:p-0 md:static">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || invoiceData.line_items.length === 0}
              className="flex-1 h-12 text-base font-medium"
              size="lg"
            >
              {isSubmitting ? "Generating Invoice..." : "Generate Invoice"}
            </Button>

            {pdfUrl && (
              <div className="flex gap-3">
                <Button asChild variant="secondary" size="lg" className="flex-1 h-12">
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-4 bg-transparent">
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Preview (1/3 width on xl screens, full width on smaller) */}
      <div className="xl:col-span-1">
        <div className="xl:sticky xl:top-8">
          <InvoicePreview invoiceData={invoiceData} />
        </div>
      </div>
    </div>
  )
}
