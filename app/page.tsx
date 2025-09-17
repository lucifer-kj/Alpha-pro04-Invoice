"use client"

import { useState } from "react"
import { InvoiceForm } from "@/components/invoice-form"
import { BentoHeader } from "@/components/bento-header"
import { Navigation } from "@/components/navigation"
import { StoragePage } from "@/components/storage-page"

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<'home' | 'storage'>('home')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
      <div className="container mx-auto px-4 py-6">
        {/* Bento Header */}
        <BentoHeader />
        
        {/* Navigation */}
        <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
        
        {/* Page Content */}
        {currentPage === 'home' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InvoiceForm />
            <div className="lg:col-span-1">
              {/* Invoice Preview placeholder - you can add the actual component here */}
              <div className="bg-white rounded-lg border p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Invoice Preview</h3>
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-teal-600 font-bold text-2xl">$</span>
                  </div>
                  <p className="text-teal-600 font-semibold text-lg">INVOICE</p>
                  <p className="text-gray-400 font-mono">#INV-XXXX-XXX</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <StoragePage />
        )}
      </div>
    </div>
  )
}
v18