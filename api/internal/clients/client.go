package clients

import (
	"context"

	"github.com/cole-zoom/dUW-app/api/internal/models"
)

// APIClient defines the interface for an external stock API.
type APIClient interface {
	GetSuggestedStocks(ctx context.Context, query string) ([]models.DisplayStock, error)
	GetAggregates(ctx context.Context, ticker, multiplier, timespan, from, to string) (*models.AggregatesResponse, error)
	GetTickerDetails(ctx context.Context, ticker string) (*models.TickerDetails, error)
	GetPreviousClose(ctx context.Context, ticker string) (*models.PreviousCloseResponse, error)
}
