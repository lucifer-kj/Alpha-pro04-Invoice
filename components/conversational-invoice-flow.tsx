"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { submitInvoiceToWebhook } from "@/lib/webhook-client"
import { parseServicesText } from "@/lib/text-parser"
import { calculateInvoiceTotals } from "@/lib/invoice-calculations"
import { validateEmail } from "@/lib/validation"
import { useToast } from "@/hooks/use-toast"
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
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [animateIn, setAnimateIn] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [webhookError, setWebhookError] = useState<string | null>(null)

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
      const calculated = calculateInvoiceTotals(updated)
      setInvoiceData(calculated)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setPdfUrl(null)
    setWebhookError(null)

    try {
      const response = await submitInvoiceToWebhook(invoiceData, {
        url: "http://localhost:5678/webhook-test/88743cc0-d465-4fdb-a322-91f402cf6386",
        headers: { "Content-Type": "application/json" },
      })

      if (response.status === "success" && response.pdf_url) {
        setPdfUrl(response.pdf_url)
        setShowThankYou(true)
        toast({
          title: "🎉 Invoice Generated!",
          description: "Your professional invoice is ready for download.",
        })
      } else {
        throw new Error(response.message || "Failed to generate PDF")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate invoice"
      setWebhookError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true
      case 1:
        return invoiceData.client_name && invoiceData.client_email && validateEmail(invoiceData.client_email)
      case 2:
        return invoiceData.services_text.trim().length > 0 && invoiceData.line_items.length > 0
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Mobile Progress Bar */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Powered by Alpha
          </h1>
          <span className="text-sm font-medium text-gray-600">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="flex min-h-screen">
        {/* Desktop Left Sidebar - Step Navigation */}
        <div className="hidden lg:flex lg:w-80 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
          <div className="flex flex-col flex-1 min-h-0">
            {/* Logo */}
            <div className="flex items-center justify-center px-6 py-8 border-b border-gray-200">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Powered by Alpha
              </h1>
            </div>

            {/* Progress */}
            <div className="px-6 py-6 border-b border-gray-200">
              <div className="mb-4">
                <Progress value={progress} className="h-3" />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
            </div>

            {/* Step Navigation */}
            <nav className="flex-1 px-6 py-6 space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 ${
                    index === currentStep
                      ? "bg-blue-100 text-blue-700 shadow-sm"
                      : index < currentStep
                        ? "bg-green-50 text-green-700"
                        : "text-gray-400 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      index === currentStep
                        ? "bg-blue-200 text-blue-700"
                        : index < currentStep
                          ? "bg-green-200 text-green-700"
                          : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {step.completed ? <CheckCircle className="h-5 w-5" /> : step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${index <= currentStep ? "text-current" : "text-gray-400"}`}>
                      {step.title}
                    </p>
                    <p className={`text-xs ${index <= currentStep ? "text-current opacity-70" : "text-gray-400"}`}>
                      {step.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Powered
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Professional
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-80">
          <div className="max-w-4xl mx-auto px-4 py-8 lg:px-8 lg:py-12">
            <Card
              className={`shadow-xl border-0 transition-all duration-500 ${
                animateIn ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
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
                    canProceed={canProceed()}
                  />
                )}

                {currentStep === 2 && (
                  <ServicesStep
                    data={invoiceData}
                    onChange={handleServicesChange}
                    onNext={handleNext}
                    onBack={handleBack}
                    canProceed={canProceed()}
                  />
                )}

                {currentStep === 3 && (
                  <ReviewStep
                    data={invoiceData}
                    onSubmit={handleSubmit}
                    onBack={handleBack}
                    isSubmitting={isSubmitting}
                    pdfUrl={pdfUrl}
                    error={webhookError}
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
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
          Ready to create your
          <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            {" "}
            professional invoice
          </span>
          ?
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Our intelligent system will guide you through creating a professional invoice in minutes. Just answer a few
          questions and we'll handle the rest.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 my-8">
        <Badge variant="secondary" className="px-6 py-3 text-sm">
          <Sparkles className="h-4 w-4 mr-2" />
          AI-Powered Parsing
        </Badge>
        <Badge variant="secondary" className="px-6 py-3 text-sm">
          <CheckCircle className="h-4 w-4 mr-2" />
          Professional Design
        </Badge>
        <Badge variant="secondary" className="px-6 py-3 text-sm">
          <FileText className="h-4 w-4 mr-2" />
          Instant PDF Generation
        </Badge>
      </div>

      <div className="hidden lg:block">
        <Button onClick={onNext} size="lg" className="px-12 py-4 text-lg">
          Let's Get Started
          <ArrowRight className="h-5 w-5 ml-3" />
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
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <User className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Who are you invoicing?</h2>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          Tell us about your client so we can create the perfect invoice
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center">
              <User className="h-4 w-4 mr-2 text-blue-600" />
              Client Name *
            </label>
            <Input
              value={data.client_name}
              onChange={(e) => handleChange("client_name", e.target.value)}
              placeholder="Enter your client's name"
              className="h-14 text-base border-2 focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center">
              <Mail className="h-4 w-4 mr-2 text-blue-600" />
              Email Address *
            </label>
            <Input
              type="email"
              value={data.client_email}
              onChange={(e) => handleChange("client_email", e.target.value)}
              placeholder="client@company.com"
              className="h-14 text-base border-2 focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center">
              <Phone className="h-4 w-4 mr-2 text-blue-600" />
              Phone Number
            </label>
            <Input
              value={data.client_phone}
              onChange={(e) => handleChange("client_phone", e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="h-14 text-base border-2 focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-blue-600" />
              City & State
            </label>
            <Input
              value={data.client_city}
              onChange={(e) => handleChange("client_city", e.target.value)}
              placeholder="New York, NY"
              className="h-14 text-base border-2 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="hidden lg:flex justify-between pt-8 max-w-2xl mx-auto">
        <Button variant="outline" onClick={onBack} size="lg" className="px-8 bg-transparent">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed} size="lg" className="px-8">
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
        <h2 className="text-2xl font-bold text-gray-900">What services are you billing for?</h2>
        <p className="text-gray-600">Describe your services in plain English - our AI will parse the details</p>
      </div>

      <div className="space-y-4">
        <Textarea
          value={data.services_text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Example: Website development for $2,500, logo design for $500, and 3 months of hosting at $50 per month"
          rows={6}
          className="text-base"
        />

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 Tips for better parsing:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Include prices with $ symbol (e.g., "$500", "$1,200")</li>
            <li>• Mention quantities (e.g., "3 months at $50 each")</li>
            <li>• Be specific about services (e.g., "logo design", "website development")</li>
          </ul>
        </div>

        {data.line_items.length > 0 && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">✅ Parsed Services:</h4>
            <div className="space-y-2">
              {data.line_items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-green-800">{item.description}</span>
                  <span className="font-medium text-green-900">${item.total.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-green-200 pt-2 flex justify-between font-bold">
                <span className="text-green-900">Total:</span>
                <span className="text-green-900">${data.total_due.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
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
}: {
  data: InvoiceData
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
  pdfUrl?: string | null
  error?: string | null
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Ready to generate your invoice?</h2>
        <p className="text-gray-600">Review the details below and we'll create your professional PDF</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Client Information</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
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
          <h3 className="font-semibold text-gray-900">Invoice Summary</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${data.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({data.tax_rate}%):</span>
              <span>${data.taxes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Total:</span>
              <span>${data.total_due.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Services:</h4>
        <div className="space-y-1">
          {data.line_items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm text-blue-800">
              <span>{item.description}</span>
              <span>${item.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting} size="lg">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Validating your invoice...</h2>
          <p className="text-gray-600">Please wait while we verify your PDF is ready</p>
        </div>
      </div>
    )
  }

  if (validationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-6 p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <ExternalLink className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
          <p className="text-gray-600">{validationError}</p>
          <div className="space-y-3">
            <Button onClick={onStartOver} className="w-full">
              Try Again
            </Button>
            <p className="text-sm text-gray-500">If the problem persists, please contact support</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center space-y-8 p-8">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Thank You!</h1>
          <p className="text-lg text-gray-600">
            Your professional invoice has been generated successfully and is ready for download.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild size="lg" className="w-full">
            <a href={pdfUrl!} target="_blank" rel="noopener noreferrer">
              <Download className="h-5 w-5 mr-2" />
              Download Your Invoice
            </a>
          </Button>

          <Button asChild variant="outline" size="lg" className="w-full bg-transparent">
            <a href={pdfUrl!} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-5 w-5 mr-2" />
              View in Browser
            </a>
          </Button>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <Button variant="ghost" onClick={onStartOver} className="text-gray-600">
            Create Another Invoice
          </Button>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Powered by Alpha
          </h2>
          <p className="text-sm text-gray-500 mt-1">AUTOMATE | CONVERT | GROW</p>
        </div>
      </div>
    </div>
  )
}
