"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Calendar, User } from "lucide-react"

interface StoredInvoice {
  id: string
  clientName: string
  invoiceNumber: string
  amount: number
  status: 'completed' | 'pending' | 'failed'
  createdAt: string
  downloadUrl?: string
}

export function StoragePage() {
  const [invoices, setInvoices] = useState<StoredInvoice[]>([])
  const [loading, setLoading] = useState(false)

  // Mock data for demonstration
  useEffect(() => {
    const mockInvoices: StoredInvoice[] = [
      {
        id: "1",
        clientName: "Acme Corporation",
        invoiceNumber: "INV-2024-001",
        amount: 2500.00,
        status: "completed",
        createdAt: "2024-01-15",
        downloadUrl: "/api/download/invoice-1"
      },
      {
        id: "2", 
        clientName: "TechStart Inc",
        invoiceNumber: "INV-2024-002",
        amount: 1800.50,
        status: "completed",
        createdAt: "2024-01-14",
        downloadUrl: "/api/download/invoice-2"
      },
      {
        id: "3",
        clientName: "Global Solutions Ltd",
        invoiceNumber: "INV-2024-003", 
        amount: 3200.75,
        status: "pending",
        createdAt: "2024-01-13"
      },
      {
        id: "4",
        clientName: "Digital Innovations Co",
        invoiceNumber: "INV-2024-004",
        amount: 4500.00,
        status: "completed",
        createdAt: "2024-01-12",
        downloadUrl: "/api/download/invoice-4"
      },
      {
        id: "5",
        clientName: "Creative Agency LLC",
        invoiceNumber: "INV-2024-005",
        amount: 2750.25,
        status: "failed",
        createdAt: "2024-01-11"
      }
    ]
    setInvoices(mockInvoices)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Done</Badge>
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pending</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handleDownload = async (invoice: StoredInvoice) => {
    if (!invoice.downloadUrl) return
    
    setLoading(true)
    try {
      // Simulate download
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log(`Downloading invoice ${invoice.invoiceNumber}`)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full rounded-2xl border border-gray-200/70 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Storage: Invoices List</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No invoices stored yet</p>
            <p className="text-sm">Downloaded invoices will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 border rounded-xl bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border-gray-200/70"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <User className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{invoice.clientName}</div>
                    <div className="text-sm text-gray-500 flex items-center space-x-2">
                      <span className="font-mono">{invoice.invoiceNumber}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{invoice.createdAt}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-semibold">${invoice.amount.toFixed(2)}</div>
                    {getStatusBadge(invoice.status)}
                  </div>
                  {invoice.downloadUrl ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(invoice)}
                      disabled={loading}
                      className="flex items-center space-x-1 transition-transform duration-200 hover:scale-[1.02]"
                    >
                      <Download className="h-4 w-4" />
                      <span>Re-download</span>
                    </Button>
                  ) : (
                    <span className="text-gray-400 text-sm">N/A</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
