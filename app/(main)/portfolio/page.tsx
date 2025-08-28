"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PortfolioCard } from "@/components/portfolio/PortfolioCard"
import { AddPortfolioDialog } from "@/components/portfolio/AddPortfolioDialog"
import { ThemeToggle } from "@/components/Theme/theme-toggle"
import { Plus } from "lucide-react"
import { usePortfolioManager } from "@/hooks/usePortfolioManager"
import { useStockManager } from "@/hooks/useStockManager"
import type { Stock } from "@/lib/types"
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout"

// Portfolio page component for managing portfolios and stocks
export default function PortfolioPage() {
  const [isAddPortfolioDialogOpen, setIsAddPortfolioDialogOpen] = useState(false)
  
  const {
    portfolios,
    loading: portfolioLoading,
    error: portfolioError,
    copiedStock,
    addPortfolio,
    deletePortfolio,
    canPasteInPortfolio,
    refreshPortfolio,
  } = usePortfolioManager()

  const {
    loading: stockLoading,
    error: stockError,
    addStockToPortfolio,
    deleteStock,
    updateStock,
    moveStock,
  } = useStockManager()

  const isLoading = portfolioLoading || stockLoading

  const handleAddStock = async (portfolioId: string, stockData: { ticker: string; shares: number }) => {
    try {
      await addStockToPortfolio(portfolioId, stockData)
      await refreshPortfolio(portfolioId)
    } catch (error) {
      console.error('Failed to add stock:', error)
    }
  }

  const handleDeleteStock = async (portfolioId: string, stockId: string) => {
    try {
      await deleteStock(portfolioId, stockId)
      await refreshPortfolio(portfolioId)
    } catch (error) {
      console.error('Failed to delete stock:', error)
    }
  }

  const handleUpdateStock = async (portfolioId: string, stockId: string, data: { shares: number }) => {
    try {
      await updateStock(portfolioId, stockId, data)
      await refreshPortfolio(portfolioId)
    } catch (error) {
      console.error('Failed to update stock:', error)
    }
  }

  const handleMoveStock = async (fromPortfolioId: string, toPortfolioId: string, stock: Stock) => {
    try {
      await moveStock(fromPortfolioId, toPortfolioId, stock)
      await refreshPortfolio(fromPortfolioId)
      await refreshPortfolio(toPortfolioId)
    } catch (error) {
      console.error('Failed to move stock:', error)
    }
  }

  const handlePasteStock = async (portfolioId: string) => {
    if (!copiedStock) return
    
    try {
      await addStockToPortfolio(portfolioId, {
        ticker: copiedStock.stock.ticker,
        shares: copiedStock.stock.shares,
      })
      await refreshPortfolio(portfolioId)
    } catch (error) {
      console.error('Failed to paste stock:', error)
    }
  }

  return (
    <AuthenticatedLayout>
      <main className="relative p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Portfolio Creation</h1>
            <div className="text-sm">Create and manage your investment portfolios</div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={() => setIsAddPortfolioDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Portfolio
            </Button>
          </div>
        </div>

        {(portfolioError || stockError) && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">
              {portfolioError || stockError}
            </p>
          </div>
        )}

        <div className="flex gap-6 overflow-x-auto pb-4">
          {portfolios.map((portfolio) => (
            <PortfolioCard
              key={portfolio.id}
              id={portfolio.id}
              name={portfolio.name}
              stocks={portfolio.stocks}
              onAddStock={handleAddStock}
              onDeleteStock={handleDeleteStock}
              onUpdateStock={handleUpdateStock}
              onDeletePortfolio={deletePortfolio}
              onPasteStock={handlePasteStock}
              onMoveStock={handleMoveStock}
              copiedStock={copiedStock?.stock || null}
              canPaste={canPasteInPortfolio(portfolio.id)}
            />
          ))}
        </div>

        <AddPortfolioDialog
          open={isAddPortfolioDialogOpen}
          onOpenChange={setIsAddPortfolioDialogOpen}
          onAddPortfolio={addPortfolio}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-gray-900/10 z-50"></div>
        )}
      </main>
    </AuthenticatedLayout>
  )
} 