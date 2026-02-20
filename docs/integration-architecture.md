# Ditto - Integration Architecture

**Updated:** 2026-02-20
**Integration Type:** REST API over HTTP
**Pattern:** Client-Server with JWT + CSRF Authentication

---

## Executive Summary

This document describes how the Ditto frontend (Next.js) and backend (Go) integrate to form a cohesive application. The integration uses RESTful HTTP communication with JWT authentication managed by NextAuth v5.

**Key Integration Points:**
- Frontend → Backend API calls via axios with retry logic
- Authentication via NextAuth v5 with custom backend provider
- JWT token management (access + refresh) with CSRF protection
- CORS configuration for local development
- Error handling with structured error codes and field-level validation
- S3 file uploads via presigned URLs

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Browser                                │
└───────┬─────────────────────────────────────────────────────────┘
        │
        │ HTTP Requests
        │
┌───────▼─────────────────────────────────────────────────────────┐
│               Next.js Frontend (Port 8080)                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  NextAuth v5 (Auth Management)                           │  │
│  │  - Credentials Provider → Backend /api/login             │  │
│  │  - GitHub/Google OAuth → Backend /api/oauth              │  │
│  │  - Session Management (JWT tokens)                       │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                             │
│  ┌────────────────▼─────────────────────────────────────────┐  │
│  │  Axios Client (lib/axios.ts)                             │  │
│  │  - Base URL: http://localhost:8081                       │  │
│  │  - Request Interceptor: Inject JWT from NextAuth         │  │
│  │  - Response Interceptor: Handle 401, refresh token       │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                             │
│  ┌────────────────▼─────────────────────────────────────────┐  │
│  │  API Service Layer (lib/)                                 │  │
│  │  - axios.ts (CSRF, retry, 401 refresh queue)             │  │
│  │  - file-service.ts (S3 presigned uploads)                │  │
│  │  - errors.ts (error code mapping)                        │  │
│  │  - schemas/ (Zod validation)                             │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                             │
└───────────────────┼─────────────────────────────────────────────┘
                    │
                    │ REST API Calls
                    │ Authorization: Bearer <JWT>
                    │
┌───────────────────▼─────────────────────────────────────────────┐
│               Go Backend API (Port 8081)                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CORS Middleware                                         │  │
│  │  - Allow Origins: localhost:8080, 8082, 3000            │  │
│  │  - Allow Methods: GET, POST, PUT, PATCH, DELETE         │  │
│  │  - Allow Credentials: true                              │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                             │
│  ┌────────────────▼─────────────────────────────────────────┐  │
│  │  Auth Middleware (Protected Routes)                     │  │
│  │  - Validate JWT from Authorization header               │  │
│  │  - Extract user_id, store in Gin context               │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                             │
│  ┌────────────────▼─────────────────────────────────────────┐  │
│  │  Handler Layer                                           │  │
│  │  - Parse request, validate input                        │  │
│  │  - Call repository with user_id                         │  │
│  │  - Return JSON response                                 │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                             │
│  ┌────────────────▼─────────────────────────────────────────┐  │
│  │  Repository Layer                                        │  │
│  │  - User-scoped database queries                         │  │
│  │  - Transaction management                               │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                             │
└───────────────────┼─────────────────────────────────────────────┘
                    │
                    │ SQL Queries
                    │
┌───────────────────▼─────────────────────────────────────────────┐
│           PostgreSQL Database (Port 5432)                       │
│  - User data (scoped by user_id)                               │
│  - Companies, Jobs, Applications                               │
│  - Soft deletes, auto-timestamps                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Examples

### 1. User Login Flow

```
[User]
  │
  ├─1─> Enter email/password in Login form
  │
[Next.js Frontend]
  │
  ├─2─> NextAuth credentials provider calls signIn()
  │
  ├─3─> POST /api/auth/callback/credentials
  │       ↓ (NextAuth internally)
  │     authorize() function in auth.ts
  │
  ├─4─> axios.post('/api/login', { email, password })
  │
[Go Backend]
  │
  ├─5─> Handler: internal/handlers/auth.go:Login()
  │     - Validate input
  │     - Query users_auth table
  │     - Compare password (bcrypt)
  │
  ├─6─> Repository: internal/repository/user.go:GetUserByEmail()
  │     - SELECT * FROM users JOIN users_auth...
  │
  ├─7─> Generate JWT tokens
  │     - Access token (24 hour TTL)
  │     - Refresh token (7 days TTL)
  │     - Store refresh token in users_auth.refresh_token
  │
  ├─8─> Return JSON:
  │     {
  │       "user": {...},
  │       "access_token": "jwt...",
  │       "refresh_token": "jwt..."
  │     }
  │
[Next.js Frontend]
  │
  ├─9─> NextAuth jwt() callback receives tokens
  │     - Stores in JWT session
  │
  ├─10─> NextAuth session() callback
  │      - Makes session available to client
  │
[User]
  │
  └─11─> Redirected to dashboard (authenticated)
```

