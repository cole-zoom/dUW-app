package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/cole-zoom/dUW-app/api/internal/clients"
	"github.com/cole-zoom/dUW-app/api/internal/handlers"
	"github.com/cole-zoom/dUW-app/api/internal/middleware"
	"github.com/cole-zoom/dUW-app/api/internal/services"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

/*
Main backend function for dUW-app.

This also serves as a tutorial for me so ignore useless comments.
*/
func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: Could not load .env file: %v", err)
		log.Println("Continuing with system environment variables...")
	} else {
		log.Println("Successfully loaded .env file")
	}

	// Get database connection string from environment
	connStr := os.Getenv("NEON_PASS")
	if connStr == "" {
		fmt.Fprintln(os.Stderr, "NEON_PASS environment variable not set")
		os.Exit(1)
	}

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Validate Polygon API key
	polygonAPIKey := os.Getenv("POLYGON_API_KEY")
	if polygonAPIKey == "" {
		fmt.Fprintln(os.Stderr, "POLYGON_API_KEY environment variable not set")
		os.Exit(1)
	}
	log.Printf("Polygon API key loaded: %s...", polygonAPIKey[:8])

	// Create database connection pool
	var ctx context.Context = context.Background()
	var pool *pgxpool.Pool
	var err error

	pool, err = pgxpool.New(ctx, connStr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to create connection pool: %v\n", err)
		os.Exit(1)
	}
	defer pool.Close()

	log.Println("Successfully created database connection pool")

	// Test the connection
	var greeting string
	err = pool.QueryRow(ctx, "SELECT 'Hello from Neon!'").Scan(&greeting)
	if err != nil {
		fmt.Fprintf(os.Stderr, "QueryRow failed: %v\n", err)
		os.Exit(1)
	}
	log.Printf("Database says: %s", greeting)

	// Initialize handlers with database connection pool
	portfolioHandler := handlers.NewPortfolioHandler(pool)
	stockHandler := handlers.NewStockHandler(pool)
	securitiesHandler := handlers.NewSecuritiesHandler(pool)

	// Initialize polygon API integration
	polygonClient := clients.NewPolygonClient(polygonAPIKey)
	polygonStockService := services.NewStockService(polygonClient)
	polygonStockHandler := handlers.NewStockAPIHandler(polygonStockService)

	// All routes will be registered in the main mux with selective auth

	// Create main mux for all routes
	mux := http.NewServeMux()

	// Register health endpoint directly (will be handled by selective auth)
	mux.HandleFunc("GET /api/health", healthHandler)

	// Register all other API routes
	mux.HandleFunc("GET /api/portfolios", portfolioHandler.GetPortfolios)
	mux.HandleFunc("POST /api/portfolios", portfolioHandler.CreatePortfolio)
	mux.HandleFunc("PUT /api/portfolios/{id}", portfolioHandler.UpdatePortfolio)
	mux.HandleFunc("DELETE /api/portfolios/{id}", portfolioHandler.DeletePortfolio)

	mux.HandleFunc("GET /api/portfolios/{portfolioID}/stocks", stockHandler.GetStocks)
	mux.HandleFunc("POST /api/portfolios/{portfolioID}/stocks", stockHandler.CreateStock)
	mux.HandleFunc("PUT /api/portfolios/{portfolioID}/stocks/{stockID}", stockHandler.UpdateStock)
	mux.HandleFunc("DELETE /api/portfolios/{portfolioID}/stocks/{stockID}", stockHandler.DeleteStock)
	mux.HandleFunc("PATCH /api/portfolios/{portfolioID}/stocks/{stockID}/move", stockHandler.MoveStock)
	mux.HandleFunc("GET /api/stocks/suggestions", polygonStockHandler.GetSuggestedStocks)

	// Stock data endpoints (Polygon API)
	mux.HandleFunc("GET /api/stocks/{ticker}/aggregates", polygonStockHandler.GetAggregates)
	mux.HandleFunc("GET /api/stocks/{ticker}/details", polygonStockHandler.GetTickerDetails)
	mux.HandleFunc("GET /api/stocks/{ticker}/previous", polygonStockHandler.GetPreviousClose)

	mux.HandleFunc("GET /api/securities/trie", securitiesHandler.GetSecuritiesTrie)
	mux.HandleFunc("GET /api/securities/search", securitiesHandler.SearchSecurities)

	// Create selective auth middleware
	selectiveAuthHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip auth for health endpoint
		if r.URL.Path == "/api/health" && r.Method == "GET" {
			log.Printf("Health endpoint accessed - skipping auth")
			mux.ServeHTTP(w, r)
			return
		}

		// Apply JWT auth for all other API routes
		if strings.HasPrefix(r.URL.Path, "/api/") {
			log.Printf("API endpoint accessed - applying auth: %s", r.URL.Path)
			middleware.JWTAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				mux.ServeHTTP(w, r)
			})).ServeHTTP(w, r)
			return
		}

		// All other routes pass through without auth
		log.Printf("Non-API endpoint accessed - no auth: %s", r.URL.Path)
		mux.ServeHTTP(w, r)
	})

	// Create server with configurable port
	var server *http.Server = &http.Server{
		Addr:         ":" + port,
		Handler:      middleware.CORS(selectiveAuthHandler),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Starting server on port %s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	// Wait for interrupt signal to shutdown server
	var quit chan os.Signal = make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Give outstanding requests a 30-second deadline to complete
	var shutdownCtx context.Context
	var cancel context.CancelFunc
	shutdownCtx, cancel = context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}

// healthHandler provides a simple health check endpoint
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, `{"status":"healthy","timestamp":"`, time.Now().Format(time.RFC3339), `"}`)
}
