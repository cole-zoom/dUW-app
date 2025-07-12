"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PortfolioCard } from "@/components/portfolio/PortfolioCard"
import { AddPortfolioDialog } from "@/components/portfolio/AddPortfolioDialog"
import { ThemeToggle } from "@/components/Theme/theme-toggle"
import { Plus } from "lucide-react"
import { usePortfolioManager } from "@/hooks/usePortfolioManager"

// Portfolio page component for managing portfolios and stocks
export default function PortfolioPage() {
  const [isAddPortfolioDialogOpen, setIsAddPortfolioDialogOpen] = useState(false)
  const {
    portfolios,
    copiedStock,
    addPortfolio,
    deletePortfolio,
    addStock,
    deleteStock,
    moveStock,
    pasteStock,
    canPasteInPortfolio,
  } = usePortfolioManager()

  return (
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Portfolio Creation</h1>
              <div className="text-sm text-muted-foreground">Create and manage your investment portfolios</div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button onClick={() => setIsAddPortfolioDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Portfolio
              </Button>
            </div>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-4">
            {portfolios.map((portfolio) => (
              <PortfolioCard
                key={portfolio.id}
                id={portfolio.id}
                title={portfolio.title}
                stocks={portfolio.stocks}
                onAddStock={addStock}
                onDeleteStock={deleteStock}
                onDeletePortfolio={deletePortfolio}
                onPasteStock={pasteStock}
                onMoveStock={moveStock}
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
        </main>
  )
} 