"use client"

import { useState, useEffect, useCallback } from "react"

export interface InvoiceStatus {
  invoice_number: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  pdf_url?: string
  error_message?: string
  created_at: string
  updated_at: string
}

interface UseInvoiceStatusOptions {
  pollInterval?: number // milliseconds
  maxPollAttempts?: number
  enabled?: boolean
}

export function useInvoiceStatus(
  invoiceNumber: string | null,
  options: UseInvoiceStatusOptions = {}
) {
  const {
    pollInterval = 2000, // 2 seconds
    maxPollAttempts = 15, // 30 seconds total (15 × 2s = 30s)
    enabled = true
  } = options

  const [status, setStatus] = useState<InvoiceStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pollAttempts, setPollAttempts] = useState(0)

  const fetchStatus = useCallback(async () => {
    if (!invoiceNumber || !enabled) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/invoice-status/${invoiceNumber}`)
      
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
        
        // Stop polling if invoice is completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          setPollAttempts(maxPollAttempts) // Stop polling
        }
      } else if (response.status === 404) {
        // Invoice not found - might still be generating
        setStatus(null)
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch invoice status"
      setError(errorMessage)
      console.error("[useInvoiceStatus] Error:", errorMessage)
    } finally {
      setLoading(false)
    }
  }, [invoiceNumber, enabled])

  // Polling effect
  useEffect(() => {
    if (!invoiceNumber || !enabled || pollAttempts >= maxPollAttempts) {
      return
    }

    // Initial fetch
    fetchStatus()

    // Set up polling interval
    const interval = setInterval(() => {
      setPollAttempts(prev => {
        if (prev >= maxPollAttempts) {
          clearInterval(interval)
          return prev
        }
        fetchStatus()
        return prev + 1
      })
    }, pollInterval)

    return () => clearInterval(interval)
  }, [invoiceNumber, enabled, pollInterval, maxPollAttempts, fetchStatus])

  // Reset when invoice number changes
  useEffect(() => {
    setStatus(null)
    setError(null)
    setPollAttempts(0)
  }, [invoiceNumber])

  const refetch = useCallback(() => {
    setPollAttempts(0)
    fetchStatus()
  }, [fetchStatus])

  const isCompleted = status?.status === 'completed'
  const isFailed = status?.status === 'failed'
  const isGenerating = status?.status === 'generating'
  const isPending = status?.status === 'pending'

  return {
    status,
    loading,
    error,
    pollAttempts,
    maxPollAttempts,
    isCompleted,
    isFailed,
    isGenerating,
    isPending,
    refetch,
    // Helper to check if polling is still active
    isPolling: enabled && pollAttempts < maxPollAttempts && !isCompleted && !isFailed,
    // Timeout helpers
    isTimedOut: enabled && pollAttempts >= maxPollAttempts && !isCompleted && !isFailed,
    timeRemaining: Math.max(0, (maxPollAttempts - pollAttempts) * pollInterval)
  }
}
