package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/cole-zoom/dUW-app/api/internal/handlers"
	"github.com/cole-zoom/dUW-app/api/internal/middleware"
	"github.com/jackc/pgx/v5"
)

/*
Main backend function for dUW-app.

This also serves as a tutorial for me so ignore useless comments.
*/
func main() {
	// Get database connection string from environment
	connStr := os.Getenv("NEON_DEV_PASS")
	if connStr == "" {
		fmt.Fprintln(os.Stderr, "NEON_DEV_PASS environment variable not set")
		os.Exit(1)
	}

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Create database connection
	var ctx context.Context = context.Background()
	var conn *pgx.Conn
	var err error

	conn, err = pgx.Connect(ctx, connStr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(ctx)

	log.Println("Successfully connected to Neon database")

	// Test the connection
	var greeting string
	err = conn.QueryRow(ctx, "SELECT 'Hello from Neon!'").Scan(&greeting)
	if err != nil {
		fmt.Fprintf(os.Stderr, "QueryRow failed: %v\n", err)
		os.Exit(1)
	}
	log.Printf("Database says: %s", greeting)

	// Create a new HTTP router
	var mux *http.ServeMux = http.NewServeMux()

	// Initialize handlers with database connection
	portfolioHandler := handlers.NewPortfolioHandler(conn)
	stockHandler := handlers.NewStockHandler(conn)

	// Register routes
	mux.HandleFunc("GET /api/health", healthHandler)

	// Portfolio routes
	mux.HandleFunc("GET /api/portfolios", portfolioHandler.GetPortfolios)
	mux.HandleFunc("POST /api/portfolios", portfolioHandler.CreatePortfolio)
	mux.HandleFunc("PUT /api/portfolios/{id}", portfolioHandler.UpdatePortfolio)
	mux.HandleFunc("DELETE /api/portfolios/{id}", portfolioHandler.DeletePortfolio)

	// Stock routes
	mux.HandleFunc("GET /api/portfolios/{portfolioID}/stocks", stockHandler.GetStocks)
	mux.HandleFunc("POST /api/portfolios/{portfolioID}/stocks", stockHandler.CreateStock)
	mux.HandleFunc("PUT /api/portfolios/{portfolioID}/stocks/{stockID}", stockHandler.UpdateStock)
	mux.HandleFunc("DELETE /api/portfolios/{portfolioID}/stocks/{stockID}", stockHandler.DeleteStock)
	mux.HandleFunc("PATCH /api/portfolios/{portfolioID}/stocks/{stockID}/move", stockHandler.MoveStock)

	// Create server with configurable port
	var server *http.Server = &http.Server{
		Addr:         ":" + port,
		Handler:      middleware.CORS(middleware.UserID(mux)),
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
