---
sidebar_position: 3
title: Middleware & Plugins
description: Extend Zustic Query with middleware and plugins
---

# Middleware & Plugins

Extend Zustic Query with custom middleware and plugins.

## Middleware System

Middleware runs in a pipeline and can transform requests/responses before reaching `baseQuery`.

### Middleware Signature

```typescript
type ApiMiddleware = (ctx: MiddlewareContext, next: () => Promise<any>) => Promise<any>

interface MiddlewareContext {
  arg: any                    // Query arguments
  def: any                    // Endpoint definition
  get: () => any              // Get current state
  set: (state: any) => void   // Update state
}
```

### Global Middleware

Apply middleware to all endpoints:

```typescript
import { createApi } from 'zustic/query'

// Authentication middleware
const authMiddleware = async (ctx, next) => {
  const token = localStorage.getItem('authToken')
  
  // Get query parameters
  const params = ctx.def.queryFn(ctx.arg)
  
  // Add auth header
  params.headers = {
    ...params.headers,
    Authorization: `Bearer ${token}`
  }
  
  // Update definition
  ctx.def.queryFn = () => params
  
  return next()
}

// Logging middleware
const loggingMiddleware = async (ctx, next) => {
  console.log('📤 Request:', ctx.arg)
  
  const result = await next()
  
  if (result.error) {
    console.error('❌ Error:', result.error)
  } else {
    console.log('📥 Response:', result.data)
  }
  
  return result
}

const api = createApi({
  baseQuery: myBaseQuery,
  middlewares: [authMiddleware, loggingMiddleware],
  endpoints: (builder) => ({
    getUser: builder.query({
      query: (id) => ({ url: `/users/${id}` })
    })
  })
})
```

### Endpoint-Specific Middleware

```typescript
endpoints: (builder) => ({
  getPublicData: builder.query({
    query: () => ({ url: '/public' })
    // Uses only global middleware
  }),

  getPrivateData: builder.query({
    query: () => ({ url: '/private' }),
    middlewares: [
      async (ctx, next) => {
        console.log('⭐ Fetching private data')
        return next()
      }
    ]
  })
})
```

## Plugin System

Plugins hook into query lifecycle events.

### Plugin Signature

```typescript
interface ApiPlugin {
  beforeQuery?: (ctx: PluginContext) => void | Promise<void>
  afterQuery?: (result: any, ctx: PluginContext) => void | Promise<void>
  onError?: (error: any, ctx: PluginContext) => void | Promise<void>
}

interface PluginContext {
  arg: any
  def: any
  get: () => any
  set: (state: any) => void
}
```

### Global Plugins

```typescript
// Devtools plugin
const devtoolsPlugin = {
  beforeQuery: (ctx) => {
    console.log('🔍 Query starting:', ctx.def.type, ctx.arg)
  },
  afterQuery: (result, ctx) => {
    console.log('✅ Query complete:', result)
  },
  onError: (error, ctx) => {
    console.error('⚠️ Query error:', error)
  }
}

// Analytics plugin
const analyticsPlugin = {
  beforeQuery: (ctx) => {
    analytics.track('query_started', { type: ctx.def.type })
  },
  afterQuery: (result, ctx) => {
    analytics.track('query_completed', { success: !result.error })
  }
}

// Notification plugin
const notificationPlugin = {
  beforeQuery: (ctx) => {
    if (ctx.def.type === 'mutation') {
      toast.loading('Processing...')
    }
  },
  afterQuery: (result, ctx) => {
    if (result.data && ctx.def.type === 'mutation') {
      toast.success('Success!')
    }
  },
  onError: (error, ctx) => {
    toast.error(`Error: ${error}`)
  }
}

const api = createApi({
  baseQuery: myBaseQuery,
  plugins: [devtoolsPlugin, analyticsPlugin, notificationPlugin],
  endpoints: (builder) => ({
    getUser: builder.query({
      query: (id) => ({ url: `/users/${id}` })
    })
  })
})
```

