---
sidebar_position: 3
title: Middleware
description: Request/response interception and transformation pipeline
---

# Middleware System

Middleware functions intercept requests before and after execution, allowing you to transform parameters, add headers, handle errors, or implement retry logic globally across all API endpoints.

---

## Middleware Fundamentals

Middleware follows a **pipeline pattern** where each middleware receives control, can perform side effects, calls `next()` to pass to the next middleware, and can transform the result before returning.

### Type Definition

```typescript
export type ApiMiddleware = (
  ctx: MiddlewareContext,
  next: () => Promise<{ data?: any; error?: any }>
) => Promise<{ data?: any; error?: any }>

type MiddlewareContext = {
  arg: any       // Query arguments passed to baseQuery
  def: any       // Endpoint definition
  get: any       // Get store state
  set: any       // Update store state
}
```

### Simple Example

```typescript
const logMiddleware: ApiMiddleware = async (ctx, next) => {
  console.log('Request:', ctx.arg)
  const start = Date.now()

  const result = await next()

  console.log('Response time:', Date.now() - start, 'ms')
  return result
}

const api = createApi({
  baseQuery: myBaseQuery,
  middlewares: [logMiddleware],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => ({ url: '/users' })
    })
  })
})
```

---

## Real-World Middleware Examples

### 1. Authentication Middleware

Automatically inject bearer tokens and handle token expiration:

```typescript
const authMiddleware: ApiMiddleware = async (ctx, next) => {
  // Initialize headers if not present
  if (!ctx.arg.headers) {
    ctx.arg.headers = {}
  }

  // Get token from secure storage
  const token = localStorage.getItem('authToken')
  const expiresAt = localStorage.getItem('tokenExpiresAt')

  // Check if token is expired
  if (expiresAt && Date.now() > parseInt(expiresAt)) {
    // Token expired, clear it
    localStorage.removeItem('authToken')
    localStorage.removeItem('tokenExpiresAt')
    window.location.href = '/login'
    return { error: 'Token expired' }
  }

  // Add valid token to request
  if (token) {
    ctx.arg.headers.Authorization = `Bearer ${token}`
  }

  // Execute the request
  const result = await next()

  // Handle 401 Unauthorized responses
  if (result.error?.status === 401) {
    // Clear invalid token
    localStorage.removeItem('authToken')
    localStorage.removeItem('tokenExpiresAt')
    
    // Redirect to login
    window.location.href = '/login'
  }

  return result
}

// Usage
const api = createApi({
  baseQuery: myBaseQuery,
  middlewares: [authMiddleware],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => ({ url: '/users' })
    })
  })
})
```

### 2. Request Normalization Middleware

Add consistent headers and metadata to every request:

```typescript
const requestNormalizationMiddleware: ApiMiddleware = async (ctx, next) => {
  // Ensure headers object exists
  if (!ctx.arg.headers) {
    ctx.arg.headers = {}
  }

  // Add standard headers
  ctx.arg.headers['Content-Type'] = 'application/json'
  ctx.arg.headers['Accept'] = 'application/json'

  // Add request tracking ID
  ctx.arg.headers['X-Request-ID'] = crypto.randomUUID()

  // Add timestamp
  ctx.arg.headers['X-Timestamp'] = new Date().toISOString()

  // Add app version
  ctx.arg.headers['X-App-Version'] = '1.0.0'

  // Add client info
  ctx.arg.headers['X-Client'] = 'web'

  // Ensure URL has API version prefix
  if (ctx.arg.url && !ctx.arg.url.includes('/api/v')) {
    ctx.arg.url = `/api/v1${ctx.arg.url}`
  }

  // Execute request with normalized headers
  return await next()
}
```

### 3. Automatic Retry with Exponential Backoff

Implement resilient error recovery:

```typescript
const retryMiddleware: ApiMiddleware = async (ctx, next) => {
  const MAX_RETRIES = 3
  const BASE_DELAY = 1000 // 1 second

  let lastError

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const result = await next()

    // Success - return immediately
    if (!result.error) {
      return result
    }

    // Don't retry client errors (4xx)
    if (result.error?.status >= 400 && result.error?.status < 500) {
      return result
    }

    // Don't retry last attempt
    if (attempt === MAX_RETRIES - 1) {
      return result
    }

    lastError = result.error

    // Calculate exponential backoff delay
    const delay = BASE_DELAY * Math.pow(2, attempt)
    console.log(
      `⏳ Retry attempt ${attempt + 1}/${MAX_RETRIES} in ${delay}ms`
    )

    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  return { error: lastError }
}
```

### 4. Request Deduplication Middleware

Prevent duplicate concurrent requests for the same endpoint:

