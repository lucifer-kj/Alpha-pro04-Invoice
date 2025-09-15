#!/usr/bin/env node

/**
 * Webhook Testing Script
 * 
 * This script helps you test your Make.com webhook setup
 * Run with: node scripts/test-webhook.js
 */

const axios = require('axios');

const WEBHOOK_URL = 'https://hook.eu2.make.com/84agsujsolsdlfazqvco8mo06ctypst9';

const samplePayload = {
  invoice_number: "INV-TEST-2025-001",
  invoice_date: "Jan 15, 2025",
  due_date: "Jan 22, 2025",
  client_name: "Test Client Company",
  client_address: "123 Test Street",
  client_city: "Test City",
  client_state_zip: "TC 12345",
  client_email: "test@example.com",
  client_phone: "+1 555-123-4567",
  item1: "Test Service",
  price1: "$100.00",
  item2: "Another Service",
  price2: "$50.00",
  subtotal: "$150.00",
  tax_rate: "10%",
  taxes: "$15.00",
  total_due: "$165.00"
};

async function testWebhook() {
  console.log('🚀 Testing Make.com Webhook...\n');
  console.log('📤 Sending payload:');
  console.log(JSON.stringify(samplePayload, null, 2));
  console.log('\n⏳ Waiting for response...\n');

  try {
    const startTime = Date.now();
    
    const response = await axios.post(WEBHOOK_URL, samplePayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    const responseTime = Date.now() - startTime;

    console.log('✅ Webhook Response Received!');
    console.log(`📊 Status Code: ${response.status}`);
    console.log(`⏱️  Response Time: ${responseTime}ms`);
    console.log('\n📥 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

    // Validate response
    if (response.data?.pdf_url) {
      console.log('\n🎉 SUCCESS: PDF URL found in response!');
      console.log(`🔗 PDF URL: ${response.data.pdf_url}`);
      
      // Test if PDF URL is accessible
      try {
        const pdfResponse = await axios.head(response.data.pdf_url, { timeout: 5000 });
        console.log(`📄 PDF is accessible (Status: ${pdfResponse.status})`);
      } catch (pdfError) {
        console.log(`⚠️  Warning: PDF URL may not be accessible: ${pdfError.message}`);
      }
    } else {
      console.log('\n❌ ERROR: No pdf_url found in response!');
      console.log('🔧 Make sure your Make.com scenario returns: { "status": "success", "pdf_url": "https://..." }');
    }

  } catch (error) {
    console.log('\n❌ Webhook Test Failed!');
    
    if (error.code === 'ECONNABORTED') {
      console.log('⏰ Error: Request timed out (15 seconds)');
      console.log('🔧 Your Make.com scenario is taking too long. Try optimizing it.');
    } else if (error.response) {
      console.log(`📊 Status Code: ${error.response.status}`);
      console.log('📥 Error Response:');
      console.log(JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(`💥 Error: ${error.message}`);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if your Make.com scenario is active');
    console.log('2. Verify the webhook URL is correct');
    console.log('3. Ensure your scenario returns the correct JSON format');
    console.log('4. Check Make.com scenario execution logs');
  }
}

// Run the test
testWebhook().catch(console.error);