## Advanced Middleware Patterns

### Rate Limiting

```typescript
const rateLimitMiddleware = (() => {
  let lastCallTime = 0
  const minInterval = 500  // ms between requests

  return async (ctx, next) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTime

    if (timeSinceLastCall < minInterval) {
      await new Promise(r =>
        setTimeout(r, minInterval - timeSinceLastCall)
      )
    }

    lastCallTime = Date.now()
    return next()
  }
})()
```

### Request Deduplication

```typescript
const deduplicationMiddleware = (() => {
  const pendingRequests = new Map()

  return async (ctx, next) => {
    const key = JSON.stringify({ type: ctx.def.type, arg: ctx.arg })

    // Return existing request if duplicate
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key)
    }

    // Store this request
    const promise = next()
    pendingRequests.set(key, promise)

    // Clean up after completion
    return promise.finally(() => pendingRequests.delete(key))
  }
})()
```

### Request Transformation

```typescript
const transformMiddleware = async (ctx, next) => {
  const params = ctx.def.queryFn(ctx.arg)

  // Add common fields
  if (params.body) {
    params.body = {
      ...params.body,
      timestamp: new Date().toISOString(),
      version: 'v1'
    }
  }

  // Add headers
  params.headers = {
    'Content-Type': 'application/json',
    'X-Request-ID': crypto.randomUUID(),
    ...params.headers
  }

  ctx.def.queryFn = () => params
  return next()
}
```

## Response Transformation

Transform responses at endpoint level:

```typescript
endpoints: (builder) => ({
  getUser: builder.query({
    query: (id) => ({ url: `/users/${id}` }),

    // Transform successful response
    transformResponse: (data) => {
      return {
        ...data,
        name: data.name.toUpperCase(),
        joinedAt: new Date(data.createdAt)
      }
    },

    // Transform error
    transformError: (error) => {
      return `Custom error: ${error}`
    }
  })
})
```

## Complete Real-World Example

```typescript
import { createApi } from 'zustic/query'

// Middleware: Add authentication
const authMiddleware = async (ctx, next) => {
  const token = localStorage.getItem('token')
  const params = ctx.def.queryFn(ctx.arg)

  if (token) {
    params.headers = {
      ...params.headers,
      Authorization: `Bearer ${token}`
    }
  }

  ctx.def.queryFn = () => params
  return next()
}

// Plugin: Handle errors and auth failures
const errorHandlerPlugin = {
  onError: (error, ctx) => {
    if (error.includes('401')) {
      // Clear token and redirect to login
      localStorage.removeItem('token')
      window.location.href = '/login'
    } else if (error.includes('500')) {
      console.error('Server error:', error)
    }
  }
}

// Plugin: Show notifications
const notificationPlugin = {
  afterQuery: (result, ctx) => {
    if (ctx.def.type === 'mutation' && result.data) {
      console.log('✅ Mutation successful')
    }
  },
  onError: (error, ctx) => {
    console.log('❌ Error:', error)
  }
}

const api = createApi({
  baseQuery: async (params) => {
    try {
      const res = await fetch(`https://api.example.com${params.url}`, {
        method: params.method || 'GET',
        headers: params.headers,
        body: params.body ? JSON.stringify(params.body) : undefined
      })

      if (!res.ok) {
        return { error: `HTTP ${res.status}` }
      }

      return { data: await res.json() }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  clashTimeout: 5 * 60 * 1000,
  middlewares: [authMiddleware],
  plugins: [errorHandlerPlugin, notificationPlugin],

  endpoints: (builder) => ({
    getUser: builder.query({
      query: (id) => ({ url: `/users/${id}` })
    }),

    updateUser: builder.mutation({
      query: (user) => ({
        url: `/users/${user.id}`,
        method: 'PUT',
        body: user
      }),
      onSuccess: (data) => {
        console.log('User updated:', data)
      }
    })
  })
})

export const { useGetUserQuery, useUpdateUserMutation } = api
```

Next: [Advanced Features →](./query-advanced.md)
