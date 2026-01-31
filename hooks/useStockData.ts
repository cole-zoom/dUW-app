"use client"

import { useState, useCallback, useRef } from "react"
import type {
  AggregatesResponse,
  TickerDetails,
  PreviousCloseResponse,
  TimePeriod
} from "@/lib/types"
import { useStackAuth } from "./useStackAuth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

/**
 * Calculate date range and timespan based on selected period
 */
function getDateRange(period: TimePeriod): {
  from: string
  to: string
  timespan: string
  multiplier: string
} {
  const to = new Date()
  const from = new Date()

  let timespan = 'day'
  let multiplier = '1'

  switch (period) {
    case '1D':
      from.setDate(from.getDate() - 1)
      timespan = 'hour'
      multiplier = '1'
      break
    case '1W':
      from.setDate(from.getDate() - 7)
      timespan = 'hour'
      multiplier = '4'
      break
    case '1M':
      from.setMonth(from.getMonth() - 1)
      timespan = 'day'
      multiplier = '1'
      break
    case '6M':
      from.setMonth(from.getMonth() - 6)
      timespan = 'day'
      multiplier = '1'
      break
    case '1Y':
      from.setFullYear(from.getFullYear() - 1)
      timespan = 'week'
      multiplier = '1'
      break
  }

  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
    timespan,
    multiplier,
  }
}

/**
 * Hook for fetching stock data from Polygon.io API
 * Implements sequential fetching to respect rate limits (5 calls/min)
 */
export function useStockData() {
  const [aggregates, setAggregates] = useState<AggregatesResponse | null>(null)
  const [tickerDetails, setTickerDetails] = useState<TickerDetails | null>(null)
  const [previousClose, setPreviousClose] = useState<PreviousCloseResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { authenticatedFetch } = useStackAuth()

  // Cache ticker details to avoid refetching (they rarely change)
  const detailsCache = useRef<Map<string, TickerDetails>>(new Map())

  /**
   * Fetch aggregates (historical OHLC data)
   */
  const fetchAggregates = useCallback(async (
    ticker: string,
    period: TimePeriod = '1M'
  ): Promise<AggregatesResponse | null> => {
    try {
      const { from, to, timespan, multiplier } = getDateRange(period)
      const url = `${API_BASE_URL}/api/stocks/${ticker}/aggregates?timespan=${timespan}&multiplier=${multiplier}&from=${from}&to=${to}`

      const response = await authenticatedFetch(url)

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `HTTP ${response.status}`)
      }

      const data: AggregatesResponse = await response.json()
      setAggregates(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch aggregates'
      throw new Error(message)
    }
  }, [authenticatedFetch])

  /**
   * Fetch ticker details
   */
  const fetchTickerDetails = useCallback(async (
    ticker: string
  ): Promise<TickerDetails | null> => {
    // Check cache first
    const cached = detailsCache.current.get(ticker)
    if (cached) {
      setTickerDetails(cached)
      return cached
    }

    try {
      const url = `${API_BASE_URL}/api/stocks/${ticker}/details`
      const response = await authenticatedFetch(url)

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `HTTP ${response.status}`)
      }

      const data: TickerDetails = await response.json()
      setTickerDetails(data)
      detailsCache.current.set(ticker, data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch ticker details'
      throw new Error(message)
    }
  }, [authenticatedFetch])

  /**
   * Fetch previous close data
   */
  const fetchPreviousClose = useCallback(async (
    ticker: string
  ): Promise<PreviousCloseResponse | null> => {
    try {
      const url = `${API_BASE_URL}/api/stocks/${ticker}/previous`
      const response = await authenticatedFetch(url)

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `HTTP ${response.status}`)
      }

      const data: PreviousCloseResponse = await response.json()
      setPreviousClose(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch previous close'
      throw new Error(message)
    }
  }, [authenticatedFetch])

  /**
   * Fetch all stock data sequentially to respect rate limits
   * Order: details → previous → aggregates
   */
  const fetchAllStockData = useCallback(async (
    ticker: string,
    period: TimePeriod = '1M'
  ): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      // Fetch sequentially to respect Polygon.io rate limits (5/min)
      await fetchTickerDetails(ticker)
      await fetchPreviousClose(ticker)
      await fetchAggregates(ticker, period)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch stock data'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [fetchTickerDetails, fetchPreviousClose, fetchAggregates])

  /**
   * Refresh only aggregates (used when changing time period)
   */
  const refreshAggregates = useCallback(async (
    ticker: string,
    period: TimePeriod
  ): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      await fetchAggregates(ticker, period)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh aggregates'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [fetchAggregates])

  /**
   * Clear all data
   */
  const clearData = useCallback(() => {
    setAggregates(null)
    setTickerDetails(null)
    setPreviousClose(null)
    setError(null)
  }, [])

  return {
    // Data
    aggregates,
    tickerDetails,
    previousClose,
    loading,
    error,

    // Methods
    fetchAggregates,
    fetchTickerDetails,
    fetchPreviousClose,
    fetchAllStockData,
    refreshAggregates,
    clearData,
    clearError: () => setError(null),
  }
}
