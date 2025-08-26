package clients

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/cole-zoom/dUW-app/api/internal/models"
)

type PolygonClient struct {
	httpClient *http.Client
	apiKey     string
}

func NewPolygonClient(apiKey string) *PolygonClient {
	return &PolygonClient{
		httpClient: &http.Client{Timeout: 10 * time.Second},
		apiKey:     apiKey,
	}
}

// GetSuggestedStocks fetches stocks from the Polygon API based on a search query.
// This method makes a SINGLE HTTP request to avoid rate limiting issues.
func (c *PolygonClient) GetSuggestedStocks(ctx context.Context, query string) ([]models.DisplayStock, error) {
	log.Printf("GetSuggestedStocks called with query: '%s'", query)

	// Build the API URL with parameters
	baseURL := "https://api.polygon.io/v3/reference/tickers"
	params := url.Values{}
	params.Set("market", "stocks")
	params.Set("active", "true")
	params.Set("sort", "ticker")
	params.Set("order", "asc")
	params.Set("limit", "1000")
	params.Set("apiKey", c.apiKey)

	// If a search query is provided, add it to the parameters
	if query != "" {
		params.Set("search", query)
		log.Printf("Added search parameter: %s", query)
	}

	// Construct the full URL
	apiURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())
	log.Printf("Making single API request to: %s", baseURL) // Don't log API key

	// Create the HTTP request
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Execute the request
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	// Check for HTTP errors
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status code: %d", resp.StatusCode)
	}

	// Parse the JSON response
	var apiResponse models.PolygonAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResponse); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	log.Printf("API Response: Status=%s, Count=%d", apiResponse.Status, apiResponse.Count)

	// Convert Polygon response to our DisplayStock model
	var stocks []models.DisplayStock
	for i, polygonTicker := range apiResponse.Results {
		log.Printf("Processing ticker %d: %s - %s", i+1, polygonTicker.Ticker, polygonTicker.Name)

		displayStock := models.DisplayStock{
			Ticker:          polygonTicker.Ticker,
			Name:            polygonTicker.Name,
			Shares:          0, // Default to 0 shares since this is for suggestions
			PrimaryExchange: polygonTicker.PrimaryExchange,
			CurrencyName:    polygonTicker.CurrencyName,
		}

		stocks = append(stocks, displayStock)
	}

	log.Printf("Successfully retrieved %d stocks in SINGLE API request", len(stocks))
	return stocks, nil
}
