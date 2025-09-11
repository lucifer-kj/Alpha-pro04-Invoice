"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import type { InvoiceData } from "./invoice-form"
import { FileText, Calendar, User, Mail, Phone, MapPin, DollarSign } from "lucide-react"

interface InvoicePreviewProps {
  invoiceData: InvoiceData
}

export function InvoicePreview({ invoiceData }: InvoicePreviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Card className="shadow-lg border-border/50 overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pb-4">
        <CardTitle className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-primary/20 rounded-lg">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          Invoice Preview
          <Badge variant="outline" className="ml-auto text-xs">
            Live Preview
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Invoice Header */}
        <div className="text-center space-y-3 p-4 bg-muted/30 rounded-lg">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-2">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-primary">INVOICE</h2>
          <p className="text-sm text-muted-foreground font-mono">#{invoiceData.invoice_number || "INV-XXXX-XXX"}</p>
        </div>

        {/* Company Info */}
        <div className="text-center space-y-1 p-3 border rounded-lg">
          <h3 className="font-semibold text-lg">Alpha Business Digital</h3>
          <p className="text-sm text-muted-foreground">Digital Marketing Solutions</p>
        </div>

        <Separator />

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3 p-3 bg-card rounded-lg border">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Invoice Date</p>
              <p className="text-muted-foreground">
                {invoiceData.invoice_date ? formatDate(invoiceData.invoice_date) : "Not set"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-card rounded-lg border">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Due Date</p>
              <p className="text-muted-foreground">
                {invoiceData.due_date ? formatDate(invoiceData.due_date) : "Not set"}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Client Info */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            Bill To:
          </h4>
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <p className="font-medium text-base">{invoiceData.client_name || "Client Name"}</p>
            {invoiceData.client_email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span>{invoiceData.client_email}</span>
              </div>
            )}
            {invoiceData.client_phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{invoiceData.client_phone}</span>
              </div>
            )}
            {(invoiceData.client_address || invoiceData.client_city || invoiceData.client_state_zip) && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 mt-0.5" />
                <div>
                  {invoiceData.client_address && <p>{invoiceData.client_address}</p>}
                  {(invoiceData.client_city || invoiceData.client_state_zip) && (
                    <p>
                      {invoiceData.client_city} {invoiceData.client_state_zip}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Line Items */}
        <div className="space-y-4">
          <h4 className="font-semibold">Services</h4>
          {invoiceData.line_items.length > 0 ? (
            <div className="space-y-3">
              {invoiceData.line_items.map((item, index) => (
                <div key={index} className="flex justify-between items-start p-3 bg-card rounded-lg border text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.description}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.quantity} × {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                  <p className="font-medium font-mono ml-3">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm italic">No services added yet</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span className="font-mono">{formatCurrency(invoiceData.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax ({invoiceData.tax_rate}%):</span>
            <span className="font-mono">{formatCurrency(invoiceData.taxes)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total Due:</span>
            <span className="text-primary font-mono">{formatCurrency(invoiceData.total_due)}</span>
          </div>
        </div>

        {invoiceData.notes && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Notes</h4>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground leading-relaxed">{invoiceData.notes}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
