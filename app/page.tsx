import { MinimalInvoiceFlow } from "@/components/minimal-invoice-flow"
import { DatabaseStatus } from "@/components/database-status"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <DatabaseStatus />
        <MinimalInvoiceFlow />
      </div>
    </div>
  )
}
