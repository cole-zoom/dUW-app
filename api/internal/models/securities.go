package models

type Securities struct {
	Ticker          string  `json:"ticker"`           // Required - cannot be null
	Name            string  `json:"name"`             // Required - cannot be null
	Market          *string `json:"market"`           // Optional - can be null
	Locale          *string `json:"locale"`           // Optional - can be null
	PrimaryExchange *string `json:"primary_exchange"` // Optional - can be null
	Type            *string `json:"type"`             // Optional - can be null
	Active          bool    `json:"active"`           // Required - boolean
	CurrencyName    *string `json:"currency_name"`    // Optional - can be null
	Cik             *string `json:"cik"`              // Optional - can be null
	CompositeFigi   *string `json:"composite_figi"`   // Optional - can be null
	ShareClassFigi  *string `json:"share_class_figi"` // Optional - can be null
	LastUpdatedUtc  *string `json:"last_updated_utc"` // Optional - can be null
}