```typescript
const deduplicationMiddleware: ApiMiddleware = (() => {
  // Track pending requests
  const pendingRequests = new Map<
    string,
    Promise<{ data?: any; error?: any }>
  >()

  return async (ctx, next) => {
    // Create unique key from URL and method
    const requestKey = JSON.stringify({
      url: ctx.arg.url,
      method: ctx.arg.method || 'GET',
      // Include body in key for POST/PUT requests
      ...(ctx.arg.body && { body: ctx.arg.body })
    })

    // If request is already pending, return existing promise
    if (pendingRequests.has(requestKey)) {
      console.log('⚡ Deduped request:', requestKey)
      return pendingRequests.get(requestKey)!
    }

    // Create new request
    const promise = next()

    // Store promise while pending
    pendingRequests.set(requestKey, promise)

    try {
      const result = await promise
      return result
    } finally {
      // Remove from pending after completion
      pendingRequests.delete(requestKey)
    }
  }
})()
```

### 5. Rate Limiting Middleware

Throttle requests to respect API rate limits:

```typescript
const rateLimitMiddleware: ApiMiddleware = (() => {
  let requestCount = 0
  let windowStart = Date.now()
  const MAX_REQUESTS_PER_MINUTE = 60
  const WINDOW_SIZE = 60000 // 1 minute

  return async (ctx, next) => {
    const now = Date.now()
    const windowElapsed = now - windowStart

    // Reset window if time elapsed
    if (windowElapsed > WINDOW_SIZE) {
      requestCount = 0
      windowStart = now
      console.log(' Rate limit window reset')
    }

    // Check if at limit
    if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
      const waitTime = WINDOW_SIZE - windowElapsed
      console.log(
        `⏸️  Rate limit reached. Waiting ${waitTime}ms...`
      )
      await new Promise(resolve => setTimeout(resolve, waitTime))
      requestCount = 0
      windowStart = Date.now()
    }

    // Increment counter and execute
    requestCount++
    return await next()
  }
})()
```

### 6. Request Timeout Middleware

Add timeout protection to prevent hanging requests:

```typescript
const timeoutMiddleware: ApiMiddleware = async (ctx, next) => {
  const TIMEOUT = 30000 // 30 seconds

  return Promise.race([
    next(),
    new Promise<{ error: string }>((resolve) =>
      setTimeout(
        () => {
          console.error('⏱️  Request timeout:', ctx.arg.url)
          resolve({ error: 'Request timeout' })
        },
        TIMEOUT
      )
    ),
  ])
}
```

### 7. Response Caching Middleware

Implement custom caching logic beyond built-in caching:

```typescript
const cacheMiddleware: ApiMiddleware = (() => {
  const cache = new Map<string, { data: any; time: number }>()
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  return async (ctx, next) => {
    const cacheKey = JSON.stringify({ url: ctx.arg.url, method: ctx.arg.method })

    // Only cache GET requests
    if (ctx.arg.method && ctx.arg.method !== 'GET') {
      return await next()
    }

    // Check cache
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.time < CACHE_DURATION) {
      console.log('💾 Cache hit:', cacheKey)
      return { data: cached.data }
    }

    // Fetch fresh data
    const result = await next()

    // Cache successful responses
    if (!result.error) {
      cache.set(cacheKey, { data: result.data, time: Date.now() })
      console.log('💾 Cached response:', cacheKey)
    }

    return result
  }
})()
```

### 8. Error Transformation Middleware

Normalize errors to consistent format:

```typescript
const errorTransformMiddleware: ApiMiddleware = async (ctx, next) => {
  const result = await next()

  if (result.error) {
    // Transform various error formats to consistent structure
    const normalizedError = {
      message: result.error?.message || 'Unknown error',
      status: result.error?.status || 500,
      endpoint: ctx.arg.url,
      timestamp: new Date().toISOString(),
      requestId: ctx.arg.headers?.['X-Request-ID'] || 'unknown'
    }

    return { error: normalizedError }
  }

  return result
}
```

---

## Middleware Pipeline Order

The order of middleware matters - they execute sequentially:

```typescript
const api = createApi({
  baseQuery: myBaseQuery,
  middlewares: [
    // 1. Auth first - all requests need auth
    authMiddleware,
    
    // 2. Normalize requests - add headers
    requestNormalizationMiddleware,
    
    // 3. Dedupe - prevent duplicate requests
    deduplicationMiddleware,
    
    // 4. Rate limit - throttle if needed
    rateLimitMiddleware,
    
    // 5. Timeout - protect from hanging
    timeoutMiddleware,
    
    // 6. Retry - recover from failures
    retryMiddleware,
  ],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => ({ url: '/users' })
    })
  })
})
```

### Execution Flow

```
Request comes in
    ↓
authMiddleware (checks token) → call next()
    ↓
requestNormalizationMiddleware (adds headers) → call next()
    ↓
deduplicationMiddleware (checks cache) → call next()
    ↓
rateLimitMiddleware (checks limit) → call next()
    ↓
timeoutMiddleware (sets timeout) → call next()
    ↓
retryMiddleware (executes with retry) → call next()
    ↓
baseQuery executes (actual HTTP request)
    ↓
Response flows back through middleware in reverse order
```

