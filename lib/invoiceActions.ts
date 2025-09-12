import axios from "axios";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

interface InvoiceData {
  client: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    cityState?: string;
  };
  line_items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  tax_rate: number; // %
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 999)).padStart(3, "0");
  return `INV-${year}-${month}-${day}-${random}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export async function submitInvoiceToWebhook(invoiceData: InvoiceData) {
  try {
    // 🔹 Generate invoice metadata
    const now = new Date();
    const invoiceNumber = generateInvoiceNumber();
    const invoiceDate = formatDate(now);

    // Due date = +7 days
    const due = new Date();
    due.setDate(due.getDate() + 7);
    const dueDate = formatDate(due);

    // 🔹 Map line_items to item1/price1 … itemN/priceN
    const itemsPayload = invoiceData.line_items.reduce(
      (acc, item, index) => {
        const keyItem = `item${index + 1}`;
        const keyPrice = `price${index + 1}`;
        acc[keyItem] = item.description;
        acc[keyPrice] = formatCurrency(item.unit_price * item.quantity);
        return acc;
      },
      {} as Record<string, string>
    );

    // 🔹 Build final payload
    const payload = {
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      due_date: dueDate,
      client_name: invoiceData.client.name,
      client_address: invoiceData.client.address || "",
      client_city: invoiceData.client.cityState?.split(" ")[0] || "",
      client_state_zip: invoiceData.client.cityState || "",
      client_email: invoiceData.client.email,
      client_phone: invoiceData.client.phone || "",
      ...itemsPayload,
      subtotal: formatCurrency(invoiceData.subtotal),
      tax_rate: `${invoiceData.tax_rate}%`,
      taxes: formatCurrency(invoiceData.tax),
      total_due: formatCurrency(invoiceData.total),
    };

    console.log("[INVOICE-ACTIONS] Sending invoice to Make.com webhook...");
    console.log("[INVOICE-ACTIONS] Payload:", JSON.stringify(payload, null, 2));

    // 🔹 Send to Make.com webhook
    const response = await axios.post(
      "https://hook.eu2.make.com/84agsujsolsdlfazqvco8mo06ctypst9",
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
      }
    );

    console.log("[INVOICE-ACTIONS] Webhook response status:", response.status);
    console.log("[INVOICE-ACTIONS] Webhook response data:", JSON.stringify(response.data, null, 2));

    // 🔹 Validate response
    if (response.status !== 200) {
      return {
        status: "error",
        message: `Webhook returned status ${response.status}. Check your Make.com scenario.`,
      };
    }

    // 🔹 Handle different response types
    let responseData = response.data;
    
    // If response is a string (like "Accepted"), treat it as accepted status
    if (typeof responseData === 'string') {
      console.log("[INVOICE-ACTIONS] Received string response, treating as accepted:", responseData);
      return {
        status: "accepted",
        message: `Invoice accepted for processing: ${responseData}`,
      };
    }
    
    // If response is an object, check for PDF URL or status
    if (typeof responseData === 'object' && responseData !== null) {
      const pdfUrl = responseData.pdf_url || responseData.pdfUrl || responseData.download_url;
      
      if (pdfUrl) {
        // Direct PDF URL returned
        console.log("[INVOICE-ACTIONS] ✅ Direct PDF URL received:", pdfUrl);
        return {
          status: "success",
          pdf_url: pdfUrl,
          message: responseData.message || "Invoice generated successfully"
        };
      }
      
      // Check if it's an accepted status
      if (responseData.status === 'accepted' || responseData.status === 'processing') {
        console.log("[INVOICE-ACTIONS] Invoice accepted for processing");
        return {
          status: "accepted",
          message: responseData.message || "Invoice accepted for processing",
        };
      }
    }
    
    // If we get here, the response format is unexpected
    console.error("[INVOICE-ACTIONS] Unexpected response format:", responseData);
    return {
      status: "error",
      message: `Unexpected response format from Make.com: ${JSON.stringify(responseData)}. Expected JSON object with pdf_url or status field.`,
    };


  } catch (error: any) {
    console.error("[INVOICE-ACTIONS] Webhook submission failed:", error);
    
    // 🔹 Enhanced error handling
    if (error.code === 'ECONNABORTED') {
      return {
        status: "error",
        message: "Make.com webhook timed out (15s). Your scenario may be taking too long. Try optimizing it.",
      };
    }
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 404) {
        return {
          status: "error",
          message: "Make.com webhook URL not found. Please check your webhook URL configuration.",
        };
      }
      
      if (status >= 500) {
        return {
          status: "error",
          message: "Make.com webhook server error. Please try again later or check your scenario.",
        };
      }
      
      return {
        status: "error",
        message: `Make.com webhook error (${status}): ${data?.message || data || "Unknown error"}`,
      };
    }
    
    return {
      status: "error",
      message: error.message || "Failed to generate invoice. Please try again.",
    };
  }
}
