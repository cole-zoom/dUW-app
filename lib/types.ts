// dUwiligence types

/**
 * Represents a single stock holding.
 */
export interface Stock {
  id: string
  portfolio_id: string
  ticker: string  // Changed from 'name' to 'ticker' to match backend
  shares: number 
  created_at: string
  updated_at: string
}

/**
 * Represents a collection of stocks.
 */
export interface Portfolio {
  id: string
  user_id: string  // Added to match backend
  name: string     // Changed from 'title' to 'name' to match backend
  stocks: Stock[]
  created_at: string 
  updated_at: string 
}

/**
 * Request body for creating a new portfolio.
 */
export interface CreatePortfolioRequest {
  name: string  // Changed from 'title' to 'name'
}

/**
 * Request body for adding a stock to a portfolio.
 */
export interface CreateStockRequest {
  ticker: string  // Changed from 'name' to 'ticker'
  shares: number
}

/**
 * Request body for updating a stock.
 */
export interface UpdateStockRequest {
  ticker?: string
  shares?: number
}

/**
 * Request body for moving a stock between portfolios.
 */
export interface MoveStockRequest {
  to_portfolio_id: string
}

/**
 * Request body for updating a portfolio.
 */
export interface UpdatePortfolioRequest {
  name: string
}

/**
 * Represents a security/stock from the securities database.
 */
export interface Securities {
  ticker: string
  name: string
  market?: string
  locale?: string
  primary_exchange?: string
  type?: string
  active: boolean
  currency_name?: string
  cik?: string
  composite_figi?: string
  share_class_figi?: string
  last_updated_utc?: string
}

/**
 * Represents a node in the securities trie structure.
 */
export interface TrieNode {
  children?: { [key: string]: TrieNode }
  securities?: Securities[]
  is_end: boolean
}

/**
 * Represents the response from the securities trie API.
 * This matches the CompressedTrieResponse from the Go backend.
 */
export interface SecuritiesTrieResponse {
  trie: {
    root: TrieNode
    size: number
  }
  count: number
  version: string
  build_time: string
}

/**
 * Standard API response wrapper.
 */
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Error response wrapper.
 */
export interface ErrorResponse {
  success: boolean
  error: string
}

/**
 * Represents the state of a stock that has been copied to the clipboard.
 */
export type CopiedStock = {
    stock: Stock;
    sourcePortfolioId: string;
  } | null;
  
  // --- Prop Types for Function Handlers ---
  
  export type AddStockHandler = (portfolioId: string, stock: Omit<Stock, "id" | "portfolio_id" | "created_at" | "updated_at">) => void;
  export type DeleteStockHandler = (portfolioId: string, stockId: string) => void;
  export type MoveStockHandler = (fromPortfolioId: string, toPortfolioId: string, stock: Stock) => void;
  export type PasteStockHandler = (portfolioId: string) => void;
  export type CopyStockHandler = (stock: Stock, sourcePortfolioId: string) => void;