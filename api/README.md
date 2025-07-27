# Portfolio API (Go Backend)

A RESTful API built with Go for managing investment portfolios.

## 🚀 Quick Start

### Prerequisites
- Go 1.24+ installed
- Add Go to your PATH: `export PATH=$PATH:/usr/local/go/bin`

### Installation & Setup

1. **Navigate to the API directory:**
   ```bash
   cd api
   ```

2. **Install dependencies:**
   ```bash
   go mod tidy
   ```

3. **Run the server:**
   ```bash
   go run cmd/server/main.go
   ```

4. **Test the API:**
   ```bash
   curl http://localhost:8080/api/health
   ```

## 📁 Project Structure

```
api/
├── cmd/server/          # Application entry points
│   └── main.go         # Main server file
├── internal/           # Private application code
│   ├── handlers/       # HTTP handlers (controllers)
│   ├── models/         # Data structures
│   └── database/       # Database logic (future)
├── pkg/                # Public packages
│   └── utils/          # Utility functions
├── go.mod              # Go module definition
└── README.md           # This file
```

## 🛠 API Endpoints

### Health Check
- **GET** `/api/health` - Check if the API is running

### Portfolios
- **GET** `/api/portfolios` - Get all portfolios
- **POST** `/api/portfolios` - Create a new portfolio

### Example Requests

**Create a Portfolio:**
```bash
curl -X POST http://localhost:8080/api/portfolios \
  -H "Content-Type: application/json" \
  -d '{"title": "My Retirement Fund"}'
```

**Get All Portfolios:**
```bash
curl http://localhost:8080/api/portfolios
```

## 🎯 Go Best Practices Used

1. **Standard Project Layout:** Following Go community conventions
2. **Package Organization:** `internal/` for private code, `pkg/` for public
3. **Error Handling:** Explicit error checking and proper HTTP status codes
4. **JSON Tags:** Proper struct tags for API serialization
5. **Graceful Shutdown:** Server handles SIGINT/SIGTERM properly
6. **CORS Support:** Ready for frontend integration
7. **Clean Code:** Well-documented functions and clear naming

## 🔧 Development

### Running Tests (when added)
```bash
go test ./...
```

### Building for Production
```bash
go build -o bin/server cmd/server/main.go
```

### Code Formatting
```bash
go fmt ./...
```

### Adding Dependencies
```bash
go get github.com/some/package
go mod tidy
```

## 🌟 Next Steps

1. **Add Database:** Integrate with PostgreSQL or SQLite
2. **Add Authentication:** JWT tokens for secure endpoints  
3. **Add Validation:** Use a library like `validator/v10`
4. **Add Testing:** Unit and integration tests
5. **Add Logging:** Structured logging with `slog`
6. **Add Docker:** Containerization for deployment

## 🤝 Integration with Frontend

The API runs on `http://localhost:8080` and includes CORS headers for your Next.js frontend running on `http://localhost:3000`.

To use in your React components:
```typescript
// Fetch portfolios
const response = await fetch('http://localhost:8080/api/portfolios');
const data = await response.json();
``` 