---

## Production Example

Complete middleware setup for production application:

```typescript
import { createApi } from 'zustic/query'

interface User {
  id: number
  name: string
  email: string
}

// ============ Middleware Stack ============

const authMiddleware: ApiMiddleware = async (ctx, next) => {
  const token = localStorage.getItem('authToken')
  if (token && ctx.arg.headers) {
    ctx.arg.headers.Authorization = `Bearer ${token}`
  }
  
  const result = await next()
  
  if (result.error?.status === 401) {
    localStorage.removeItem('authToken')
    window.location.href = '/login'
  }
  
  return result
}

const requestNormalizationMiddleware: ApiMiddleware = async (ctx, next) => {
  if (!ctx.arg.headers) {
    ctx.arg.headers = {}
  }
  
  ctx.arg.headers['X-Request-ID'] = crypto.randomUUID()
  ctx.arg.headers['X-Timestamp'] = new Date().toISOString()
  
  return await next()
}

const retryMiddleware: ApiMiddleware = async (ctx, next) => {
  for (let i = 0; i < 3; i++) {
    const result = await next()
    
    if (!result.error || result.error.status < 500) {
      return result
    }
    
    if (i < 2) {
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000))
    }
  }
  
  return await next()
}

// ============ API Setup ============

export const api = createApi({
  baseQuery: async (params) => {
    try {
      const res = await fetch(
        `https://api.example.com${params.url}`,
        {
          method: params.method || 'GET',
          headers: params.headers || {},
          body: params.body ? JSON.stringify(params.body) : undefined,
        }
      )

      if (!res.ok) {
        return { error: { status: res.status, message: res.statusText } }
      }

      return { data: await res.json() }
    } catch (error) {
      return { error: { status: 0, message: String(error) } }
    }
  },

  cacheTimeout: 5 * 60 * 1000,
  
  middlewares: [
    authMiddleware,
    requestNormalizationMiddleware,
    retryMiddleware,
  ],

  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => ({ url: '/users' }),
    }),

    getUser: builder.query({
      query: (id: number) => ({ url: `/users/${id}` }),
    }),

    createUser: builder.mutation({
      query: (user: Omit<User, 'id'>) => ({
        url: '/users',
        method: 'POST',
        body: user,
      }),
    }),

    updateUser: builder.mutation({
      query: ({ id, data }: { id: number; data: Partial<User> }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
    }),

    deleteUser: builder.mutation({
      query: (id: number) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
    }),
  }),
})

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = api
```

### Using in React Component

```tsx
import { useGetUsersQuery, useCreateUserMutation } from './api'

export function UserManagement() {
  // Auth middleware adds token automatically
  // Retry middleware handles transient failures
  // Request normalization adds tracking ID
  const { data: users, isLoading, error } = useGetUsersQuery()

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation()

  const handleCreate = async () => {
    const result = await createUser({
      name: 'John Doe',
      email: 'john@example.com',
    })

    if (!result.error) {
      console.log(' User created:', result.data)
    }
  }

  if (isLoading) return <div>Loading users...</div>
  if (error) return <div>Error loading users</div>

  return (
    <div>
      <button onClick={handleCreate} disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Create User'}
      </button>

      <table>
        <tbody>
          {users?.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

## Best Practices

###  Do's

- **Order matters** — Put auth first, retry last
- **Always call next()** — Unless you want to short-circuit
- **Keep middleware focused** — One concern per middleware
- **Handle errors gracefully** — Provide fallbacks
- **Log for debugging** — Include meaningful messages
- **Test in isolation** — Test each middleware independently

###  Don'ts

- **Don't forget to return** — Always return the result
- **Don't block indefinitely** — Use timeouts
- **Don't mutate arguments** — Clone if needed
- **Don't ignore error responses** — Handle them explicitly
- **Don't create new instances** — Use closures for state
- **Don't use for business logic** — Use plugins or query-level hooks

---

## Advanced Patterns

### Conditional Middleware

Apply middleware only to specific request types:

```typescript
const selectiveMiddleware: ApiMiddleware = async (ctx, next) => {
  // Only apply to mutations (POST, PUT, DELETE)
  const isMutation = ['POST', 'PUT', 'DELETE'].includes(ctx.arg.method)
  
  if (!isMutation) {
    return await next()
  }

  // Add special handling only for writes
  console.log('📝 Write operation:', ctx.arg.url)
  return await next()
}
```

### Middleware with State

Access and update API state:

```typescript
const stateMiddleware: ApiMiddleware = async (ctx, next) => {
  // Get current store state
  const currentState = ctx.get()
  console.log('Current state:', currentState)

  const result = await next()

  // Update store state if needed
  if (!result.error) {
    ctx.set({ lastUpdated: Date.now() })
  }

  return result
}
```
