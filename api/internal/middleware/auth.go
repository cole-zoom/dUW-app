package middleware

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
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

// JWKSet represents a set of JSON Web Keys
type JWKSet struct {
	Keys []JWK `json:"keys"`
}

// JWK represents a JSON Web Key
type JWK struct {
	Kid string `json:"kid"`
	Kty string `json:"kty"`
	Use string `json:"use"`
	Alg string `json:"alg"`
	// RSA fields
	N string `json:"n,omitempty"`
	E string `json:"e,omitempty"`
	// ECDSA fields
	Crv string `json:"crv,omitempty"`
	X   string `json:"x,omitempty"`
	Y   string `json:"y,omitempty"`
}

// JWKSCache caches the JWKS from Stack Auth
type JWKSCache struct {
	mu        sync.RWMutex
	keys      map[string]interface{} // Can hold *rsa.PublicKey or *ecdsa.PublicKey
	expiresAt time.Time
}

var (
	jwksCache = &JWKSCache{
		keys: make(map[string]interface{}),
	}
	jwksURL = "https://api.stack-auth.com/api/v1/projects/0eaf0d10-2495-48c5-b797-7b31f972a13c/.well-known/jwks.json"
)

// fetchJWKS fetches the JWKS from Stack Auth
func fetchJWKS() error {
	resp, err := http.Get(jwksURL)
	if err != nil {
		return fmt.Errorf("failed to fetch JWKS: %w", err)
	}
	defer resp.Body.Close()

	var jwks JWKSet
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return fmt.Errorf("failed to decode JWKS: %w", err)
	}

	jwksCache.mu.Lock()
	defer jwksCache.mu.Unlock()

	// Clear old keys
	jwksCache.keys = make(map[string]interface{})

	// Parse and cache each key
	for _, jwk := range jwks.Keys {
		switch jwk.Kty {
		case "RSA":
			pubKey, err := parseRSAKey(jwk)
			if err != nil {
				log.Printf("Failed to parse RSA key %s: %v", jwk.Kid, err)
				continue
			}
			jwksCache.keys[jwk.Kid] = pubKey

		case "EC":
			pubKey, err := parseECKey(jwk)
			if err != nil {
				log.Printf("Failed to parse EC key %s: %v", jwk.Kid, err)
				continue
			}
			jwksCache.keys[jwk.Kid] = pubKey

		default:
			log.Printf("Unsupported key type %s for key %s", jwk.Kty, jwk.Kid)
		}
	}

	// Cache for 1 hour
	jwksCache.expiresAt = time.Now().Add(1 * time.Hour)
	return nil
}

// parseRSAKey parses an RSA JWK into an RSA public key
func parseRSAKey(jwk JWK) (*rsa.PublicKey, error) {
	// Decode the modulus
	nBytes, err := base64.RawURLEncoding.DecodeString(jwk.N)
	if err != nil {
		return nil, fmt.Errorf("failed to decode modulus: %w", err)
	}

	// Decode the exponent
	eBytes, err := base64.RawURLEncoding.DecodeString(jwk.E)
	if err != nil {
		return nil, fmt.Errorf("failed to decode exponent: %w", err)
	}

	// Convert exponent bytes to int
	var e int
	for _, b := range eBytes {
		e = e<<8 + int(b)
	}

	// Create RSA public key
	return &rsa.PublicKey{
		N: new(big.Int).SetBytes(nBytes),
		E: e,
	}, nil
}

// parseECKey parses an EC JWK into an ECDSA public key
func parseECKey(jwk JWK) (*ecdsa.PublicKey, error) {
	// Determine the curve
	var curve elliptic.Curve
	switch jwk.Crv {
	case "P-256":
		curve = elliptic.P256()
	case "P-384":
		curve = elliptic.P384()
	case "P-521":
		curve = elliptic.P521()
	default:
		return nil, fmt.Errorf("unsupported curve: %s", jwk.Crv)
	}

	// Decode X coordinate
	xBytes, err := base64.RawURLEncoding.DecodeString(jwk.X)
	if err != nil {
		return nil, fmt.Errorf("failed to decode x coordinate: %w", err)
	}

	// Decode Y coordinate
	yBytes, err := base64.RawURLEncoding.DecodeString(jwk.Y)
	if err != nil {
		return nil, fmt.Errorf("failed to decode y coordinate: %w", err)
	}

	// Create ECDSA public key
	return &ecdsa.PublicKey{
		Curve: curve,
		X:     new(big.Int).SetBytes(xBytes),
		Y:     new(big.Int).SetBytes(yBytes),
	}, nil
}

// getPublicKey retrieves the public key for the given kid
func getPublicKey(kid string) (interface{}, error) {
	jwksCache.mu.RLock()
	if time.Now().Before(jwksCache.expiresAt) {
		key, ok := jwksCache.keys[kid]
		jwksCache.mu.RUnlock()
		if ok {
			return key, nil
		}
	} else {
		jwksCache.mu.RUnlock()
	}

	// Fetch fresh JWKS
	if err := fetchJWKS(); err != nil {
		return nil, err
	}

	jwksCache.mu.RLock()
	key, ok := jwksCache.keys[kid]
	jwksCache.mu.RUnlock()

	if !ok {
		return nil, fmt.Errorf("key with kid %s not found", kid)
	}

	return key, nil
}

// JWTAuth validates JWT tokens from Stack Auth
func JWTAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Missing authorization header", http.StatusUnauthorized)
			return
		}

		// Check for Bearer scheme
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Invalid authorization header format", http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

		// Parse the token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Get the kid from token header
			kid, ok := token.Header["kid"].(string)
			if !ok {
				return nil, fmt.Errorf("kid not found in token header")
			}

			// Get the public key
			pubKey, err := getPublicKey(kid)
			if err != nil {
				return nil, err
			}

			// Check signing method matches the key type
			switch token.Method.(type) {
			case *jwt.SigningMethodRSA:
				if _, ok := pubKey.(*rsa.PublicKey); !ok {
					return nil, fmt.Errorf("RSA signing method but key is not RSA")
				}
			case *jwt.SigningMethodECDSA:
				if _, ok := pubKey.(*ecdsa.PublicKey); !ok {
					return nil, fmt.Errorf("ECDSA signing method but key is not ECDSA")
				}
			default:
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}

			return pubKey, nil
		})

		if err != nil {
			log.Printf("JWT validation error: %v", err)
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		if !token.Valid {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Extract claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, "Invalid token claims", http.StatusUnauthorized)
			return
		}

		// Get user ID from sub claim
		userID, ok := claims["sub"].(string)
		if !ok {
			http.Error(w, "User ID not found in token", http.StatusUnauthorized)
			return
		}

		// Add user ID to context
		ctx := context.WithValue(r.Context(), "userID", userID)
		r = r.WithContext(ctx)

		next.ServeHTTP(w, r)
	})
}

// UserID extracts userID from header and adds it to context (deprecated - use JWTAuth)
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
