package models

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
