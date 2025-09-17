import { InvoiceForm } from "@/components/invoice-form"
import { DatabaseStatus } from "@/components/database-status"
import { AppHeader } from "@/components/app-header"
import { StorageSection } from "@/components/storage-section"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <AppHeader />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <DatabaseStatus />
            <InvoiceForm />
          </div>
          <div className="space-y-6">
            <StorageSection />
          </div>
        </div>
      </div>
    </div>
  )
}
