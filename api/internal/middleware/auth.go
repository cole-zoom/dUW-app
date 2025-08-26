package middleware

import (
	"context"
	"log"
	"net/http"
	"strings"
)

// CORS adds CORS headers for development
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		// Debug logging
		log.Printf("[CORS] Request from origin: %s", origin)
		log.Printf("[CORS] Request URL: %s", r.URL.String())
		log.Printf("[CORS] Request method: %s", r.Method)

		// Allow localhost origins with ports 3000-3999
		if origin != "" && strings.HasPrefix(origin, "http://localhost:3") {
			log.Printf("[CORS] Allowing origin: %s", origin)
			w.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			// Fallback to default
			log.Printf("[CORS] Using fallback origin for: %s", origin)
			w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, userID")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// UserID extracts userID from header and adds it to context
func UserID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID := r.Header.Get("userID")
		if userID != "" {
			ctx := context.WithValue(r.Context(), "userID", userID)
			r = r.WithContext(ctx)
		}

		next.ServeHTTP(w, r)
	})
}