---

### 2. Protected API Call Flow

```
[Next.js Page/Component]
  │
  ├─1─> useSession() retrieves JWT token from NextAuth
  │
  ├─2─> Call API: jobService.getJobs()
  │
[Axios Client]
  │
  ├─3─> Request Interceptor:
  │     - Get session from NextAuth (getSession())
  │     - Extract access token
  │     - Add header: Authorization: Bearer <token>
  │
  ├─4─> Send: GET http://localhost:8081/api/jobs
  │
[Go Backend]
  │
  ├─5─> CORS Middleware: Check origin, set headers
  │
  ├─6─> Auth Middleware: internal/middleware/auth.go
  │     - Extract token from Authorization header
  │     - Validate JWT signature
  │     - Decode user_id from token
  │     - Store user_id in Gin context
  │
  ├─7─> Handler: internal/handlers/job.go:GetUserJobs()
  │     - Extract user_id from context
  │     - Call repository
  │
  ├─8─> Repository: internal/repository/job.go:GetUserJobs()
  │     - SELECT * FROM user_jobs
  │       WHERE user_id = $1 AND deleted_at IS NULL
  │
  ├─9─> Return JSON:
  │     {
  │       "jobs": [...],
  │       "total_count": 15,
  │       "page": 1
  │     }
  │
[Axios Client]
  │
  ├─10─> Response Interceptor:
  │      - Success: Pass through
  │      - 401 Unauthorized: Trigger token refresh
  │
[Next.js Component]
  │
  └─11─> Render jobs in UI
```

---

### 3. Token Refresh Flow

```
[Axios Response Interceptor]
  │
  ├─1─> Detect 401 Unauthorized response
  │
  ├─2─> Get refresh token from NextAuth session
  │
  ├─3─> POST /api/refresh_token
  │     Body: { refresh_token: "jwt..." }
  │
[Go Backend]
  │
  ├─4─> Handler: internal/handlers/auth.go:RefreshToken()
  │     - Validate refresh token signature
  │     - Check if token exists in users_auth table
  │     - Verify token not expired
  │
  ├─5─> Generate new access token
  │     - Same user_id
  │     - New expiration (24 hours)
  │
  ├─6─> Return JSON:
  │     {
  │       "access_token": "new_jwt..."
  │     }
  │
[Axios Response Interceptor]
  │
  ├─7─> Update NextAuth session with new access token
  │
  ├─8─> Retry original failed request with new token
  │
  └─9─> Return response to caller (transparent to user)
```

---

### 4. OAuth Login Flow

```
[User]
  │
  ├─1─> Click "Sign in with Google"
  │
[Next.js Frontend]
  │
  ├─2─> NextAuth initiates OAuth flow
  │     signIn('google')
  │
  ├─3─> Redirect to Google OAuth
  │
[Google]
  │
  ├─4─> User authorizes app
  │
  ├─5─> Redirect back with authorization code
  │
[Next.js Frontend]
  │
  ├─6─> NextAuth exchanges code for user info
  │     - email, name, image from Google
  │
  ├─7─> POST /api/oauth
  │     {
  │       "provider": "google",
  │       "email": "user@gmail.com",
  │       "name": "John Doe",
  │       "avatar_url": "https://..."
  │     }
  │
[Go Backend]
  │
  ├─8─> Handler: internal/handlers/auth.go:OAuthLogin()
  │     - Check if user exists (by email)
  │     - If not, create user
  │     - Create/update users_auth record with provider
  │
  ├─9─> Repository operations:
  │     - INSERT INTO users (email, name) ...
  │     - INSERT INTO users_auth (user_id, provider, email) ...
  │
  ├─10─> Generate JWT tokens
  │
  ├─11─> Return JSON:
  │      {
  │        "user": {...},
  │        "access_token": "jwt...",
  │        "refresh_token": "jwt..."
  │      }
  │
[Next.js Frontend]
  │
  ├─12─> NextAuth stores tokens in session
  │
[User]
  │
  └─13─> Logged in, redirected to dashboard
```

