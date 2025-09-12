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

    // 🔹 Check for PDF URL in response
    const pdfUrl = response.data?.pdf_url || response.data?.pdfUrl || response.data?.download_url;
    
    if (!pdfUrl) {
      console.error("[INVOICE-ACTIONS] No PDF URL in response:", response.data);
      return {
        status: "error",
        message: "Make.com webhook did not return a PDF URL. Ensure your scenario returns: { status: 'success', pdf_url: 'https://...' }",
      };
    }

    // 🔹 Validate PDF URL format
    try {
      new URL(pdfUrl);
    } catch {
      return {
        status: "error",
        message: "Invalid PDF URL format returned by Make.com webhook.",
      };
    }

    console.log("[INVOICE-ACTIONS] ✅ Success! PDF URL received:", pdfUrl);

    return { 
      status: "success", 
      pdf_url: pdfUrl,
      message: response.data?.message || "Invoice generated successfully"
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
