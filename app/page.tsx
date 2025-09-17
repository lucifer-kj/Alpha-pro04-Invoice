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
          <InvoiceForm />
        ) : (
          <StoragePage />
        )}
      </div>
    </div>
  )
}