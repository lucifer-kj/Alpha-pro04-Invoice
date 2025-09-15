import { WebhookTesting } from "@/components/webhook-testing"

export default function TestWebhookPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Webhook Testing & Diagnostics</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Test your Make.com webhook setup and diagnose any issues with invoice generation
            </p>
          </div>
          
          <WebhookTesting />
          
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Expected Make.com Webhook Response</h2>
            <p className="text-gray-600 mb-4">
              Your Make.com scenario must return a JSON response with this exact structure:
            </p>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "status": "success",
  "pdf_url": "https://your-storage-provider.com/invoices/invoice-123.pdf",
  "message": "Invoice generated successfully"
}`}
            </pre>
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>Important:</strong> The <code>pdf_url</code> field is required and must be a publicly accessible URL.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
