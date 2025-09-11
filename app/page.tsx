import { ConversationalInvoiceFlow } from "@/components/conversational-invoice-flow"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
      <div className="container mx-auto px-4 py-6">
        <ConversationalInvoiceFlow />
      </div>
    </div>
  )
}
