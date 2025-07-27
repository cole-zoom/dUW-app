package models

import "time"

// Database model
type Stock struct {
	ID          string    `json:"id" db:"id"`
	PortfolioID string    `json:"portfolio_id" db:"portfolio_id"`
	Ticker      string    `json:"ticker" db:"ticker"`
	Shares      float64   `json:"shares" db:"shares"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// Database model
type Portfolio struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Stocks    []Stock   `json:"stocks"`
}

// CreatePortfolioRequest model
type CreatePortfolioRequest struct {
	Name string `json:"name" validate:"required,min=1,max=100"`
}

// CreateStockRequest model
type CreateStockRequest struct {
	Ticker string  `json:"ticker" validate:"required,min=1,max=10"` // Changed from Name to Ticker
	Shares float64 `json:"shares" validate:"required,min=0"`
}

// UpdatePortfolioRequest model
type UpdatePortfolioRequest struct {
	Name string `json:"name" validate:"required,min=1,max=100"`
}

// UpdateStockRequest model
type UpdateStockRequest struct {
	Ticker *string  `json:"ticker,omitempty" validate:"omitempty,min=1,max=10"` // Optional field for partial updates
	Shares *float64 `json:"shares,omitempty" validate:"omitempty,min=0"`        // Optional field for partial updates
}

// MoveStockRequest model
type MoveStockRequest struct {
	ToPortfolioID string `json:"to_portfolio_id" validate:"required"`
}

// APIResponse represents a standard API response
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
}
