import type { LineItem } from "@/components/invoice-form"

interface ParsedService {
  description: string
  quantity: number
  price: number
}

export function parseServicesText(text: string): LineItem[] {
  if (!text.trim()) return []

  // Clean and normalize the input text
  const cleanText = text.toLowerCase().replace(/\s+/g, " ").trim()

  // Split by common separators
  const segments = splitIntoSegments(cleanText)

  const parsedServices: ParsedService[] = []

  for (const segment of segments) {
    const service = parseServiceSegment(segment)
    if (service) {
      parsedServices.push(service)
    }
  }

  // Convert to LineItem format
  return parsedServices.map((service) => ({
    description: capitalizeDescription(service.description),
    quantity: service.quantity,
    unit_price: service.price,
    total: service.quantity * service.price,
  }))
}

function splitIntoSegments(text: string): string[] {
  // Split by common separators: "and", ",", ";", "plus", "also"
  const separators = /\s+(?:and|,|;|\+|plus|also)\s+/gi
  return text
    .split(separators)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function parseServiceSegment(segment: string): ParsedService | null {
  // Remove common prefixes and clean up
  const cleanSegment = segment.replace(/^(?:i need|we need|looking for|want|require)\s+/i, "").trim()

  // Extract price using various patterns
  const priceMatch = extractPrice(cleanSegment)
  if (!priceMatch) return null

  const { price, priceText } = priceMatch

  // Remove price from description to get service description
  let description = cleanSegment.replace(priceText, "").replace(/\s+/g, " ").trim()

  // Extract quantity
  const quantityMatch = extractQuantity(description)
  let quantity = 1

  if (quantityMatch) {
    quantity = quantityMatch.quantity
    description = description.replace(quantityMatch.quantityText, "").trim()
  }

  // Clean up description
  description = cleanDescription(description)

  if (!description) return null

  return {
    description,
    quantity,
    price,
  }
}

function extractPrice(text: string): { price: number; priceText: string } | null {
  // Price patterns to match
  const pricePatterns = [
    // $1,299 or $1299
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
    // 1,299 dollars or 1299 dollars
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?|usd|\$)/gi,
    // at $1299, for $1299, costs $1299
    /(?:at|for|costs?|price[ds]?\s+at|worth)\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
    // 1299 (standalone numbers that could be prices)
    /(?:^|\s)(\d{2,4})(?:\s|$)/g,
  ]

  for (const pattern of pricePatterns) {
    const matches = Array.from(text.matchAll(pattern))
    for (const match of matches) {
      const priceStr = match[1].replace(/,/g, "")
      const price = Number.parseFloat(priceStr)

      if (price > 0 && price < 1000000) {
        // Reasonable price range
        return {
          price,
          priceText: match[0],
        }
      }
    }
  }

  return null
}

function extractQuantity(text: string): { quantity: number; quantityText: string } | null {
  // Quantity patterns
  const quantityPatterns = [
    // 3x, 5x
    /(\d+)\s*x\s*/gi,
    // 3 times, 5 times
    /(\d+)\s*times?\s*/gi,
    // quantity 3, qty 5
    /(?:quantity|qty)\s*:?\s*(\d+)/gi,
    // 3 of, 5 of
    /(\d+)\s+of\s+/gi,
  ]

  for (const pattern of quantityPatterns) {
    const match = text.match(pattern)
    if (match) {
      const quantity = Number.parseInt(match[1])
      if (quantity > 0 && quantity <= 100) {
        // Reasonable quantity range
        return {
          quantity,
          quantityText: match[0],
        }
      }
    }
  }

  return null
}

function cleanDescription(description: string): string {
  // Remove common connecting words and prepositions
  description = description
    .replace(/^(?:for|at|of|the|a|an)\s+/gi, "")
    .replace(/\s+(?:for|at|of|costing|worth|priced)\s*$/gi, "")
    .trim()

  // Remove extra whitespace and normalize
  description = description.replace(/\s+/g, " ").trim()

  // If description is too short or just numbers, return null
  if (description.length < 2 || /^\d+$/.test(description)) {
    return ""
  }

  return description
}

function capitalizeDescription(description: string): string {
  return description
    .split(" ")
    .map((word) => {
      // Don't capitalize common short words unless they're the first word
      const lowercaseWords = ["and", "or", "of", "in", "on", "at", "to", "for", "with", "by"]
      if (lowercaseWords.includes(word.toLowerCase()) && description.indexOf(word) !== 0) {
        return word.toLowerCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(" ")
}

// Example usage and test cases
export function getParsingExamples(): Array<{ input: string; expected: LineItem[] }> {
  return [
    {
      input: "website development for $1,299 and SEO optimization at $499",
      expected: [
        {
          description: "Website Development",
          quantity: 1,
          unit_price: 1299,
          total: 1299,
        },
        {
          description: "SEO Optimization",
          quantity: 1,
          unit_price: 499,
          total: 499,
        },
      ],
    },
    {
      input: "3x logo design at $50 each and social media management for $299",
      expected: [
        {
          description: "Logo Design",
          quantity: 3,
          unit_price: 50,
          total: 150,
        },
        {
          description: "Social Media Management",
          quantity: 1,
          unit_price: 299,
          total: 299,
        },
      ],
    },
    {
      input: "ai chatbot development $799, website maintenance 199",
      expected: [
        {
          description: "AI Chatbot Development",
          quantity: 1,
          unit_price: 799,
          total: 799,
        },
        {
          description: "Website Maintenance",
          quantity: 1,
          unit_price: 199,
          total: 199,
        },
      ],
    },
  ]
}
