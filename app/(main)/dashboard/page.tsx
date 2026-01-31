"use client"

import React, { useState, useEffect } from "react"
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout"
import { PixelText } from "@/components/8bit/PixelLetter"
import { ThemeToggle } from "@/components/Theme/theme-toggle"
import { usePortfolioManager } from "@/hooks/usePortfolioManager"
import { useStockData } from "@/hooks/useStockData"
import { StockPriceChart } from "@/components/dashboard/StockPriceChart"
import { StockDetailsCard } from "@/components/dashboard/StockDetailsCard"
import type { TimePeriod } from "@/lib/types"

const TIME_PERIODS: TimePeriod[] = ['1D', '1W', '1M', '6M', '1Y']

export default function DashboardPage() {
  const { portfolios, loading: portfoliosLoading } = usePortfolioManager()
  const {
    aggregates,
    tickerDetails,
    previousClose,
    loading: stockDataLoading,
    error: stockDataError,
    fetchAllStockData,
    refreshAggregates,
    clearData,
    clearError,
  } = useStockData()

  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null)
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M')

  // Auto-select first portfolio on load
  useEffect(() => {
    if (portfolios.length > 0 && !selectedPortfolioId) {
      setSelectedPortfolioId(portfolios[0].id)
    }
  }, [portfolios, selectedPortfolioId])

  // Clear stock selection when portfolio changes
  useEffect(() => {
    setSelectedTicker(null)
    clearData()
  }, [selectedPortfolioId, clearData])

  // Fetch stock data when ticker is selected
  useEffect(() => {
    if (selectedTicker) {
      fetchAllStockData(selectedTicker, selectedPeriod)
    }
  }, [selectedTicker, fetchAllStockData, selectedPeriod])

  // Handle time period change
  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period)
    if (selectedTicker) {
      refreshAggregates(selectedTicker, period)
    }
  }

  // Get stocks from selected portfolio
  const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId)
  const stocks = selectedPortfolio?.stocks || []

  return (
    <AuthenticatedLayout>
      <main className="relative p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-2">
            <PixelText text="DASHBOARD" size={28} />
            <p className="font-mono text-sm text-muted-foreground">
              View detailed stock data and charts
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Controls Row */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {/* Portfolio Selector */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              Portfolio
            </label>
            <select
              value={selectedPortfolioId || ''}
              onChange={(e) => setSelectedPortfolioId(e.target.value || null)}
              className="pixel-select font-mono text-sm bg-card border-2 border-muted px-3 py-2 min-w-[180px]"
              disabled={portfoliosLoading}
            >
              {portfolios.length === 0 ? (
                <option value="">No portfolios</option>
              ) : (
                portfolios.map((portfolio) => (
                  <option key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Stock Selector */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              Stock
            </label>
            <select
              value={selectedTicker || ''}
              onChange={(e) => setSelectedTicker(e.target.value || null)}
              className="pixel-select font-mono text-sm bg-card border-2 border-muted px-3 py-2 min-w-[180px]"
              disabled={!selectedPortfolioId || stocks.length === 0}
            >
              <option value="">Select a stock</option>
              {stocks.map((stock) => (
                <option key={stock.id} value={stock.ticker}>
                  {stock.ticker} ({stock.shares} shares)
                </option>
              ))}
            </select>
          </div>

          {/* Time Period Buttons */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              Period
            </label>
            <div className="flex gap-1">
              {TIME_PERIODS.map((period) => (
                <button
                  key={period}
                  onClick={() => handlePeriodChange(period)}
                  disabled={!selectedTicker}
                  className={`
                    font-mono text-xs px-3 py-2 border-2 transition-colors
                    ${selectedPeriod === period
                      ? 'bg-[#5A7A60] border-[#5A7A60] text-white'
                      : 'bg-card border-muted hover:border-[#5A7A60] disabled:opacity-50 disabled:hover:border-muted'
                    }
                  `}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {stockDataError && (
          <div className="mb-4 p-4 bg-[#A05050]/20 border-2 border-[#A05050] relative">
            <div className="absolute top-0 left-0 w-2 h-2 bg-[#A05050]" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-[#A05050]" />
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-[#A05050]" />
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#A05050]" />
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm text-[#A05050]">
                ERROR: {stockDataError}
              </p>
              <button
                onClick={clearError}
                className="font-mono text-xs text-[#A05050] hover:underline"
              >
                DISMISS
              </button>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        {selectedTicker ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart - 2 columns */}
            <div className="lg:col-span-2">
              <StockPriceChart
                data={aggregates}
                loading={stockDataLoading}
                ticker={selectedTicker}
              />
            </div>

            {/* Details Card - 1 column */}
            <div className="lg:col-span-1">
              <StockDetailsCard
                details={tickerDetails}
                previousClose={previousClose}
                loading={stockDataLoading}
              />
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 pixel-grid-overlay opacity-10" />
            <div className="relative z-10">
              <div className="font-mono text-lg text-muted-foreground mb-2">
                {portfoliosLoading ? (
                  <span className="animate-pulse">LOADING PORTFOLIOS...</span>
                ) : stocks.length === 0 && selectedPortfolioId ? (
                  <>
                    <span className="block mb-4">NO STOCKS IN PORTFOLIO</span>
                    <span className="text-sm">Add stocks to your portfolio to view data</span>
                  </>
                ) : (
                  <>
                    <span className="block mb-4">SELECT A STOCK</span>
                    <span className="text-sm">Choose a portfolio and stock to view detailed data</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {stockDataLoading && selectedTicker && (
          <div className="fixed inset-0 bg-background/50 z-50 flex items-center justify-center">
            <div className="font-mono text-lg animate-pulse">
              LOADING DATA...
            </div>
          </div>
        )}
      </main>
    </AuthenticatedLayout>
  )
}
