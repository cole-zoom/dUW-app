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
