import type { InvoiceData } from "@/components/invoice-form"

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateInvoiceData(data: InvoiceData): ValidationResult {
  const errors: string[] = []

  // Required fields validation
  if (!data.client_name.trim() && !data.client_email.trim()) {
    errors.push("Either client name or email is required")
  }

  // Email validation
  if (data.client_email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.client_email)) {
      errors.push("Please enter a valid email address")
    }
  }

  // Phone validation (if provided)
  if (data.client_phone.trim()) {
    const phoneRegex = /^[+]?[\d\s$$$$-]{7,}$/
    if (!phoneRegex.test(data.client_phone.replace(/\s/g, ""))) {
      errors.push("Please enter a valid phone number")
    }
  }

  // Line items validation
  if (data.line_items.length === 0) {
    errors.push("At least one service/line item is required")
  }

  // Validate each line item
  data.line_items.forEach((item, index) => {
    if (!item.description.trim()) {
      errors.push(`Line item ${index + 1}: Description is required`)
    }
    if (item.unit_price <= 0) {
      errors.push(`Line item ${index + 1}: Price must be greater than 0`)
    }
    if (item.quantity <= 0) {
      errors.push(`Line item ${index + 1}: Quantity must be greater than 0`)
    }
  })

  // Tax rate validation
  if (data.tax_rate < 0 || data.tax_rate > 100) {
    errors.push("Tax rate must be between 0 and 100")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[+]?[\d\s$$$$-]{7,}$/
  return phoneRegex.test(phone.replace(/\s/g, ""))
}

export function validatePrice(price: string | number): boolean {
  const numPrice = typeof price === "string" ? Number.parseFloat(price) : price
  return !Number.isNaN(numPrice) && numPrice > 0 && numPrice < 1000000
}
