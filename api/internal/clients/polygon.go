package clients

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/cole-zoom/dUW-app/api/internal/models"
	"golang.org/x/time/rate"
)

type PolygonClient struct {
	httpClient  *http.Client
	apiKey      string
	rateLimiter *rate.Limiter
}

func NewPolygonClient(apiKey string) *PolygonClient {
	return &PolygonClient{
		httpClient: &http.Client{Timeout: 10 * time.Second},
		apiKey:     apiKey,
		// Polygon.io free tier: 5 requests/minute = 1 every 12 seconds
		// Burst of 5 allows initial requests to go through quickly
		rateLimiter: rate.NewLimiter(rate.Every(12*time.Second), 5),
	}
}

// waitForRateLimit waits for the rate limiter before making an API call.
// Returns an error if the context is cancelled while waiting.
func (c *PolygonClient) waitForRateLimit(ctx context.Context) error {
	if err := c.rateLimiter.Wait(ctx); err != nil {
		return fmt.Errorf("rate limit wait failed: %w", err)
	}
	return nil
}

// GetSuggestedStocks fetches stocks from the Polygon API based on a search query.
// This method makes a SINGLE HTTP request to avoid rate limiting issues.
func (c *PolygonClient) GetSuggestedStocks(ctx context.Context, query string) ([]models.DisplayStock, error) {
	if err := c.waitForRateLimit(ctx); err != nil {
		return nil, err
	}
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

// GetAggregates fetches historical OHLC data for a ticker from Polygon API.
// multiplier: size of the timespan multiplier (e.g., "1")
// timespan: size of the time window (e.g., "day", "week", "month")
// from, to: date range in YYYY-MM-DD format
func (c *PolygonClient) GetAggregates(ctx context.Context, ticker, multiplier, timespan, from, to string) (*models.AggregatesResponse, error) {
	if err := c.waitForRateLimit(ctx); err != nil {
		return nil, err
	}
	log.Printf("GetAggregates called for ticker: %s, timespan: %s, from: %s, to: %s", ticker, timespan, from, to)

	// Build the API URL
	// GET /v2/aggs/ticker/{stocksTicker}/range/{multiplier}/{timespan}/{from}/{to}
	baseURL := fmt.Sprintf("https://api.polygon.io/v2/aggs/ticker/%s/range/%s/%s/%s/%s",
		ticker, multiplier, timespan, from, to)

	params := url.Values{}
	params.Set("adjusted", "true")
	params.Set("sort", "asc")
	params.Set("apiKey", c.apiKey)

	apiURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())
	log.Printf("Making API request to: %s", baseURL)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status code: %d", resp.StatusCode)
	}

	var apiResponse models.AggregatesResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResponse); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	log.Printf("GetAggregates Response: Status=%s, ResultsCount=%d", apiResponse.Status, apiResponse.ResultsCount)
	return &apiResponse, nil
}

// TickerNotFoundError is returned when a ticker doesn't exist in Polygon's database.
type TickerNotFoundError struct {
	Ticker string
}

func (e *TickerNotFoundError) Error() string {
	return fmt.Sprintf("ticker not found: %s", e.Ticker)
}

// GetTickerDetails fetches detailed information about a ticker from Polygon API.
func (c *PolygonClient) GetTickerDetails(ctx context.Context, ticker string) (*models.TickerDetails, error) {
	if err := c.waitForRateLimit(ctx); err != nil {
		return nil, err
	}
	log.Printf("GetTickerDetails called for ticker: %s", ticker)

	// Build the API URL
	// GET /v3/reference/tickers/{ticker}
	baseURL := fmt.Sprintf("https://api.polygon.io/v3/reference/tickers/%s", ticker)

	params := url.Values{}
	params.Set("apiKey", c.apiKey)

	apiURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())
	log.Printf("Making API request to: %s", baseURL)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// Read the error response body for better debugging
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("Polygon API error for ticker %s: status=%d, body=%s", ticker, resp.StatusCode, string(bodyBytes))

		// Return a specific error type for 404 so handlers can respond appropriately
		if resp.StatusCode == http.StatusNotFound {
			return nil, &TickerNotFoundError{Ticker: ticker}
		}
		return nil, fmt.Errorf("API request failed with status code: %d", resp.StatusCode)
	}

	var apiResponse models.TickerDetailsResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResponse); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	log.Printf("GetTickerDetails Response: Status=%s, Ticker=%s", apiResponse.Status, apiResponse.Results.Ticker)
	return &apiResponse.Results, nil
}

// GetPreviousClose fetches the previous day's OHLC data for a ticker from Polygon API.
func (c *PolygonClient) GetPreviousClose(ctx context.Context, ticker string) (*models.PreviousCloseResponse, error) {
	if err := c.waitForRateLimit(ctx); err != nil {
		return nil, err
	}
	log.Printf("GetPreviousClose called for ticker: %s", ticker)

	// Build the API URL
	// GET /v2/aggs/ticker/{stocksTicker}/prev
	baseURL := fmt.Sprintf("https://api.polygon.io/v2/aggs/ticker/%s/prev", ticker)

	params := url.Values{}
	params.Set("adjusted", "true")
	params.Set("apiKey", c.apiKey)

	apiURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())
	log.Printf("Making API request to: %s", baseURL)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status code: %d", resp.StatusCode)
	}

	// Read the body for debugging
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}
	log.Printf("GetPreviousClose raw response: %s", string(bodyBytes))

	var apiResponse models.PreviousCloseResponse
	if err := json.Unmarshal(bodyBytes, &apiResponse); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	log.Printf("GetPreviousClose Response: Status=%s, ResultsCount=%d", apiResponse.Status, apiResponse.ResultsCount)
	return &apiResponse, nil
}