---

## Integration Points

### 1. Authentication Integration

#### NextAuth Configuration

**File:** `frontend/src/auth.ts`

```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    // Credentials provider → Backend /api/login
    CredentialsProvider({
      async authorize(credentials) {
        const response = await axios.post('/api/login', {
          email: credentials.email,
          password: credentials.password
        })

        if (response.data.access_token) {
          return {
            id: response.data.user.id,
            email: response.data.user.email,
            name: response.data.user.name,
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token
          }
        }
        return null
      }
    }),

    // GitHub OAuth
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET
    }),

    // Google OAuth
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET
    })
  ],

  callbacks: {
    // Store tokens in JWT
    async jwt({ token, user, account }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        // OAuth flow → Call backend /api/oauth
        const response = await axios.post('/api/oauth', {
          provider: account.provider,
          email: user.email,
          name: user.name,
          avatar_url: user.image
        })

        token.accessToken = response.data.access_token
        token.refreshToken = response.data.refresh_token
        token.user = response.data.user
      } else if (user) {
        // Credentials provider
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.user = user
      }

      return token
    },

    // Expose session to client
    async session({ session, token }) {
      session.user = token.user
      session.accessToken = token.accessToken
      return session
    }
  }
}
```

### 2. API Client Integration

#### Axios Configuration

**File:** `frontend/src/lib/axios.ts`

```typescript
import axios from 'axios'
import { getSession } from 'next-auth/react'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // http://localhost:8081
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request Interceptor: Inject JWT token
apiClient.interceptors.request.use(async (config) => {
  const session = await getSession()

  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }

  return config
})

// Response Interceptor: Handle 401, refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const session = await getSession()

      if (session?.refreshToken) {
        try {
          // Call backend to refresh token
          const response = await axios.post('/api/refresh_token', {
            refresh_token: session.refreshToken
          })

          const newAccessToken = response.data.access_token

          // Update session (implementation varies)
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return apiClient(originalRequest)
        } catch (refreshError) {
          // Refresh failed, logout user
          signOut()
          return Promise.reject(refreshError)
        }
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
```

### 3. Backend CORS Configuration

**File:** `backend/cmd/server/main.go`

```go
r.Use(cors.New(cors.Config{
    AllowOrigins: []string{
        "http://localhost:8080",  // Frontend dev server
        "http://localhost:8082",  // Alternative port
        "http://localhost:3000",  // Default Next.js port
    },
    AllowMethods: []string{
        "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS",
    },
    AllowHeaders: []string{
        "Origin",
        "Content-Type",
        "Accept",
        "Authorization",
        "X-CSRF-Token",
    },
    ExposeHeaders: []string{
        "Content-Length",
        "X-CSRF-Token",
    },
    AllowCredentials: true,
    MaxAge: 12 * time.Hour,
}))
```

---

## API Response Standardization

### Backend Response Format

All backend endpoints return a consistent `ApiResponse` envelope:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "warnings": ["optional warning messages"]
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "error": "Human-readable message",
    "code": "ERROR_CODE",
    "details": ["additional context"],
    "field_errors": { "field_name": "error message" }
  }
}
```

**Error codes:** `INVALID_CREDENTIALS`, `VALIDATION_FAILED`, `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `EMAIL_ALREADY_EXISTS`, `QUOTA_EXCEEDED`, `INTERNAL_SERVER_ERROR`, `DATABASE_ERROR`, `TIMEOUT_ERROR`, `NETWORK_FAILURE`, and more (20 total).

### Frontend Error Handling

**File:** `frontend/src/lib/errors.ts`

```typescript
// Maps backend error codes to user-friendly messages
getErrorMessage(error)     // Extract user-friendly message from AxiosError
getErrorDetails(error)     // Extract error details array
isValidationError(error)   // Check for field-level validation errors
getFieldErrors(error)      // Extract field errors for form display
```

The axios client also provides automatic error handling:
- **401 errors:** Queues failed requests, refreshes token, retries
- **403 CSRF errors:** Clears CSRF token for re-fetch
- **5xx errors:** Retries up to 3 times with exponential backoff
- **Validation errors:** Displays toast notification (suppressible)

---

## Environment Configuration

### Frontend (.env.local)

