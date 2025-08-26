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
