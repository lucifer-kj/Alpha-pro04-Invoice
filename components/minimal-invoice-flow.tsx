"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { submitInvoiceToWebhook } from "@/lib/invoiceActions"

interface InvoiceData {
  client: {
    name: string
    email: string
    phone?: string
    address?: string
    cityState?: string
  }
  line_items: Array<{
    description: string
    quantity: number
    unit_price: number
  }>
  subtotal: number
  tax: number
  total: number
  tax_rate: number
}

export function MinimalInvoiceFlow() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    client: {
      name: "",
      email: "",
      phone: "",
      address: "",
      cityState: ""
    },
    line_items: [{ description: "", quantity: 1, unit_price: 0 }],
    subtotal: 0,
    tax: 0,
    total: 0,
    tax_rate: 0.1 // 10% default tax rate
  })

  const addItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      line_items: [...prev.line_items, { description: "", quantity: 1, unit_price: 0 }]
    }))
  }

  const removeItem = (index: number) => {
    if (invoiceData.line_items.length > 1) {
      setInvoiceData(prev => ({
        ...prev,
        line_items: prev.line_items.filter((_, i) => i !== index)
      }))
    }
  }

  const updateItem = (index: number, field: keyof InvoiceData['line_items'][0], value: string | number) => {
    setInvoiceData(prev => {
      const newLineItems = prev.line_items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
      
      // Recalculate totals
      const subtotal = newLineItems.reduce((total, item) => total + (item.quantity * item.unit_price), 0)
      const tax = subtotal * prev.tax_rate
      const total = subtotal + tax
      
      return {
        ...prev,
        line_items: newLineItems,
        subtotal,
        tax,
        total
      }
    })
  }

  const updateClient = (field: keyof InvoiceData['client'], value: string) => {
    setInvoiceData(prev => ({
      ...prev,
      client: { ...prev.client, [field]: value }
    }))
  }

  const handleSubmit = async () => {
    if (!invoiceData.client.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a client name",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true)
    try {
      const result = await submitInvoiceToWebhook(invoiceData)
      
      if (result.status === "accepted" || result.status === "success") {
        // Store invoice data in sessionStorage for success page
        const successData = {
          invoice_number: result.invoice_number || `INV-${Date.now()}`,
          client_name: invoiceData.client.name,
          total_due: invoiceData.total,
          invoice_date: new Date().toLocaleDateString(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          pdf_url: result.pdf_url || "" // Will be updated when PDF is ready
        }
        
        if (typeof window !== 'undefined') {
          sessionStorage.setItem("lastInvoiceData", JSON.stringify(successData))
        }
        
        toast({
          title: "Invoice Submitted",
          description: "Your invoice is being generated. You'll be redirected to check the status.",
        })
        
        // Redirect to success page after a short delay
        setTimeout(() => {
          router.push(`/invoice-success?invoice_number=${encodeURIComponent(result.invoice_number)}`)
        }, 1000)
      } else {
        throw new Error(result.message || "Failed to submit invoice")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate invoice",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Invoice Generator</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  value={invoiceData.client.name}
                  onChange={(e) => updateClient('name', e.target.value)}
                  placeholder="Enter client name"
                />
              </div>
              <div>
                <Label htmlFor="clientEmail">Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={invoiceData.client.email}
                  onChange={(e) => updateClient('email', e.target.value)}
                  placeholder="client@example.com"
                />
              </div>
              <div>
                <Label htmlFor="clientPhone">Phone</Label>
                <Input
                  id="clientPhone"
                  value={invoiceData.client.phone || ""}
                  onChange={(e) => updateClient('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Invoice Items</h3>
              <Button onClick={addItem} variant="outline" size="sm">
                Add Item
              </Button>
            </div>
            
            <div className="space-y-3">
              {invoiceData.line_items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2">
                    <Label htmlFor={`description-${index}`}>Description</Label>
                    <Input
                      id={`description-${index}`}
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Item description"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`rate-${index}`}>Rate ($)</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`rate-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      />
                      {invoiceData.line_items.length > 1 && (
                        <Button
                          onClick={() => removeItem(index)}
                          variant="outline"
                          size="sm"
                          className="px-2"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="text-right space-y-1">
                <div className="text-sm text-gray-600">
                  Subtotal: ${invoiceData.subtotal.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">
                  Tax ({(invoiceData.tax_rate * 100).toFixed(1)}%): ${invoiceData.tax.toFixed(2)}
                </div>
                <div className="text-lg font-semibold border-t pt-1">
                  Total: ${invoiceData.total.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !invoiceData.client.name.trim()}
              className="px-8"
            >
              {isSubmitting ? "Generating Invoice..." : "Generate Invoice"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