```bash
# Backend API base URL
NEXT_PUBLIC_API_URL=http://localhost:8081

# NextAuth
NEXTAUTH_URL=http://localhost:8080
AUTH_SECRET=your-secret-here

# OAuth providers (optional)
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

### Backend (.env)

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=ditto_user
DB_PASSWORD=ditto_password
DB_NAME=ditto_dev
DB_SSLMODE=disable

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Server
PORT=8081

# File storage
AWS_REGION=us-east-1
AWS_S3_BUCKET=ditto-files-local
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_ENDPOINT=http://localhost:4566
```

---

## Security Considerations

### 1. CORS Security

- **Development:** Allows `localhost:8080`, `8082`, `3000`
- **Production:** Must restrict to actual domain only
- **Credentials:** `AllowCredentials: true` required for cookies/auth

### 2. JWT + CSRF Security

- **Storage:** Never store in localStorage (XSS risk)
- **NextAuth:** Stores in httpOnly cookies (secure)
- **Transmission:** Always use HTTPS in production
- **Access Token TTL:** 24 hours
- **Refresh Token TTL:** 7 days
- **CSRF:** Token-based protection on all mutating requests (POST/PUT/PATCH/DELETE)

### 3. User Data Security

- **Backend:** All queries filtered by `user_id` from JWT
- **Frontend:** Session provides user context
- **Validation:** Both frontend and backend validate inputs

---

## Performance Optimizations

### 1. Request Batching

Consider implementing GraphQL or custom batching endpoint for:
- Dashboard data (jobs + applications + stats)
- Application details (application + job + company)

### 2. Caching

**Backend:**
- Cache application statuses (rarely change)
- Implement HTTP ETag headers

**Frontend:**
- NextAuth caches session
- Consider SWR or React Query for data caching

### 3. Pagination

All list endpoints support pagination:
- `?page=1&limit=50`
- `?offset=0&limit=100`

---

## Monitoring & Debugging

### Frontend Debugging

```typescript
// Enable axios request/response logging
apiClient.interceptors.request.use((config) => {
  console.log('API Request:', config.method, config.url, config.data)
  return config
})

apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data)
    return response
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data)
    return Promise.reject(error)
  }
)
```

### Backend Debugging

```go
// Gin logs all requests by default in debug mode
GIN-debug] [2025-11-08 12:00:00] GET /api/jobs 200 12.345ms
```

---

## Integration Testing

### Frontend → Backend Integration Test

```typescript
// Example: Login integration test
describe('Authentication Integration', () => {
  it('should login and receive JWT tokens', async () => {
    const response = await apiClient.post('/api/login', {
      email: 'test@example.com',
      password: 'password123'
    })

    expect(response.status).toBe(200)
    expect(response.data.access_token).toBeDefined()
    expect(response.data.refresh_token).toBeDefined()
    expect(response.data.user.email).toBe('test@example.com')
  })
})
```

### Backend API Integration Test

**File:** `backend/test_api.sh`

Tests complete workflows including frontend scenarios.

---

## Troubleshooting

### Common Issues

1. **CORS Error:**
   - Check backend allows frontend origin
   - Verify `AllowCredentials: true`
   - Check Authorization header in `AllowHeaders`

2. **401 Unauthorized:**
   - Check JWT token in Authorization header
   - Verify token not expired
   - Check backend JWT secret matches

3. **Token Refresh Loop:**
   - Ensure refresh token is valid
   - Check `_retry` flag in axios interceptor
   - Verify refresh endpoint returns new access token

4. **OAuth Not Working:**
   - Verify OAuth provider credentials
   - Check callback URL configuration
   - Ensure backend `/api/oauth` endpoint works

---

## Future Enhancements

### Planned

- [ ] WebSocket integration for real-time updates
- [ ] GraphQL API for more efficient data fetching
- [ ] Request caching with SWR or React Query
- [ ] Optimistic UI updates
- [ ] Offline support (PWA)

### Scalability

- **Load Balancer:** Multiple backend instances behind LB
- **API Gateway:** Rate limiting, request routing
- **CDN:** Serve frontend from edge locations
- **Database:** Read replicas for scalability

---

## Summary

The Ditto frontend-backend integration is built on:

1. **REST API** - Clean, RESTful endpoints
2. **JWT Authentication** - Secure token-based auth with refresh
3. **NextAuth v5** - Seamless auth management
4. **Axios** - Configured HTTP client with interceptors
5. **CORS** - Proper cross-origin configuration
6. **Standardized Responses** - Consistent error handling
7. **User Scoping** - All data filtered by authenticated user

This architecture provides a solid foundation for a scalable, secure, and maintainable application.

---

**Updated:** 2026-02-20
