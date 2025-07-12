"use client"

import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import type { Portfolio, Stock } from "@/lib/types"

export function usePortfolioManager() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([
    {
      id: uuidv4(),
      title: "TFSA",
      stocks: [],
    },
  ])
  const [copiedStock, setCopiedStock] = useState<{ stock: Stock; sourcePortfolioId: string } | null>(null)

  useEffect(() => {
    const handleCopyStock = (event: CustomEvent) => {
      setCopiedStock(event.detail)
    }

    window.addEventListener("copyStock", handleCopyStock as EventListener)
    return () => window.removeEventListener("copyStock", handleCopyStock as EventListener)
  }, [])

  const addPortfolio = (name: string) => {
    const newPortfolio: Portfolio = {
      id: uuidv4(),
      title: name,
      stocks: [],
    }
    setPortfolios([...portfolios, newPortfolio])
  }

  const deletePortfolio = (portfolioId: string) => {
    if (portfolios.length > 1) {
      setPortfolios(portfolios.filter((p) => p.id !== portfolioId))
    }
  }

  const addStock = (portfolioId: string, stock: Omit<Stock, "id">) => {
    setPortfolios(
      portfolios.map((portfolio) => {
        if (portfolio.id === portfolioId) {
          const newStock: Stock = {
            ...stock,
            id: uuidv4(),
          }
          return {
            ...portfolio,
            stocks: [...portfolio.stocks, newStock],
          }
        }
        return portfolio
      }),
    )
  }

  const deleteStock = (portfolioId: string, stockId: string) => {
    setPortfolios(
      portfolios.map((portfolio) => {
        if (portfolio.id === portfolioId) {
          return {
            ...portfolio,
            stocks: portfolio.stocks.filter((stock) => stock.id !== stockId),
          }
        }
        return portfolio
      }),
    )
  }

  const moveStock = (fromPortfolioId: string, toPortfolioId: string, stock: Stock) => {
    setPortfolios((prevPortfolios) => {
      return prevPortfolios.map((portfolio) => {
        if (portfolio.id === fromPortfolioId) {
          return {
            ...portfolio,
            stocks: portfolio.stocks.filter((s) => s.id !== stock.id),
          }
        } else if (portfolio.id === toPortfolioId) {
          const newStock: Stock = {
            ...stock,
            id: uuidv4(),
          }
          return {
            ...portfolio,
            stocks: [...portfolio.stocks, newStock],
          }
        }
        return portfolio
      })
    })
  }

  const pasteStock = (portfolioId: string) => {
    if (!copiedStock || copiedStock.sourcePortfolioId === portfolioId) return

    const targetPortfolio = portfolios.find((p) => p.id === portfolioId)
    if (!targetPortfolio) return

    const stockExists = targetPortfolio.stocks.some((stock) => stock.name === copiedStock.stock.name)
    if (stockExists) return

    addStock(portfolioId, {
      name: copiedStock.stock.name,
      shares: copiedStock.stock.shares,
    })
  }

  const canPasteInPortfolio = (portfolioId: string) => {
    if (!copiedStock || copiedStock.sourcePortfolioId === portfolioId) return false

    const targetPortfolio = portfolios.find((p) => p.id === portfolioId)
    if (!targetPortfolio) return false

    return !targetPortfolio.stocks.some((stock) => stock.name === copiedStock.stock.name)
  }

  return {
    portfolios,
    copiedStock,
    addPortfolio,
    deletePortfolio,
    addStock,
    deleteStock,
    moveStock,
    pasteStock,
    canPasteInPortfolio,
  }
} 