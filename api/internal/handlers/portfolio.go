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
	"github.com/jackc/pgx/v5/pgxpool"
)

// PortfolioHandler to hold db connection pool
type PortfolioHandler struct {
	db *pgxpool.Pool
}

// Creates a new portfolio handler with database connection pool
func NewPortfolioHandler(db *pgxpool.Pool) *PortfolioHandler {
	return &PortfolioHandler{
		db: db,
	}
}

// GetPortfolios -->  GET /api/portfolios
func (h *PortfolioHandler) GetPortfolios(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID, ok := ctx.Value("userID").(string)

	log.Println(userID)

	if !ok {
		h.sendErrorResponse(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	query := `
        SELECT
            p.id,
            p.name,
            p.user_id,
            p.created_at,
            p.updated_at,
            COALESCE(
                (SELECT json_agg(
                    json_build_object(
                        'id', s.id,
                        'portfolio_id', s.portfolio_id,
                        'ticker', s.ticker,
                        'shares', s.shares,
                        'created_at', to_char(s.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
                        'updated_at', to_char(s.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
                    ) ORDER BY s.created_at ASC
                 )
                 FROM stocks s
                 WHERE s.portfolio_id = p.id),
                '[]'::json
            ) AS stocks
        FROM
            portfolios p
		WHERE
			p.user_id = $1
        ORDER BY
            p.created_at ASC;
    `
	rows, err := h.db.Query(ctx, query, userID)

	if err != nil {
		log.Printf("GetPortfolios - Database query failed for userID %s: %v", userID, err)
		h.sendErrorResponse(w, "Failed to fetch portfolios", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Parse results into portfolio structs
	portfolios := make([]models.Portfolio, 0)

	for rows.Next() {
		var p models.Portfolio
		var stocksJSON []byte

		if err := rows.Scan(&p.ID, &p.Name, &p.UserID, &p.CreatedAt, &p.UpdatedAt, &stocksJSON); err != nil {
			log.Printf("GetPortfolios - Failed to scan portfolio row for userID %s: %v", userID, err)
			h.sendErrorResponse(w, "Failed to scan portfolio data", http.StatusInternalServerError)
			return
		}

		if err := json.Unmarshal(stocksJSON, &p.Stocks); err != nil {
			log.Printf("GetPortfolios - Failed to unmarshal stocks JSON for portfolio %s, userID %s: %v", p.ID, userID, err)
			h.sendErrorResponse(w, "Failed to unmarshal stocks", http.StatusInternalServerError)
			return
		}
		portfolios = append(portfolios, p)
	}

	response := models.APIResponse{
		Success: true,
		Data:    portfolios,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// CreatePortfolio --> POST /api/portfolios
func (h *PortfolioHandler) CreatePortfolio(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Get userID from context
	userID, ok := ctx.Value("userID").(string)

	log.Printf("CreatePortfolio - Starting request for userID: %s", userID)

	if !ok {
		log.Printf("CreatePortfolio - Unauthorized: userID not found in context")
		h.sendErrorResponse(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req models.CreatePortfolioRequest

	// Decode JSON body
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("CreatePortfolio - Invalid JSON body for userID %s: %v", userID, err)
		h.sendErrorResponse(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	log.Printf("CreatePortfolio - Request decoded for userID %s: portfolio name='%s'", userID, req.Name)

	// Basic validation
	if req.Name == "" {
		log.Printf("CreatePortfolio - Empty portfolio name provided for userID %s", userID)
		h.sendErrorResponse(w, "Name is required", http.StatusBadRequest)
		return
	}

	var portfolio models.Portfolio

	// Insert into database
	log.Printf("CreatePortfolio - Attempting to insert portfolio with name='%s' for userID='%s'", req.Name, userID)

	err := h.db.QueryRow(ctx, `
		INSERT INTO portfolios (name, user_id)
		VALUES ($1, $2)
		RETURNING id, name, user_id, created_at, updated_at
	`, req.Name, userID).Scan(&portfolio.ID, &portfolio.Name, &portfolio.UserID, &portfolio.CreatedAt, &portfolio.UpdatedAt)

	if err != nil {
		log.Printf("CreatePortfolio - Database insert failed for userID %s, portfolio name='%s': %v", userID, req.Name, err)

		// Check for specific database errors
		if pgxErr, ok := err.(*pgconn.PgError); ok {
			log.Printf("CreatePortfolio - PostgreSQL error details: Code=%s, Message=%s, Detail=%s, Hint=%s",
				pgxErr.Code, pgxErr.Message, pgxErr.Detail, pgxErr.Hint)
		}

		h.sendErrorResponse(w, "Failed to create portfolio", http.StatusInternalServerError)
		return
	}

	log.Printf("CreatePortfolio - Successfully created portfolio ID=%s for userID=%s", portfolio.ID, userID)

	// Initialize empty stocks array
	portfolio.Stocks = []models.Stock{}

	// Send the *actual* created portfolio back to the client
	response := models.APIResponse{
		Success: true,
		Data:    portfolio,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// UpdatePortfolio --> PUT /api/portfolios/{id}
func (h *PortfolioHandler) UpdatePortfolio(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Get userID from context
	userID, ok := ctx.Value("userID").(string)

	log.Println(userID)

	if !ok {
		h.sendErrorResponse(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Extract portfolio ID from URL
	portfolioID := r.PathValue("id")
	if portfolioID == "" {
		h.sendErrorResponse(w, "Portfolio ID is required", http.StatusBadRequest)
		return
	}

	var req models.UpdatePortfolioRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendErrorResponse(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		h.sendErrorResponse(w, "Name is required", http.StatusBadRequest)
		return
	}

	var portfolio models.Portfolio

	err := h.db.QueryRow(ctx, `
		UPDATE portfolios SET name = $1, updated_at = CURRENT_TIMESTAMP 
		WHERE id = $2 AND user_id = $3
		RETURNING id, name, user_id, created_at, updated_at
	`, req.Name, portfolioID, userID).Scan(&portfolio.ID, &portfolio.Name, &portfolio.UserID, &portfolio.CreatedAt, &portfolio.UpdatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			h.sendErrorResponse(w, "Portfolio not found or access denied", http.StatusNotFound)
			return
		}
		h.sendErrorResponse(w, "Failed to update portfolio", http.StatusInternalServerError)
		return
	}

	// Initialize empty stocks array
	portfolio.Stocks = []models.Stock{}

	// Send the updated portfolio back to the client
	response := models.APIResponse{
		Success: true,
		Data:    portfolio,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// DeletePortfolio --> DELETE /api/portfolios/{id}
func (h *PortfolioHandler) DeletePortfolio(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Get userID from context
	userID, ok := ctx.Value("userID").(string)

	log.Println(userID)

	if !ok {
		h.sendErrorResponse(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Extract portfolio ID from URL
	portfolioID := r.PathValue("id")
	if portfolioID == "" {
		h.sendErrorResponse(w, "Portfolio ID is required", http.StatusBadRequest)
		return
	}

	// Check if this is the user's last portfolio
	var portfolioCount int
	err := h.db.QueryRow(ctx, "SELECT COUNT(*) FROM portfolios WHERE user_id = $1", userID).Scan(&portfolioCount)
	if err != nil {
		log.Printf("DeletePortfolio - Failed to check portfolio count for userID %s: %v", userID, err)
		h.sendErrorResponse(w, "Failed to check portfolio count", http.StatusInternalServerError)
		return
	}

	if portfolioCount <= 1 {
		h.sendErrorResponse(w, "Cannot delete the last portfolio", http.StatusBadRequest)
		return
	}

	// Delete the portfolio (and associated stocks due to CASCADE)
	result, err := h.db.Exec(ctx, `
		DELETE FROM portfolios WHERE id = $1 AND user_id = $2
	`, portfolioID, userID)

	if err != nil {
		h.sendErrorResponse(w, "Failed to delete portfolio", http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		h.sendErrorResponse(w, "Portfolio not found or access denied", http.StatusNotFound)
		return
	}

	// Send success response
	response := models.APIResponse{
		Success: true,
		Data:    nil,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// sendErrorResponse is a helper to send consistent error responses
func (h *PortfolioHandler) sendErrorResponse(w http.ResponseWriter, message string, statusCode int) {
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
