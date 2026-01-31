package models

import (
	"encoding/json"
	"strconv"
)

// FlexibleInt64 can unmarshal from either a JSON number or a JSON string
type FlexibleInt64 int64

func (f *FlexibleInt64) UnmarshalJSON(data []byte) error {
	// First try to unmarshal as int64
	var i int64
	if err := json.Unmarshal(data, &i); err == nil {
		*f = FlexibleInt64(i)
		return nil
	}

	// If that fails, try as string
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	parsed, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return err
	}
	*f = FlexibleInt64(parsed)
	return nil
}

// PolygonTickerResponse represents a single ticker response from Polygon API
type PolygonTickerResponse struct {
	Ticker          string `json:"ticker"`
	Name            string `json:"name"`
	Market          string `json:"market"`
	Locale          string `json:"locale"`
	PrimaryExchange string `json:"primary_exchange"`
	Type            string `json:"type"`
	Active          bool   `json:"active"`
	CurrencyName    string `json:"currency_name"`
	Cik             string `json:"cik"`
	CompositeFigi   string `json:"composite_figi"`
	ShareClassFigi  string `json:"share_class_figi"`
	LastUpdatedUtc  string `json:"last_updated_utc"`
}

// PolygonAPIResponse represents the full API response from Polygon tickers endpoint
type PolygonAPIResponse struct {
	Results   []PolygonTickerResponse `json:"results"`
	Status    string                  `json:"status"`
	RequestID string                  `json:"request_id"`
	Count     int                     `json:"count"`
	NextURL   string                  `json:"next_url"`
}

// AggregateBar represents a single OHLC bar from Polygon aggregates endpoint
type AggregateBar struct {
	Open      float64       `json:"o"`
	High      float64       `json:"h"`
	Low       float64       `json:"l"`
	Close     float64       `json:"c"`
	Volume    float64       `json:"v"`
	Timestamp FlexibleInt64 `json:"t"` // Can be int64 or string from API
	VWAP      float64       `json:"vw"`
	NumTrades int           `json:"n"`
}

// AggregatesResponse represents the response from Polygon aggregates endpoint
type AggregatesResponse struct {
	Ticker       string         `json:"ticker"`
	QueryCount   int            `json:"queryCount"`
	ResultsCount int            `json:"resultsCount"`
	Adjusted     bool           `json:"adjusted"`
	Results      []AggregateBar `json:"results"`
	Status       string         `json:"status"`
	RequestID    string         `json:"request_id"`
}

// TickerDetails represents detailed information about a ticker
type TickerDetails struct {
	Ticker                      string  `json:"ticker"`
	Name                        string  `json:"name"`
	Market                      string  `json:"market"`
	Locale                      string  `json:"locale"`
	PrimaryExchange             string  `json:"primary_exchange"`
	Type                        string  `json:"type"`
	Active                      bool    `json:"active"`
	CurrencyName                string  `json:"currency_name"`
	MarketCap                   float64 `json:"market_cap"`
	ShareClassSharesOutstanding int64   `json:"share_class_shares_outstanding"`
	WeightedSharesOutstanding   int64   `json:"weighted_shares_outstanding"`
	Description                 string  `json:"description"`
	HomepageURL                 string  `json:"homepage_url"`
	TotalEmployees              int     `json:"total_employees"`
	ListDate                    string  `json:"list_date"`
}

// TickerDetailsResponse represents the response from Polygon ticker details endpoint
type TickerDetailsResponse struct {
	Results   TickerDetails `json:"results"`
	Status    string        `json:"status"`
	RequestID string        `json:"request_id"`
}

// PreviousCloseResponse represents the response from Polygon previous close endpoint
type PreviousCloseResponse struct {
	Ticker       string         `json:"ticker"`
	QueryCount   int            `json:"queryCount"`
	ResultsCount int            `json:"resultsCount"`
	Adjusted     bool           `json:"adjusted"`
	Results      []AggregateBar `json:"results"`
	Status       string         `json:"status"`
	RequestID    string         `json:"request_id"`
}
