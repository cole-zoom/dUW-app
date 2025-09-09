# Duwiligence Portfolio Management App

This is a web application for users of Duwiligence to signup and create their portfolio for daily newsletters.
Visit [Duwiligence](https://www.duwiligence.app/)

## Tech Stack

### Frontend
- **Next.js** - React framework for production
- **TypeScript** - Type-safe JavaScript
- **Stack Auth** - Authentication provider
- **React Hook Form** - Form validation and management

### Backend
- **Go** - Backend API server
- **JWT** - JSON Web Token authentication

### Database
- **NeonDB** - Serverless PostgreSQL database

### External APIs
- **Polygon.io** - Stock market data API

### Deployment
- **Vercel** - Frontend hosting and deployment
- **AWS** - Backend infrastructure hosting

## API Endpoints

All API endpoints are protected with JWT authentication except for the health check endpoint.

### Health
- `GET /api/health` - Health check endpoint (no auth required)

### Portfolios
- `GET /api/portfolios` - Get all portfolios for authenticated user
- `POST /api/portfolios` - Create a new portfolio
- `PUT /api/portfolios/{id}` - Update a specific portfolio
- `DELETE /api/portfolios/{id}` - Delete a specific portfolio

### Stocks
- `GET /api/portfolios/{portfolioID}/stocks` - Get all stocks in a portfolio
- `POST /api/portfolios/{portfolioID}/stocks` - Add a stock to a portfolio
- `PUT /api/portfolios/{portfolioID}/stocks/{stockID}` - Update a stock in a portfolio
- `DELETE /api/portfolios/{portfolioID}/stocks/{stockID}` - Remove a stock from a portfolio
- `PATCH /api/portfolios/{portfolioID}/stocks/{stockID}/move` - Move a stock between portfolios
- `GET /api/stocks/suggestions` - Get stock suggestions from Polygon API

### Securities
- `GET /api/securities/trie` - Get securities data as trie structure
- `GET /api/securities/search` - Search for securities

## Local Development

### Prerequisites
- Node.js 18+ and pnpm
- Go 1.24+
- NeonDB account and database
- Polygon.io API key

### Backend Setup

1. Navigate to the API directory:
   ```bash
   cd api
   ```

2. Create a `.env` file in the `api` directory:
   ```bash
   NEON_PASS=your_neon_database_connection_string
   POLYGON_API_KEY=your_polygon_api_key
   ```

3. Run the backend development server:
   ```bash
   ./scripts/dev.sh
   ```

The backend will start on `http://localhost:8080`

### Frontend Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create a `.env.local` file in the root directory:
   ```bash
   NEXT_PUBLIC_STACK_PROJECT_ID=your_stack_project_id
   NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_stack_publishable_key
   STACK_SECRET_SERVER_KEY=your_stack_secret_key
   DATABASE_URL=your_neon_database_url
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

3. Run the frontend development server:
   ```bash
   npm run start
   ```

The frontend will be available at `http://localhost:3000`

### Development Workflow

1. Start the backend server first using `./scripts/dev.sh` from the `api` directory
2. Start the frontend server using `npm run start` from the root directory
3. The frontend will communicate with the backend API for all data operations
4. Authentication is handled by Stack Auth with JWT tokens validated by the Go backend
