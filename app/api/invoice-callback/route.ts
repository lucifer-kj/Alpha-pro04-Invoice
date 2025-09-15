import { NextResponse } from 'next/server';
import { z } from 'zod';
import InvoiceStateManager from '@/lib/invoice-state'

// Validation schema
const invoiceCallbackSchema = z.object({
  invoice_number: z.string().min(1, "Invoice number is required"),
  status: z.enum(['success', 'failed', 'processing']),
  pdf_base64: z.string().optional(),
  download_url: z.string().url().optional(),
  // Accept alias commonly used by workflows
  pdf_url: z.string().url().optional()
});

export async function POST(request: Request) {
  try {
    // 1. Authentication
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.INVOICE_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid API key.' },
        { status: 401 }
      );
    }

    // 2. Parse and validate payload
    let payload: any
    try {
      payload = await request.json();
    } catch (err) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const validation = invoiceCallbackSchema.safeParse(payload);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid payload',
          details: validation.error.format()
        },
        { status: 400 }
      );
    }

    const { invoice_number, status, pdf_base64, download_url, pdf_url } = validation.data;

    // 3. Validate that we have either base64 or download URL for success status
    const resolvedPdfUrl = download_url || pdf_url

    if (status === 'success' && !pdf_base64 && !resolvedPdfUrl) {
      return NextResponse.json(
        { error: 'Successful invoices require either pdf_base64 or download_url' },
        { status: 400 }
      );
    }

    // 4. Process the invoice callback (your business logic)
    console.log(`Processing callback for invoice: ${invoice_number}, status: ${status}`);

    // Example processing logic:
    // - Update database record
    // - Store PDF file
    // - Send notification email
    // - Update order status

    if (pdf_base64) {
      // Convert base64 to buffer and save to storage
      const pdfBuffer = Buffer.from(pdf_base64, 'base64');
      console.log(`Received PDF of size: ${pdfBuffer.length} bytes`);

      // Save to database or cloud storage
      // await saveInvoicePdf(invoice_number, pdfBuffer);
    }

    // Update invoice status in our DB for polling UI
    try {
      if (status === 'success') {
        if (resolvedPdfUrl) {
          InvoiceStateManager.markAsCompleted(invoice_number, resolvedPdfUrl)
        } else {
          // If only base64 provided, mark as completed without URL
          InvoiceStateManager.updateInvoiceStatus(invoice_number, { status: 'completed' })
        }
      } else if (status === 'failed') {
        InvoiceStateManager.markAsFailed(invoice_number, 'Processing failed')
      } else if (status === 'processing') {
        InvoiceStateManager.markAsGenerating(invoice_number)
      }
    } catch (e) {
      console.error('Failed to update invoice status from callback:', e)
    }

    // 5. Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Invoice callback processed successfully',
        invoice_number,
        status,
        pdf_url: resolvedPdfUrl,
        received_at: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Invoice callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Reject non-POST methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
