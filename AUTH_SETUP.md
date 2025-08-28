# Authentication Setup Guide

## Overview
This application uses Stack Auth (Neon Auth) for user authentication with JWT tokens validated in the Go backend.

## Frontend Setup

### 1. Install Dependencies
The Stack Auth SDK is already installed. If you need to reinstall:
```bash
npm install @stackframe/stack
```

### 2. Configure Stack Auth
Create a `.env.local` file in the root directory with your Stack Auth credentials:
```env
# Stack Auth Configuration
NEXT_PUBLIC_STACK_PROJECT_ID=0eaf0d10-2495-48c5-b797-7b31f972a13c
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_publishable_client_key_here
STACK_SECRET_SERVER_KEY=your_secret_server_key_here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. Stack Auth Dashboard
1. Go to your Stack Auth dashboard
2. Configure your project settings:
   - Set allowed redirect URLs (http://localhost:3000/*, your production URL)
   - Configure authentication providers (email/password, OAuth, etc.)
   - Customize the authentication UI if needed

## Backend Setup

### 1. JWT Validation
The Go backend validates JWT tokens using the JWKS endpoint:
- JWKS URL: `https://api.stack-auth.com/api/v1/projects/0eaf0d10-2495-48c5-b797-7b31f972a13c/.well-known/jwks.json`
- The middleware fetches and caches the public keys for 1 hour

### 2. API Routes Protection
All API routes except `/api/health` require authentication:
- Protected routes expect a Bearer token in the Authorization header
- The JWT is validated against Stack Auth's public keys
- User ID is extracted from the token's `sub` claim

### 3. Running the Backend
```bash
cd api
go mod download
go run cmd/server/main.go
```

## Authentication Flow

### 1. User Login/Signup
- User clicks "Log In" or "Get Started" on the landing page
- Stack Auth handles the authentication UI and flow
- Upon successful authentication, user receives a JWT token
- Token is stored in cookies by Stack Auth

### 2. Making Authenticated API Calls
- Frontend automatically includes the Bearer token in API requests
- Backend validates the token using the JWT middleware
- If valid, the request proceeds with the user ID in context
- If invalid, returns 401 Unauthorized

### 3. Protected Routes
- Unauthenticated users are redirected to `/landing`
- Authenticated users are redirected from `/landing` to `/portfolio`
- Protected pages use the `AuthenticatedLayout` component

## Testing

### 1. Test Authentication Flow
```bash
# Start the backend
cd api
go run cmd/server/main.go

# In another terminal, start the frontend
npm run dev
```

### 2. Verify Authentication
1. Navigate to http://localhost:3000
2. You should be redirected to the landing page if not logged in
3. Click "Get Started" or "Log In"
4. Complete the Stack Auth authentication flow
5. You should be redirected to `/portfolio` after successful login

### 3. Test API Authentication
```bash
# Get a JWT token from Stack Auth (after logging in)
# You can find it in the browser's developer tools (Application > Cookies)

# Test authenticated API call
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8080/api/portfolios
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized Errors**
   - Check that the JWT token is being sent in the Authorization header
   - Verify the token hasn't expired
   - Ensure the JWKS URL is accessible from your backend

2. **Redirect Loops**
   - Check the middleware configuration
   - Verify Stack Auth URLs configuration
   - Ensure cookies are enabled in the browser

3. **CORS Issues**
   - The backend is configured to allow localhost:3000-3999
   - For production, update CORS settings in `api/internal/middleware/auth.go`

## Security Considerations

1. **Token Storage**: Stack Auth handles secure token storage in httpOnly cookies
2. **Token Validation**: Always validate tokens on the backend
3. **HTTPS**: Use HTTPS in production for secure token transmission
4. **Token Expiration**: Stack Auth handles token refresh automatically

## Production Deployment

1. Update environment variables with production values
2. Configure production URLs in Stack Auth dashboard
3. Update CORS settings in the backend
4. Ensure HTTPS is configured for both frontend and backend
5. Set up proper logging and monitoring for authentication failures
