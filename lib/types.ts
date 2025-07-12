// dUwiligence types

/**
 * Represents a single stock holding.
 */
export interface Stock {
  id: string
  name: string
  shares: number
}

export interface Portfolio {
  id: string
  title: string
  stocks: Stock[]
}

/**
 * Represents the state of a stock that has been copied to the clipboard.
 */
export type CopiedStock = {
    stock: Stock;
    sourcePortfolioId: string;
  } | null;
  
  // --- Prop Types for Function Handlers ---
  
  export type AddStockHandler = (portfolioId: string, stock: Omit<Stock, "id">) => void;
  export type DeleteStockHandler = (portfolioId: string, stockId: string) => void;
  export type MoveStockHandler = (fromPortfolioId: string, toPortfolioId: string, stock: Stock) => void;
  export type PasteStockHandler = (portfolioId: string) => void;
  export type CopyStockHandler = (stock: Stock, sourcePortfolioId: string) => void;