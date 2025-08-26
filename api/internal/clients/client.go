package clients

import (
	"context"

	"github.com/cole-zoom/dUW-app/api/internal/models"
)

// APIClient defines the interface for an external stock API.
type APIClient interface {
	GetSuggestedStocks(ctx context.Context, query string) ([]models.DisplayStock, error)
}
