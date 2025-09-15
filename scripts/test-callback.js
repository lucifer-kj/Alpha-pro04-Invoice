#!/usr/bin/env node

/**
 * Callback System Testing Script
 * 
 * This script tests the invoice callback system
 * Run with: node scripts/test-callback.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const CALLBACK_URL = `${BASE_URL}/api/invoice-callback`;
const TEST_INVOICE_NUMBER = `INV-TEST-${Date.now()}`;

async function testCallbackEndpoint() {
  console.log('🧪 Testing Invoice Callback System...\n');

  // Test 1: Direct callback endpoint test
  console.log('📤 Test 1: Direct callback endpoint test');
  try {
    const callbackPayload = {
      invoice_number: TEST_INVOICE_NUMBER,
      pdf_url: 'https://example.com/test-invoice.pdf',
      status: 'success',
      message: 'Test invoice generated successfully'
    };

    console.log('Sending callback:', JSON.stringify(callbackPayload, null, 2));
    
    const response = await axios.post(CALLBACK_URL, callbackPayload, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Callback successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Callback failed:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Check invoice status
  console.log('📊 Test 2: Check invoice status');
  try {
    const statusResponse = await axios.get(`${BASE_URL}/api/invoice-status/${TEST_INVOICE_NUMBER}`);
    console.log('✅ Status retrieved!');
    console.log('Status:', JSON.stringify(statusResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Status check failed:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Simulate Make.com webhook flow
  console.log('🔄 Test 3: Simulate full Make.com webhook flow');
  
  const webhookPayload = {
    invoice_number: TEST_INVOICE_NUMBER,
    callback_url: CALLBACK_URL,
    invoice_date: 'Jan 15, 2025',
    due_date: 'Jan 22, 2025',
    client_name: 'Test Client Company',
    client_address: '123 Test Street',
    client_city: 'Test City',
    client_state_zip: 'TC 12345',
    client_email: 'test@example.com',
    client_phone: '+1 555-123-4567',
    item1: 'Test Service',
    price1: '$100.00',
    subtotal: '$100.00',
    tax_rate: '10%',
    taxes: '$10.00',
    total_due: '$110.00'
  };

  try {
    console.log('Step 1: Send invoice data to Make.com webhook');
    console.log('Payload:', JSON.stringify(webhookPayload, null, 2));
    
    // Note: This would normally go to Make.com, but for testing we'll simulate
    console.log('✅ Invoice data sent to Make.com (simulated)');
    
    // Simulate Make.com processing delay
    console.log('⏳ Simulating Make.com processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Step 2: Make.com calls our callback with PDF URL');
    const finalCallbackPayload = {
      invoice_number: TEST_INVOICE_NUMBER,
      pdf_url: 'https://example.com/final-invoice.pdf',
      status: 'success',
      message: 'Invoice generated and ready for download'
    };

    const finalResponse = await axios.post(CALLBACK_URL, finalCallbackPayload, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Final callback successful!');
    console.log('Response:', JSON.stringify(finalResponse.data, null, 2));

    // Check final status
    console.log('Step 3: Verify final invoice status');
    const finalStatusResponse = await axios.get(`${BASE_URL}/api/invoice-status/${TEST_INVOICE_NUMBER}`);
    console.log('✅ Final status:', JSON.stringify(finalStatusResponse.data, null, 2));

  } catch (error) {
    console.log('❌ Full flow test failed:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Error handling
  console.log('🚨 Test 4: Error handling');
  
  const errorPayload = {
    invoice_number: TEST_INVOICE_NUMBER,
    status: 'failed',
    error_message: 'PDF generation failed - template not found'
  };

  try {
    console.log('Sending error callback:', JSON.stringify(errorPayload, null, 2));
    
    const errorResponse = await axios.post(CALLBACK_URL, errorPayload, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Error callback processed!');
    console.log('Response:', JSON.stringify(errorResponse.data, null, 2));

    // Check error status
    const errorStatusResponse = await axios.get(`${BASE_URL}/api/invoice-status/${TEST_INVOICE_NUMBER}`);
    console.log('✅ Error status:', JSON.stringify(errorStatusResponse.data, null, 2));

  } catch (error) {
    console.log('❌ Error handling test failed:', error.response?.data || error.message);
  }

  console.log('\n🎉 Callback system testing complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Configure your Make.com scenario with the callback URL');
  console.log('2. Test with real invoice generation');
  console.log('3. Monitor the application logs for debugging');
}

// Run the tests
testCallbackEndpoint().catch(console.error);
