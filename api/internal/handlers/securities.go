package handlers

import (
	"compress/gzip"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/cole-zoom/dUW-app/api/internal/models"
	"github.com/jackc/pgx/v5"
)

// SecuritiesHandler handles all securities-related HTTP requests
type SecuritiesHandler struct {
	db *pgx.Conn
}

// NewSecuritiesHandler creates a new securities handler with database connection
func NewSecuritiesHandler(db *pgx.Conn) *SecuritiesHandler {
	return &SecuritiesHandler{
		db: db,
	}
}

// GetSecuritiesTrie --> GET /api/securities/trie
// Returns all securities organized in a Trie data structure for efficient autocomplete
func (h *SecuritiesHandler) GetSecuritiesTrie(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	startTime := time.Now()

	log.Println("Building securities Trie...")

	// Query all active securities from the database
	securities, err := h.fetchAllSecurities(ctx)
	if err != nil {
		h.sendErrorResponse(w, "Failed to fetch securities", http.StatusInternalServerError)
		return
	}

	if len(securities) == 0 {
		h.sendErrorResponse(w, "No securities found", http.StatusNotFound)
		return
	}

	// Build the Trie
	trie := models.NewTrie()
	for _, security := range securities {
		trie.Insert(security)
	}

	buildTime := time.Since(startTime)
	log.Printf("Built Trie with %d securities in %v", len(securities), buildTime)

	// Prepare the response
	response := models.CompressedTrieResponse{
		Trie:      trie,
		Count:     len(securities),
		Version:   "1.0",
		BuildTime: buildTime.String(),
	}

	// Set headers for compression and caching
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Encoding", "gzip")
	w.Header().Set("Cache-Control", "public, max-age=3600") // Cache for 1 hour
	w.Header().Set("Vary", "Accept-Encoding")

	// Create gzip writer
	gz := gzip.NewWriter(w)
	defer gz.Close()

	// Encode and compress the response
	if err := json.NewEncoder(gz).Encode(response); err != nil {
		log.Printf("Failed to encode and compress response: %v", err)
		h.sendErrorResponse(w, "Failed to compress response", http.StatusInternalServerError)
		return
	}

	log.Printf("Successfully served compressed Trie response")
}

// SearchSecurities --> GET /api/securities/search?q={prefix}
// Returns securities that match the given prefix using the Trie
func (h *SecuritiesHandler) SearchSecurities(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	query := r.URL.Query().Get("q")

	if query == "" {
		h.sendErrorResponse(w, "Query parameter 'q' is required", http.StatusBadRequest)
		return
	}

	if len(query) < 1 {
		h.sendErrorResponse(w, "Query must be at least 1 character", http.StatusBadRequest)
		return
	}

	log.Printf("Searching securities with prefix: %s", query)

	// For now, we'll rebuild the Trie on each search. In production, you might want to cache this.
	securities, err := h.fetchAllSecurities(ctx)
	if err != nil {
		h.sendErrorResponse(w, "Failed to fetch securities", http.StatusInternalServerError)
		return
	}

	// Build the Trie
	trie := models.NewTrie()
	for _, security := range securities {
		trie.Insert(security)
	}

	// Search for matching securities
	matches := trie.Search(query)

	// Limit results to prevent overwhelming the client
	maxResults := 50
	if len(matches) > maxResults {
		matches = matches[:maxResults]
	}

	response := models.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"query":   query,
			"matches": matches,
			"count":   len(matches),
			"limited": len(matches) == maxResults,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// fetchAllSecurities retrieves all securities from the database
func (h *SecuritiesHandler) fetchAllSecurities(ctx context.Context) ([]models.Securities, error) {
	query := `
		SELECT ticker, name, market, locale, primary_exchange, type, active, 
		       currency_name, cik, composite_figi, share_class_figi, 
		       to_char(last_updated_utc AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS.MS+00') as last_updated_utc
		FROM securities 
		WHERE active = true 
		ORDER BY ticker ASC
	`

	rows, err := h.db.Query(ctx, query)
	if err != nil {
		log.Printf("Database query failed: %v", err)
		return nil, fmt.Errorf("failed to query securities: %w", err)
	}
	defer rows.Close()

	var securities []models.Securities
	for rows.Next() {
		var security models.Securities
		err := rows.Scan(
			&security.Ticker,
			&security.Name,
			&security.Market,
			&security.Locale,
			&security.PrimaryExchange,
			&security.Type,
			&security.Active,
			&security.CurrencyName,
			&security.Cik,
			&security.CompositeFigi,
			&security.ShareClassFigi,
			&security.LastUpdatedUtc,
		)
		if err != nil {
			log.Printf("Failed to scan security row: %v", err)
			return nil, fmt.Errorf("failed to scan security: %w", err)
		}
		securities = append(securities, security)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Row iteration error: %v", err)
		return nil, fmt.Errorf("row iteration failed: %w", err)
	}

	return securities, nil
}

// sendErrorResponse is a helper to send consistent error responses
func (h *SecuritiesHandler) sendErrorResponse(w http.ResponseWriter, message string, statusCode int) {
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
