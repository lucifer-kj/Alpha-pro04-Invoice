"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { submitInvoiceToWebhook } from "@/lib/invoiceActions"
import { useInvoiceStatus } from "@/hooks/use-invoice-status"
import { parseServicesText } from "@/lib/text-parser"
import { calculateInvoiceTotals } from "@/lib/invoice-calculations"
import { validateEmail } from "@/lib/validation"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Sparkles,
  Download,
  ExternalLink,
} from "lucide-react"

interface ConversationStep {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  completed: boolean
}

interface InvoiceData {
  client_name: string
  client_email: string
  client_phone: string
  client_address: string
  client_city: string
  client_state_zip: string
  services_text: string
  line_items: Array<{
    description: string
    quantity: number
    unit_price: number
    total: number
  }>
  subtotal: number
  tax_rate: number
  taxes: number
  total_due: number
  invoice_number: string
  invoice_date: string
  due_date: string
  notes: string
}

export function ConversationalInvoiceFlow() {
  const { toast } = useToast()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [animateIn, setAnimateIn] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [webhookError, setWebhookError] = useState<string | null>(null)
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState<string | null>(null)

  // Poll invoice status when an invoice is being generated
  const {
    status: invoiceStatus,
    loading: statusLoading,
    error: statusError,
    isCompleted,
    isFailed,
    isGenerating,
    isPolling
  } = useInvoiceStatus(currentInvoiceNumber, {
    pollInterval: 3000, // Check every 3 seconds
    maxPollAttempts: 40, // Poll for up to 2 minutes
    enabled: !!currentInvoiceNumber && !pdfUrl // Only poll if we have an invoice number but no PDF yet
  })

  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    client_name: "",
    client_email: "",
    client_phone: "",
    client_address: "",
    client_city: "",
    client_state_zip: "",
    services_text: "",
    line_items: [],
    subtotal: 0,
    tax_rate: 18,
    taxes: 0,
    total_due: 0,
    invoice_number: `INV-${Date.now()}`,
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
  })

  const steps: ConversationStep[] = [
    {
      id: "welcome",
      title: "Welcome to Alpha Business Digital",
      subtitle: "Let's create your professional invoice in just a few steps",
      icon: <Sparkles className="h-6 w-6" />,
      completed: currentStep > 0,
    },
    {
      id: "client-info",
      title: "Tell us about your client",
      subtitle: "We'll need their basic contact information",
      icon: <User className="h-6 w-6" />,
      completed: currentStep > 1,
    },
    {
      id: "services",
      title: "Describe your services",
      subtitle: "Just tell us what you're billing for in plain English",
      icon: <FileText className="h-6 w-6" />,
      completed: currentStep > 2,
    },
    {
      id: "review",
      title: "Review & Generate",
      subtitle: "Everything looks good? Let's create your invoice",
      icon: <CheckCircle className="h-6 w-6" />,
      completed: currentStep > 3,
    },
  ]

  useEffect(() => {
    setAnimateIn(true)
  }, [currentStep])

  // Handle invoice status updates
  useEffect(() => {
    if (isCompleted && invoiceStatus?.pdf_url) {
      console.log("[INVOICE-FLOW] Invoice completed, PDF ready:", invoiceStatus.pdf_url)
      setPdfUrl(invoiceStatus.pdf_url)
      setShowThankYou(true)
      setIsSubmitting(false)
      toast({
        title: "🎉 Invoice Generated!",
        description: "Your professional invoice is ready for download.",
      })
    } else if (isFailed && invoiceStatus?.error_message) {
      console.log("[INVOICE-FLOW] Invoice generation failed:", invoiceStatus.error_message)
      setWebhookError(invoiceStatus.error_message)
      setIsSubmitting(false)
      toast({
        title: "Error",
        description: invoiceStatus.error_message,
        variant: "destructive",
      })
    }
  }, [isCompleted, isFailed, invoiceStatus, toast])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setAnimateIn(false)
      setTimeout(() => setCurrentStep(currentStep + 1), 150)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setAnimateIn(false)
      setTimeout(() => setCurrentStep(currentStep - 1), 150)
    }
  }

  const handleServicesChange = (text: string) => {
    setInvoiceData((prev) => ({ ...prev, services_text: text }))

    if (text.trim()) {
      const parsed = parseServicesText(text)
      const updated = { ...invoiceData, line_items: parsed, services_text: text }
      // Transform to match the expected InvoiceData type for calculations
      const dataForCalculation = {
        ...updated,
        invoice_number: updated.invoice_number,
        invoice_date: updated.invoice_date,
        due_date: updated.due_date,
        notes: updated.notes,
      }
      const calculated = calculateInvoiceTotals(dataForCalculation)
      // Merge back the calculated values while preserving services_text
      setInvoiceData({ ...updated, ...calculated })
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setWebhookError(null)

    try {
      // Transform flat InvoiceData structure to expected nested structure
      const transformedInvoiceData = {
        client: {
          name: invoiceData.client_name,
          email: invoiceData.client_email,
          phone: invoiceData.client_phone || undefined,
          address: invoiceData.client_address || undefined,
          cityState: `${invoiceData.client_city}${invoiceData.client_state_zip ? ', ' + invoiceData.client_state_zip : ''}` || undefined,
        },
        line_items: invoiceData.line_items,
        subtotal: invoiceData.subtotal,
        tax: invoiceData.taxes,
        total: invoiceData.total_due,
        tax_rate: invoiceData.tax_rate,
      }

      console.log("[INVOICE-FLOW] Transformed invoice data for webhook:", transformedInvoiceData)

      const response = await submitInvoiceToWebhook(transformedInvoiceData)

      // Ensure we have the invoice number to start polling/redirect
      const invoiceNumberFromServer = response.invoice_number || invoiceData.invoice_number
      if (invoiceNumberFromServer) {
        setCurrentInvoiceNumber(invoiceNumberFromServer)
        // Store lightweight details for success page display continuity
        try {
          sessionStorage.setItem("lastInvoiceData", JSON.stringify({
            client_name: invoiceData.client_name,
            total_due: invoiceData.total_due,
            invoice_date: invoiceData.invoice_date,
            due_date: invoiceData.due_date,
          }))
        } catch {}
      }

      if (response.status === "success" && response.pdf_url) {
        // Direct success: go to success page immediately
        router.push(`/invoice-success?invoice_number=${encodeURIComponent(invoiceNumberFromServer)}`)
        return
      }

      if (response.status === "accepted") {
        // Background processing: redirect to success page which will poll
        router.push(`/invoice-success?invoice_number=${encodeURIComponent(invoiceNumberFromServer)}`)
        return
      }

      throw new Error(response.message || "Failed to initiate invoice generation")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate invoice"
      setWebhookError(errorMessage)
      setIsSubmitting(false)
      
      // Mark invoice as failed via API if we have an invoice number
      if (currentInvoiceNumber) {
        try {
          await fetch(`/api/invoice-status/${currentInvoiceNumber}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'failed', error_message: errorMessage })
          })
        } catch {}
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0:
        return true
      case 1:
        return Boolean(invoiceData.client_name && invoiceData.client_email && validateEmail(invoiceData.client_email))
      case 2:
        return Boolean(invoiceData.services_text.trim().length > 0 && invoiceData.line_items.length > 0)
      case 3:
        return true
      default:
        return false
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  if (showThankYou) {
    return (
      <ThankYouPage
        pdfUrl={pdfUrl}
        error={webhookError}
        onStartOver={() => {
          setShowThankYou(false)
          setCurrentStep(0)
          setPdfUrl(null)
          setWebhookError(null)
          setInvoiceData({
            client_name: "",
            client_email: "",
            client_phone: "",
            client_address: "",
            client_city: "",
            client_state_zip: "",
            services_text: "",
            line_items: [],
            subtotal: 0,
            tax_rate: 18,
            taxes: 0,
            total_due: 0,
            invoice_number: `INV-${Date.now()}`,
            invoice_date: new Date().toISOString().split("T")[0],
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            notes: "",
          })
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Full-screen Generating Overlay */}
      {(isSubmitting || isPolling) && (
        <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white border border-gray-200 rounded-xl shadow-md px-8 py-6 text-center">
            <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-900 font-medium">Generating your invoice...</p>
            <p className="text-gray-600 text-sm mt-1">This can take up to 1 minute.</p>
          </div>
        </div>
      )}
      {/* Mobile Progress Bar */}
      <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-gray-900">Powered by Alpha</h1>
          <span className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
        <Progress value={progress} className="h-1.5 bg-gray-100" />
      </div>

      <div className="flex min-h-screen">
        {/* Desktop Left Sidebar - Step Navigation */}
        <div className="hidden lg:flex lg:w-80 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-gray-100">
          <div className="flex flex-col flex-1 min-h-0">
            {/* Logo */}
            <div className="flex items-center justify-center px-6 py-8 border-b border-gray-100">
              <h1 className="text-xl font-semibold text-gray-900">Powered by Alpha</h1>
            </div>

            {/* Progress */}
            <div className="px-6 py-6 border-b border-gray-100">
              <div className="mb-4">
                <Progress value={progress} className="h-2 bg-gray-100" />
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Step Navigation */}
            <nav className="flex-1 px-6 py-6 space-y-3">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-200 ${
                    index === currentStep
                      ? "bg-gray-50 border border-gray-200"
                      : index < currentStep
                        ? "bg-gray-25"
                        : "hover:bg-gray-25"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                      index === currentStep
                        ? "bg-gray-900 text-white"
                        : index < currentStep
                          ? "bg-gray-200 text-gray-600"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${index <= currentStep ? "text-gray-900" : "text-gray-400"}`}>
                      {step.title}
                    </p>
                    <p className={`text-xs ${index <= currentStep ? "text-gray-500" : "text-gray-400"}`}>
                      {step.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="text-xs text-gray-400 text-center">Professional Invoice Generator</div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-80">
          <div className="max-w-3xl mx-auto px-4 py-8 lg:px-8 lg:py-12">
            <Card
              className={`bg-white border border-gray-200 shadow-sm transition-all duration-300 ${
                animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <CardContent className="p-8 lg:p-12">
                {currentStep === 0 && <WelcomeStep onNext={handleNext} />}

                {currentStep === 1 && (
                  <ClientInfoStep
                    data={invoiceData}
                    onChange={setInvoiceData}
                    onNext={handleNext}
                    onBack={handleBack}
                    canProceed={canProceed() as boolean}
                  />
                )}

                {currentStep === 2 && (
                  <ServicesStep
                    data={invoiceData}
                    onChange={handleServicesChange}
                    onNext={handleNext}
                    onBack={handleBack}
                    canProceed={canProceed() as boolean}
                  />
                )}

                {currentStep === 3 && (
                  <ReviewStep
                    data={invoiceData}
                    onSubmit={handleSubmit}
                    onBack={handleBack}
                    isSubmitting={isSubmitting}
                    pdfUrl={pdfUrl || null}
                    error={webhookError || null}
                    invoiceStatus={invoiceStatus}
                    isPolling={isPolling}
                    currentInvoiceNumber={currentInvoiceNumber}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-6">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <Sparkles className="h-8 w-8 text-gray-600" />
        </div>
        <h1 className="text-3xl lg:text-4xl font-semibold text-gray-900 leading-tight">
          Create your professional invoice
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Our intelligent system will guide you through creating a professional invoice in minutes. Just answer a few
          questions and we'll handle the rest.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-6 my-8 text-sm text-gray-500">
        <span>• AI-Powered Parsing</span>
        <span>• Professional Design</span>
        <span>• Instant PDF Generation</span>
      </div>

      <div className="hidden lg:block">
        <Button onClick={onNext} size="lg" className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white">
          Get Started
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function ClientInfoStep({
  data,
  onChange,
  onNext,
  onBack,
  canProceed,
}: {
  data: InvoiceData
  onChange: (data: InvoiceData) => void
  onNext: () => void
  onBack: () => void
  canProceed: boolean
}) {
  const handleChange = (field: keyof InvoiceData, value: string) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <User className="h-6 w-6 text-gray-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">Client Information</h2>
        <p className="text-gray-600 max-w-xl mx-auto">Tell us about your client so we can create the perfect invoice</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-400" />
              Client Name *
            </label>
            <Input
              value={data.client_name}
              onChange={(e) => handleChange("client_name", e.target.value)}
              placeholder="Enter client name"
              className="h-12 border-gray-200 focus:border-gray-400 focus:ring-0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Mail className="h-4 w-4 mr-2 text-gray-400" />
              Email Address *
            </label>
            <Input
              type="email"
              value={data.client_email}
              onChange={(e) => handleChange("client_email", e.target.value)}
              placeholder="client@company.com"
              className="h-12 border-gray-200 focus:border-gray-400 focus:ring-0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Phone className="h-4 w-4 mr-2 text-gray-400" />
              Phone Number
            </label>
            <Input
              value={data.client_phone}
              onChange={(e) => handleChange("client_phone", e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="h-12 border-gray-200 focus:border-gray-400 focus:ring-0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              City & State
            </label>
            <Input
              value={data.client_city}
              onChange={(e) => handleChange("client_city", e.target.value)}
              placeholder="New York, NY"
              className="h-12 border-gray-200 focus:border-gray-400 focus:ring-0"
            />
          </div>
        </div>
      </div>

      <div className="hidden lg:flex justify-between pt-8 max-w-2xl mx-auto">
        <Button
          variant="outline"
          onClick={onBack}
          size="lg"
          className="px-6 border-gray-200 text-gray-600 hover:bg-gray-50 bg-transparent"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          size="lg"
          className="px-6 bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-300"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// Services Step Component
function ServicesStep({
  data,
  onChange,
  onNext,
  onBack,
  canProceed,
}: {
  data: InvoiceData
  onChange: (text: string) => void
  onNext: () => void
  onBack: () => void
  canProceed: boolean
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">Services & Pricing</h2>
        <p className="text-gray-600">Describe your services in plain English - our AI will parse the details</p>
      </div>

      <div className="space-y-4">
        <Textarea
          value={data.services_text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Example: Website development for $2,500, logo design for $500, and 3 months of hosting at $50 per month"
          rows={6}
          className="border-gray-200 focus:border-gray-400 focus:ring-0"
        />

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h4 className="font-medium text-gray-900 mb-2">Tips for better parsing:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Include prices with $ symbol (e.g., "$500", "$1,200")</li>
            <li>• Mention quantities (e.g., "3 months at $50 each")</li>
            <li>• Be specific about services (e.g., "logo design", "website development")</li>
          </ul>
        </div>

        {data.line_items.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h4 className="font-medium text-gray-900 mb-2">Parsed Services:</h4>
            <div className="space-y-2">
              {data.line_items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.description}</span>
                  <span className="font-medium text-gray-900">${item.total.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">${data.total_due.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-gray-200 text-gray-600 hover:bg-gray-50 bg-transparent"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-300"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// Review Step Component
function ReviewStep({
  data,
  onSubmit,
  onBack,
  isSubmitting,
  error,
  invoiceStatus,
  isPolling,
  currentInvoiceNumber,
}: {
  data: InvoiceData
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
  pdfUrl?: string | null
  error?: string | null
  invoiceStatus?: any
  isPolling?: boolean
  currentInvoiceNumber?: string | null
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">Review & Generate</h2>
        <p className="text-gray-600">Review the details below and we'll create your professional PDF</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Invoice Generation Status */}
      {isSubmitting && currentInvoiceNumber && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse flex-shrink-0"></div>
            <div className="flex-1">
              <p className="text-blue-800 text-sm font-medium">
                Generating your invoice...
              </p>
              <p className="text-blue-600 text-xs">
                Invoice #{currentInvoiceNumber}
                {isPolling && " • Checking for updates..."}
              </p>
            </div>
          </div>
        </div>
      )}

      {invoiceStatus && (
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-800 text-sm font-medium">
                Status: {invoiceStatus.status}
              </p>
              <p className="text-gray-600 text-xs">
                Last updated: {new Date(invoiceStatus.updated_at).toLocaleTimeString()}
              </p>
            </div>
            {invoiceStatus.status === 'generating' && (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Client Information</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm border border-gray-100">
            <div>
              <strong>Name:</strong> {data.client_name}
            </div>
            <div>
              <strong>Email:</strong> {data.client_email}
            </div>
            {data.client_phone && (
              <div>
                <strong>Phone:</strong> {data.client_phone}
              </div>
            )}
            {data.client_city && (
              <div>
                <strong>Location:</strong> {data.client_city}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Invoice Summary</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm border border-gray-100">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${data.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({data.tax_rate}%):</span>
              <span>${data.taxes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-gray-200 pt-2">
              <span>Total:</span>
              <span>${data.total_due.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <h4 className="font-medium text-gray-900 mb-2">Services:</h4>
        <div className="space-y-1">
          {data.line_items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm text-gray-700">
              <span>{item.description}</span>
              <span>${item.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="border-gray-200 text-gray-600 hover:bg-gray-50 bg-transparent"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          size="lg"
          className="bg-gray-900 hover:bg-gray-800 text-white"
        >
          {isSubmitting ? "Generating Invoice..." : "Generate Invoice"}
          {!isSubmitting && <Sparkles className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  )
}

// ThankYouPage Component
function ThankYouPage({
  pdfUrl,
  error,
  onStartOver,
}: {
  pdfUrl: string | null
  error: string | null
  onStartOver: () => void
}) {
  const [isValidating, setIsValidating] = useState(true)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    const validatePdfUrl = async () => {
      if (!pdfUrl) {
        setValidationError("No PDF URL received from webhook")
        setIsValidating(false)
        return
      }

      try {
        const response = await fetch(pdfUrl, { method: "HEAD" })
        if (!response.ok) {
          throw new Error(`PDF not accessible (${response.status})`)
        }
        setIsValidating(false)
      } catch (err) {
        setValidationError(err instanceof Error ? err.message : "Failed to validate PDF")
        setIsValidating(false)
      }
    }

    if (pdfUrl) {
      validatePdfUrl()
    } else if (error) {
      setValidationError(error)
      setIsValidating(false)
    }
  }, [pdfUrl, error])

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="h-6 w-6 text-gray-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Validating your invoice...</h2>
          <p className="text-gray-600">Please wait while we verify your PDF is ready</p>
        </div>
      </div>
    )
  }

  if (validationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-6 p-8">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <ExternalLink className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
          <p className="text-gray-600">{validationError}</p>
          <div className="space-y-3">
            <Button onClick={onStartOver} className="w-full bg-gray-900 hover:bg-gray-800 text-white">
              Try Again
            </Button>
            <p className="text-sm text-gray-500">If the problem persists, please contact support</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center space-y-8 p-8">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-gray-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Thank You!</h1>
          <p className="text-gray-600">
            Your professional invoice has been generated successfully and is ready for download.
          </p>
        </div>

        <div className="space-y-3">
          <Button asChild size="lg" className="w-full bg-gray-900 hover:bg-gray-800 text-white">
            <a href={pdfUrl!} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-2" />
              Download Your Invoice
            </a>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 bg-transparent"
          >
            <a href={pdfUrl!} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View in Browser
            </a>
          </Button>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <Button variant="ghost" onClick={onStartOver} className="text-gray-500 hover:text-gray-700">
            Create Another Invoice
          </Button>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">Powered by Alpha</h2>
          <p className="text-sm text-gray-500 mt-1">AUTOMATE | CONVERT | GROW</p>
        </div>
      </div>
    </div>
  )
}
