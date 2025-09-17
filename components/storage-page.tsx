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
    <Card className="w-full">
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Client Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Invoice #</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <User className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{invoice.clientName}</div>
                          <div className="text-sm text-gray-500 flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{invoice.createdAt}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-sm text-gray-700">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="py-4 px-4 font-medium text-gray-900">
                      ${invoice.amount.toFixed(2)}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="py-4 px-4">
                      {invoice.downloadUrl ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(invoice)}
                          disabled={loading}
                          className="flex items-center space-x-1"
                        >
                          <Download className="h-3 w-3" />
                          <span>Re-dl</span>
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
