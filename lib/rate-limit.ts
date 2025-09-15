// Simple in-memory rate limiter for webhook endpoints
// In production, consider using Redis or a more robust solution

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private cache = new Map<string, RateLimitEntry>()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const entry = this.cache.get(identifier)

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      this.cache.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      })
      return true
    }

    if (entry.count >= this.maxRequests) {
      return false
    }

    entry.count++
    return true
  }

  getRemainingRequests(identifier: string): number {
    const entry = this.cache.get(identifier)
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests
    }
    return Math.max(0, this.maxRequests - entry.count)
  }

  getResetTime(identifier: string): number {
    const entry = this.cache.get(identifier)
    if (!entry || Date.now() > entry.resetTime) {
      return Date.now() + this.windowMs
    }
    return entry.resetTime
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.resetTime) {
        this.cache.delete(key)
      }
    }
  }
}

// Create rate limiter instances for different endpoints
export const webhookRateLimiter = new RateLimiter(50, 60000) // 50 requests per minute
export const apiRateLimiter = new RateLimiter(100, 60000) // 100 requests per minute

// Cleanup expired entries every 5 minutes
setInterval(() => {
  webhookRateLimiter.cleanup()
  apiRateLimiter.cleanup()
}, 5 * 60 * 1000)

export function checkRateLimit(
  identifier: string,
  limiter: RateLimiter = webhookRateLimiter
): {
  allowed: boolean
  remaining: number
  resetTime: number
} {
  const allowed = limiter.isAllowed(identifier)
  const remaining = limiter.getRemainingRequests(identifier)
  const resetTime = limiter.getResetTime(identifier)

  return {
    allowed,
    remaining,
    resetTime,
  }
}

// Helper function to get client IP from request
export function getClientIP(request: Request): string {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback to a default identifier
  return 'unknown'
}
