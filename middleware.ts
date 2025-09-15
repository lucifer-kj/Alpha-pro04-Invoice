import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimit, getClientIP } from './lib/rate-limit'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const startTime = Date.now()

  // Enhanced security headers for all responses
  const response = NextResponse.next()
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Apply enhanced security to webhook endpoints
  if (pathname.startsWith('/api/webhooks/')) {
    const clientIP = getClientIP(request)
    
    // Enhanced logging for webhook requests
    console.log(`[Middleware] Webhook request: ${request.method} ${pathname} from ${clientIP}`)
    
    // Check rate limiting
    const rateLimitResult = checkRateLimit(clientIP)

    // Add comprehensive rate limit headers
    response.headers.set('X-RateLimit-Limit', '50')
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())
    response.headers.set('X-RateLimit-Window', '60')

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      console.warn(`[Middleware] Rate limit exceeded for ${clientIP}`)
      
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter,
          limit: 50,
          window: '60 seconds'
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': '50',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
          }
        }
      )
    }

    // Enhanced validation for POST requests
    if (request.method === 'POST') {
      const contentType = request.headers.get('content-type')
      const contentLength = request.headers.get('content-length')
      
      // Validate content type
      if (!contentType || !contentType.includes('application/json')) {
        console.warn(`[Middleware] Invalid content type: ${contentType} from ${clientIP}`)
        return NextResponse.json(
          { 
            error: 'Invalid content type',
            message: 'Expected application/json',
            received: contentType || 'none'
          },
          { status: 415 }
        )
      }

      // Check content length (prevent extremely large payloads)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (contentLength && parseInt(contentLength) > maxSize) {
        console.warn(`[Middleware] Payload too large: ${contentLength} bytes from ${clientIP}`)
        return NextResponse.json(
          { 
            error: 'Payload too large',
            message: `Maximum allowed size is ${maxSize} bytes`,
            received: contentLength
          },
          { status: 413 }
        )
      }

      // Validate authorization header presence for Make.com webhooks
      if (pathname.includes('/make')) {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          console.warn(`[Middleware] Missing or invalid authorization header from ${clientIP}`)
          return NextResponse.json(
            { 
              error: 'Unauthorized',
              message: 'Bearer token required for webhook endpoints'
            },
            { status: 401 }
          )
        }
      }
    }

    // Only allow POST and GET methods for webhooks
    if (!['POST', 'GET'].includes(request.method)) {
      console.warn(`[Middleware] Method not allowed: ${request.method} from ${clientIP}`)
      return NextResponse.json(
        { 
          error: 'Method not allowed',
          message: 'Only POST and GET methods are supported',
          allowed: ['POST', 'GET']
        },
        { 
          status: 405,
          headers: {
            'Allow': 'POST, GET'
          }
        }
      )
    }

    // Add processing time header
    const processingTime = Date.now() - startTime
    response.headers.set('X-Processing-Time', processingTime.toString())
    
    return response
  }

  // Apply rate limiting to other API endpoints
  if (pathname.startsWith('/api/')) {
    const clientIP = getClientIP(request)
    const rateLimitResult = checkRateLimit(clientIP, require('./lib/rate-limit').apiRateLimiter)

    response.headers.set('X-RateLimit-Limit', '100')
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      console.warn(`[Middleware] API rate limit exceeded for ${clientIP}`)
      
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Too many API requests. Please try again later.',
          retryAfter,
          limit: 100,
          window: '60 seconds'
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString()
          }
        }
      )
    }

    return response
  }

  return response
}

export const config = {
  matcher: [
    '/api/webhooks/:path*',
    '/api/:path*'
  ],
}
