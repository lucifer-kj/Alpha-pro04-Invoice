# Make.com Webhook Setup Guide

## 🔧 Current Webhook Configuration

Your application is currently configured to send invoice data to:
```
https://hook.eu2.make.com/84agsujsolsdlfazqvco8mo06ctypst9
```

## 📋 Make.com Webhook Response Requirements

For the application to work correctly, your Make.com webhook **MUST** return a JSON response with this structure:

```json
{
  "status": "success",
  "pdf_url": "https://your-storage-provider.com/invoices/invoice-123.pdf",
  "message": "Invoice generated successfully"
}
```

### Required Response Fields:
- `pdf_url`: The direct download link to the generated PDF invoice
- `status`: Either "success" or "error"
- `message`: Optional human-readable message

## 🏗️ Make.com Scenario Setup

### 1. Create a New Scenario
1. Go to [Make.com](https://www.make.com) and create a new scenario
2. Add a **Webhook** module as the trigger
3. Copy the webhook URL: `https://hook.eu2.make.com/84agsujsolsdlfazqvco8mo06ctypst9`

### 2. Configure the Webhook Module
- **Method**: POST
- **Content Type**: application/json
- **Data Structure**: The webhook will receive the following payload structure:

```json
{
  "invoice_number": "INV-2025-01-15-123",
  "invoice_date": "Jan 15, 2025",
  "due_date": "Jan 22, 2025",
  "client_name": "Quality and Care Building Inspection",
  "client_address": "123 Cloud Drive",
  "client_city": "TX",
  "client_state_zip": "TX 94043",
  "client_email": "user@example.com",
  "client_phone": "+1 9042920103",
  "item1": "Web Development",
  "price1": "$299.00",
  "item2": "AI Chatbot builder",
  "price2": "$149.00",
  "item3": "Total Due",
  "price3": "$1.99",
  "subtotal": "$448.00",
  "tax_rate": "10%",
  "taxes": "$48.80",
  "total_due": "$496.80"
}
```

### 3. Add PDF Generation Module
Add one of these modules to generate the PDF:

#### Option A: Google Docs + PDF Generator
1. **Google Docs** module - Create document from template
2. **PDF Generator** module - Convert to PDF
3. **Google Drive** module - Upload PDF
4. **Webhook Response** module - Return PDF URL

#### Option B: PDF Generator Service
1. **HTTP** module - Call PDF generation API (e.g., Puppeteer, PDFShift)
2. **File Storage** module - Save PDF (AWS S3, Google Drive, etc.)
3. **Webhook Response** module - Return PDF URL

### 4. Configure Webhook Response Module
**CRITICAL**: Add a **Webhook Response** module at the end with this exact configuration:

```json
{
  "status": "success",
  "pdf_url": "{{pdf_download_url_from_storage}}",
  "message": "Invoice generated successfully"
}
```

## 🧪 Testing Your Webhook

### 1. Test with Make.com's Test Feature
1. In your Make.com scenario, click **Run once**
2. Send a test payload to your webhook
3. Verify the scenario completes successfully
4. Check that the response includes a valid `pdf_url`

### 2. Test with the Application
1. Start your Next.js application: `npm run dev`
2. Go to the invoice creation flow
3. Fill out the form with test data
4. Submit the invoice
5. Verify you receive a PDF download link

### 3. Debug Common Issues

#### Issue: "Webhook did not return a valid PDF URL"
**Cause**: Make.com webhook response doesn't include `pdf_url` field
**Solution**: Ensure your Webhook Response module returns the correct JSON structure

#### Issue: "Failed to generate invoice"
**Cause**: Make.com scenario failed or returned an error
**Solution**: Check Make.com scenario logs and ensure all modules are configured correctly

#### Issue: PDF URL is not accessible
**Cause**: The PDF URL returned by Make.com is not publicly accessible
**Solution**: Ensure your PDF is uploaded to a public storage service (AWS S3, Google Drive with public sharing, etc.)

## 🔍 Monitoring and Logs

### Application Logs
Check your browser's developer console for detailed logs:
- Webhook request payload
- Response status and data
- Error messages

### Make.com Logs
1. Go to your scenario in Make.com
2. Click on the **History** tab
3. Check execution logs for any errors
4. Verify each module executes successfully

## 🛠️ Alternative Webhook URLs

If you need to use a different webhook URL, update the `invoiceActions.ts` file:

```typescript
// In lib/invoiceActions.ts, line 88-89
const response = await axios.post(
  "YOUR_NEW_WEBHOOK_URL_HERE", // Replace with your Make.com webhook URL
  payload,
  // ... rest of configuration
);
```

## 📝 Example Make.com Scenario Flow

```
1. Webhook (Trigger) 
   ↓ Receives invoice data
2. Google Docs (Create Invoice Document)
   ↓ Uses template with invoice data
3. PDF Generator (Convert to PDF)
   ↓ Creates PDF file
4. Google Drive (Upload PDF)
   ↓ Uploads to public folder
5. Webhook Response (Return PDF URL)
   ↓ Returns: {"status": "success", "pdf_url": "https://drive.google.com/..."}
```

## 🚨 Important Notes

1. **PDF URLs must be publicly accessible** - Users need to download the PDF directly
2. **Response format is strict** - Must include `pdf_url` field exactly as shown
3. **Timeout is 15 seconds** - Make.com scenario must complete within this time
4. **Error handling** - Always return a proper JSON response, even for errors

## 📞 Support

If you encounter issues:
1. Check Make.com scenario execution logs
2. Verify webhook response format matches requirements
3. Test PDF URL accessibility manually
4. Check browser console for detailed error messages
