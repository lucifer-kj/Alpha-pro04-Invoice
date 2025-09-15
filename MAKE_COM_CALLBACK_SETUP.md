# Make.com Callback Setup Guide

## 🔄 Enhanced Invoice Generation with Callbacks

Your application now supports **asynchronous invoice generation** with real-time status updates. This means Make.com can process invoices in the background and notify your application when they're ready.

## 🏗️ Updated Make.com Scenario Setup

### 1. Webhook Trigger Configuration
- **Method**: POST
- **Content Type**: application/json
- **Webhook URL**: `https://hook.eu2.make.com/84agsujsolsdlfazqvco8mo06ctypst9`

### 2. Received Data Structure
Your Make.com webhook will receive this payload:

```json
{
  "invoice_number": "INV-1705123456789-123",
  "callback_url": "http://localhost:3000/api/invoice-callback",
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
  "subtotal": "$448.00",
  "tax_rate": "10%",
  "taxes": "$48.80",
  "total_due": "$496.80"
}
```

### 3. Required Scenario Flow

```
1. Webhook (Trigger)
   ↓ Receives invoice data + callback_url
2. PDF Generation Module
   ↓ Creates PDF from template
3. File Storage Module
   ↓ Uploads PDF to public storage
4. HTTP Module (Callback)
   ↓ Calls your callback endpoint
5. Webhook Response
   ↓ Returns success status
```

### 4. HTTP Module Configuration (Callback)

Add an **HTTP** module after your PDF generation to call the callback:

**HTTP Request Settings:**
- **Method**: POST
- **URL**: `{{callback_url}}` (from webhook data)
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body**:
  ```json
  {
    "invoice_number": "{{invoice_number}}",
    "pdf_url": "{{pdf_download_url}}",
    "status": "success",
    "message": "Invoice generated successfully"
  }
  ```

### 5. Example Make.com Scenario Modules

#### Module 1: Webhook (Trigger)
```
Trigger: Webhook
Data: Invoice data + callback_url
```

#### Module 2: PDF Generation
```
Action: Create PDF from template
Template: Your invoice template
Data: Invoice data from webhook
```

#### Module 3: File Storage
```
Action: Upload PDF
Storage: Google Drive / AWS S3 / etc.
Settings: Public access enabled
Result: Public download URL
```

#### Module 4: HTTP Callback
```
Method: POST
URL: {{callback_url}}
Body: {
  "invoice_number": "{{invoice_number}}",
  "pdf_url": "{{public_pdf_url}}",
  "status": "success",
  "message": "Invoice ready"
}
```

#### Module 5: Webhook Response
```
Status: 200
Body: {
  "status": "success",
  "message": "Invoice submitted for processing"
}
```

## 🔧 Callback Endpoint Details

**Your Callback URL**: `http://localhost:3000/api/invoice-callback` (development)
**Production URL**: `https://yourdomain.com/api/invoice-callback`

### Expected Callback Response Format
```json
{
  "invoice_number": "INV-1705123456789-123",
  "pdf_url": "https://your-storage-provider.com/invoices/invoice-123.pdf",
  "status": "success",
  "message": "Invoice generated successfully"
}
```

## 🧪 Testing the Callback System

### 1. Test Callback Endpoint Directly
```bash
curl -X POST http://localhost:3000/api/invoice-callback \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_number": "INV-TEST-001",
    "pdf_url": "https://example.com/test.pdf",
    "status": "success",
    "message": "Test callback"
  }'
```

### 2. Test Full Flow
1. Start your Next.js app: `npm run dev`
2. Create an invoice through the UI
3. Check the browser console for logs
4. Monitor Make.com scenario execution
5. Verify callback is received

### 3. Check Invoice Status
```bash
curl http://localhost:3000/api/invoice-status/INV-TEST-001
```

## 📊 Status Tracking

The application now tracks invoice status in real-time:

- **pending**: Invoice submitted, waiting for processing
- **generating**: Make.com is processing the invoice
- **completed**: PDF ready for download
- **failed**: Error occurred during processing

## 🔍 Debugging Tips

### Check Application Logs
```bash
# In your terminal running the Next.js app
[INVOICE-ACTIONS] Sending invoice to Make.com webhook...
[INVOICE-ACTIONS] Payload: { ... }
[INVOICE-CALLBACK] Invoice callback received: ...
[INVOICE-STATE] Updated status for invoice: INV-...
```

### Check Make.com Scenario
1. Go to your scenario in Make.com
2. Click **History** tab
3. Check execution logs for each module
4. Verify HTTP callback module executed successfully

### Common Issues

#### Issue: Callback not received
**Causes:**
- Make.com HTTP module not configured correctly
- Callback URL not accessible from Make.com
- Network/firewall issues

**Solutions:**
- Verify callback URL is publicly accessible
- Check HTTP module configuration in Make.com
- Test callback endpoint manually

#### Issue: PDF URL not accessible
**Causes:**
- PDF uploaded to private storage
- Incorrect file permissions
- Storage provider issues

**Solutions:**
- Ensure PDF is uploaded to public storage
- Check file permissions
- Test PDF URL manually in browser

#### Issue: Status not updating
**Causes:**
- Invoice number mismatch
- State management issues
- Polling disabled

**Solutions:**
- Verify invoice numbers match
- Check browser console for errors
- Ensure polling is enabled

## 🚀 Production Deployment

### Environment Variables
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
WEBHOOK_URL=https://hook.eu2.make.com/84agsujsolsdlfazqvco8mo06ctypst9
```

### Make.com Production URL
Update your Make.com scenario to use the production callback URL:
```
https://yourdomain.com/api/invoice-callback
```

## 📝 Benefits of Callback System

1. **Asynchronous Processing**: Users don't wait for PDF generation
2. **Real-time Updates**: Status updates via polling
3. **Better UX**: Clear progress indicators
4. **Reliability**: Handles slow PDF generation gracefully
5. **Scalability**: Can handle multiple concurrent invoices

## 🔄 Flow Diagram

```
User submits invoice
       ↓
Create invoice status (pending)
       ↓
Send to Make.com webhook
       ↓
Make.com processes invoice
       ↓
Make.com calls callback endpoint
       ↓
Update invoice status (completed)
       ↓
UI polls for status updates
       ↓
Show PDF download when ready
```

This callback system provides a much better user experience and handles long-running PDF generation processes gracefully!
