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

export function StorageSection() {
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
      }
    ]
    setInvoices(mockInvoices)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Storage</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invoices stored yet</p>
              <p className="text-sm">Downloaded invoices will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div 
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{invoice.clientName}</div>
                      <div className="text-sm text-gray-500 flex items-center space-x-2">
                        <span>{invoice.invoiceNumber}</span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{invoice.createdAt}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="font-medium">${invoice.amount.toFixed(2)}</div>
                      {getStatusBadge(invoice.status)}
                    </div>
                    
                    {invoice.downloadUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(invoice)}
                        disabled={loading}
                        className="flex items-center space-x-1"
                      >
                        <Download className="h-4 w-4" />
                        <span>Re-download</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
