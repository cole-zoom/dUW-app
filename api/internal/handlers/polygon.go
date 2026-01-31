package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/cole-zoom/dUW-app/api/internal/services"
)

// StockAPIHandler handles all requests related to external stock APIs.
type StockAPIHandler struct {
	stockService *services.StockService
}

// NewStockAPIHandler creates and returns a new StockAPIHandler.
// It takes the service layer as a dependency, not the database.
func NewStockAPIHandler(s *services.StockService) *StockAPIHandler {
	return &StockAPIHandler{stockService: s}
}

// GetSuggestedStocks is the HTTP handler for the stock suggestions API endpoint.
func (h *StockAPIHandler) GetSuggestedStocks(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query") // Optional query parameter for searching

	// Call the service layer to get the data
	stocks, err := h.stockService.GetSuggestedStocks(r.Context(), query)
	if err != nil {
		log.Printf("Error getting suggested stocks: %v", err)
		http.Error(w, fmt.Sprintf("Failed to get suggested stocks: %v", err), http.StatusInternalServerError)
		return
	}

	// Respond with JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stocks)
}

// GetAggregates is the HTTP handler for fetching historical OHLC data.
// GET /api/stocks/{ticker}/aggregates?timespan=day&from=2024-01-01&to=2024-12-31&multiplier=1
func (h *StockAPIHandler) GetAggregates(w http.ResponseWriter, r *http.Request) {
	ticker := r.PathValue("ticker")
	if ticker == "" {
		http.Error(w, "Ticker is required", http.StatusBadRequest)
		return
	}

	// Get query parameters with defaults
	timespan := r.URL.Query().Get("timespan")
	if timespan == "" {
		timespan = "day"
	}

	multiplier := r.URL.Query().Get("multiplier")
	if multiplier == "" {
		multiplier = "1"
	}

	from := r.URL.Query().Get("from")
	to := r.URL.Query().Get("to")

	if from == "" || to == "" {
		http.Error(w, "Both 'from' and 'to' date parameters are required (YYYY-MM-DD format)", http.StatusBadRequest)
		return
	}

	aggregates, err := h.stockService.GetAggregates(r.Context(), ticker, multiplier, timespan, from, to)
	if err != nil {
		log.Printf("Error getting aggregates for %s: %v", ticker, err)
		http.Error(w, fmt.Sprintf("Failed to get aggregates: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(aggregates)
}

// GetTickerDetails is the HTTP handler for fetching detailed ticker information.
// GET /api/stocks/{ticker}/details
func (h *StockAPIHandler) GetTickerDetails(w http.ResponseWriter, r *http.Request) {
	ticker := r.PathValue("ticker")
	if ticker == "" {
		http.Error(w, "Ticker is required", http.StatusBadRequest)
		return
	}

	details, err := h.stockService.GetTickerDetails(r.Context(), ticker)
	if err != nil {
		log.Printf("Error getting ticker details for %s: %v", ticker, err)
		http.Error(w, fmt.Sprintf("Failed to get ticker details: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(details)
}

// GetPreviousClose is the HTTP handler for fetching previous day's OHLC data.
// GET /api/stocks/{ticker}/previous
func (h *StockAPIHandler) GetPreviousClose(w http.ResponseWriter, r *http.Request) {
	ticker := r.PathValue("ticker")
	if ticker == "" {
		http.Error(w, "Ticker is required", http.StatusBadRequest)
		return
	}

	prevClose, err := h.stockService.GetPreviousClose(r.Context(), ticker)
	if err != nil {
		log.Printf("Error getting previous close for %s: %v", ticker, err)
		http.Error(w, fmt.Sprintf("Failed to get previous close: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(prevClose)
}
