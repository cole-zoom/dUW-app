package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"

	"github.com/cole-zoom/dUW-app/api/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// StockHandler to hold db connection
type StockHandler struct {
	db *pgx.Conn
}

// Creates a new stock handler with database connection
func NewStockHandler(db *pgx.Conn) *StockHandler {
	return &StockHandler{
		db: db,
	}
}

// GetStocks --> GET /api/portfolios/{portfolio_id}/stocks
func (h *StockHandler) GetStocks(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID, ok := ctx.Value("userID").(string)

	log.Println(userID)

	if !ok {
		h.sendErrorResponse(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// TODO: Extract portfolio_id from URL
	portfolioID := r.PathValue("portfolioID")

	query := `
        SELECT s.id, s.portfolio_id, s.ticker, s.shares, s.created_at, s.updated_at
        FROM stocks s
        JOIN portfolios p ON s.portfolio_id = p.id
        WHERE s.portfolio_id = $1 AND p.user_id = $2
        ORDER BY s.created_at ASC;
    `
	rows, err := h.db.Query(ctx, query, portfolioID, userID)

	if err != nil {
		h.sendErrorResponse(w, "Failed to fetch stocks", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	stocks, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.Stock])
	if err != nil {
		h.sendErrorResponse(w, "Failed to scan stock data", http.StatusInternalServerError)
		return
	}

	if len(stocks) == 0 {
		var exists bool
		err := h.db.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM portfolios WHERE id = $1 AND user_id = $2)", portfolioID, userID).Scan(&exists)
		if err != nil {
			h.sendErrorResponse(w, "Failed to verify portfolio", http.StatusInternalServerError)
			return
		}
		if !exists {
			h.sendErrorResponse(w, "Portfolio not found or access denied", http.StatusNotFound)
			return
		}
	}

	response := models.APIResponse{Success: true, Data: stocks}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// CreateStock --> POST /api/portfolios/{portfolio_id}/stocks
func (h *StockHandler) CreateStock(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, ok := ctx.Value("userID").(string)

	log.Println(userID)
	if !ok {
		h.sendErrorResponse(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	portfolioID := r.PathValue("portfolioID")

	var req models.CreateStockRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendErrorResponse(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if req.Ticker == "" || req.Shares <= 0 {
		h.sendErrorResponse(w, "Ticker and positive shares are required", http.StatusBadRequest)
		return
	}

	var stock models.Stock

	// This query is now atomic. It tries to insert a stock but ONLY if the
	// target portfolio_id exists in a portfolio owned by the current user.
	// If the user doesn't own the portfolio, the subquery returns NULL and the INSERT fails.
	query := `
        INSERT INTO stocks (portfolio_id, ticker, shares)
        VALUES (
            (SELECT id FROM portfolios WHERE id = $1 AND user_id = $2),
            $3,
            $4
        )
        RETURNING id, portfolio_id, ticker, shares, created_at, updated_at
    `
	err := h.db.QueryRow(ctx, query, portfolioID, userID, req.Ticker, req.Shares).Scan(
		&stock.ID, &stock.PortfolioID, &stock.Ticker, &stock.Shares, &stock.CreatedAt, &stock.UpdatedAt,
	)

	if err != nil {
		// Check for a foreign key violation, which now doubles as our auth check.
		if pgxErr, ok := err.(*pgconn.PgError); ok && pgxErr.Code == "23503" {
			h.sendErrorResponse(w, "Portfolio not found or access denied", http.StatusNotFound)
			return
		}
		h.sendErrorResponse(w, "Failed to create stock", http.StatusInternalServerError)
		return
	}

	response := models.APIResponse{Success: true, Data: stock}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// UpdateStock --> PUT /api/portfolios/{portfolio_id}/stocks/{stock_id}
func (h *StockHandler) UpdateStock(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, ok := ctx.Value("userID").(string)
	if !ok {
		h.sendErrorResponse(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	stockID := r.PathValue("stockID")

	var req models.UpdateStockRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendErrorResponse(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	// Basic validation
	if req.Ticker == nil && req.Shares == nil {
		h.sendErrorResponse(w, "No update fields provided", http.StatusBadRequest)
		return
	}
	if req.Shares != nil && *req.Shares <= 0 {
		h.sendErrorResponse(w, "Shares must be positive", http.StatusBadRequest)
		return
	}

	var stock models.Stock
	// This single query updates the stock ONLY if it exists AND belongs to a portfolio
	// owned by the authenticated user.
	query := `
        UPDATE stocks s SET
            ticker = COALESCE($1, s.ticker),
            shares = COALESCE($2, s.shares)
        FROM portfolios p
        WHERE s.id = $3
          AND s.portfolio_id = p.id
          AND p.user_id = $4
        RETURNING s.id, s.portfolio_id, s.ticker, s.shares, s.created_at, s.updated_at
    `
	err := h.db.QueryRow(ctx, query, req.Ticker, req.Shares, stockID, userID).Scan(
		&stock.ID, &stock.PortfolioID, &stock.Ticker, &stock.Shares, &stock.CreatedAt, &stock.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			h.sendErrorResponse(w, "Stock not found or access denied", http.StatusNotFound)
			return
		}
		h.sendErrorResponse(w, "Failed to update stock", http.StatusInternalServerError)
		return
	}

	response := models.APIResponse{Success: true, Data: stock}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// DeleteStock --> DELETE /api/portfolios/{portfolio_id}/stocks/{stock_id}
func (h *StockHandler) DeleteStock(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, ok := ctx.Value("userID").(string)
	if !ok {
		h.sendErrorResponse(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	portfolioID := r.PathValue("portfolioID")
	stockID := r.PathValue("stockID")

	// Delete the stock ONLY if it exists AND belongs to a portfolio owned by the authenticated user
	query := `
        DELETE FROM stocks s
        USING portfolios p
        WHERE s.id = $1
          AND s.portfolio_id = $2
          AND s.portfolio_id = p.id
          AND p.user_id = $3
    `
	result, err := h.db.Exec(ctx, query, stockID, portfolioID, userID)

	if err != nil {
		h.sendErrorResponse(w, "Failed to delete stock", http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		h.sendErrorResponse(w, "Stock not found or access denied", http.StatusNotFound)
		return
	}

	response := models.APIResponse{Success: true, Data: nil}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// MoveStock --> PATCH /api/portfolios/{portfolio_id}/stocks/{stock_id}/move
func (h *StockHandler) MoveStock(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, ok := ctx.Value("userID").(string)
	if !ok {
		h.sendErrorResponse(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	stockID := r.PathValue("stockID")

	var req models.MoveStockRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendErrorResponse(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if req.ToPortfolioID == "" {
		h.sendErrorResponse(w, "Destination portfolio ID is required", http.StatusBadRequest)
		return
	}

	var stock models.Stock
	// This query moves the stock ONLY if:
	// 1. The stock exists and belongs to a portfolio owned by the authenticated user
	// 2. The destination portfolio exists and is owned by the authenticated user
	query := `
        UPDATE stocks s SET
            portfolio_id = $1
        FROM portfolios p_source, portfolios p_dest
        WHERE s.id = $2
          AND s.portfolio_id = p_source.id
          AND p_source.user_id = $3
          AND p_dest.id = $1
          AND p_dest.user_id = $3
        RETURNING s.id, s.portfolio_id, s.ticker, s.shares, s.created_at, s.updated_at
    `
	err := h.db.QueryRow(ctx, query, req.ToPortfolioID, stockID, userID).Scan(
		&stock.ID, &stock.PortfolioID, &stock.Ticker, &stock.Shares, &stock.CreatedAt, &stock.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			h.sendErrorResponse(w, "Stock not found, access denied, or destination portfolio not found", http.StatusNotFound)
			return
		}
		h.sendErrorResponse(w, "Failed to move stock", http.StatusInternalServerError)
		return
	}

	response := models.APIResponse{Success: true, Data: stock}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// sendErrorResponse is a helper to send consistent error responses
func (h *StockHandler) sendErrorResponse(w http.ResponseWriter, message string, statusCode int) {
	response := models.ErrorResponse{
		Success: false,
		Error:   message,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		// If we can't encode the error response, fall back to plain text
		http.Error(w, fmt.Sprintf("Error: %s", message), statusCode)
	}
}
