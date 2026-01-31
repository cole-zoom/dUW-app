package services

import (
	"context"

	"github.com/cole-zoom/dUW-app/api/internal/clients"
	"github.com/cole-zoom/dUW-app/api/internal/models"
)

type StockService struct {
	stockAPIClient clients.APIClient
}

func NewStockService(client clients.APIClient) *StockService {
	return &StockService{stockAPIClient: client}
}

func (s *StockService) GetSuggestedStocks(ctx context.Context, query string) ([]models.DisplayStock, error) {
	return s.stockAPIClient.GetSuggestedStocks(ctx, query)
}

// GetAggregates retrieves historical OHLC data for a ticker.
func (s *StockService) GetAggregates(ctx context.Context, ticker, multiplier, timespan, from, to string) (*models.AggregatesResponse, error) {
	return s.stockAPIClient.GetAggregates(ctx, ticker, multiplier, timespan, from, to)
}

// GetTickerDetails retrieves detailed information about a ticker.
func (s *StockService) GetTickerDetails(ctx context.Context, ticker string) (*models.TickerDetails, error) {
	return s.stockAPIClient.GetTickerDetails(ctx, ticker)
}

// GetPreviousClose retrieves the previous day's OHLC data for a ticker.
func (s *StockService) GetPreviousClose(ctx context.Context, ticker string) (*models.PreviousCloseResponse, error) {
	return s.stockAPIClient.GetPreviousClose(ctx, ticker)
}
