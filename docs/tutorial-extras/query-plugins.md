---
sidebar_position: 4
title: Plugins
description: Lifecycle hooks and side-effect management
---

# Plugin System

Plugins extend Zustic Query with lifecycle hooks for side effects like logging, analytics, error tracking, and custom state management. Plugins can also include middleware for advanced control.

---

## Plugin Fundamentals

Plugins provide hooks into the query lifecycle to perform side effects and reactions without modifying core query logic.

### Type Definition

```typescript
export type ApiPlugin = {
  name: string

  // Called once when API is created
  onInit?: (api: {
    baseQuery: any
    endpoints: any
  }) => void

  // Before query execution
  beforeQuery?: (ctx: PluginContext) => void | Promise<void>

  // Middleware-level control (optional)
  middleware?: ApiMiddleware

  // After successful execution
  afterQuery?: (
    result: any,
    ctx: PluginContext
  ) => void | Promise<void>

  // Global error handler
  onError?: (
    error: any,
    ctx: PluginContext
  ) => void | Promise<void>
}

type PluginContext = {
  arg: any       // Query arguments
  def: any       // Endpoint definition
  get: any       // Get store state
  set: any       // Update store state
}
```

### Simple Example

```typescript
const helloPlugin: ApiPlugin = {
  name: 'hello',

  onInit: (api) => {
    console.log(' Hello plugin initialized')
  },

  beforeQuery: (ctx) => {
    console.log(' Query starting:', ctx.def.endpoint)
  },

  afterQuery: (result, ctx) => {
    console.log(' Query completed:', ctx.def.endpoint)
  },

  onError: (error, ctx) => {
    console.error(' Query error:', ctx.def.endpoint, error)
  },
}

const api = createApi({
  baseQuery: myBaseQuery,
  plugins: [helloPlugin],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => ({ url: '/users' })
    })
  })
})
```

---

## Real-World Plugin Examples

### 1. Comprehensive Logging Plugin

Track all query activity for debugging:

```typescript
const loggingPlugin: ApiPlugin = {
  name: 'logging',

  onInit: (api) => {
    console.log(
      '%c🚀 Logging plugin initialized',
      'color: green; font-weight: bold'
    )
    console.log('Endpoints:', Object.keys(api.endpoints))
  },

  beforeQuery: (ctx) => {
    console.log(
      `%c[${ctx.def.endpoint}]%c Starting query`,
      'color: blue; font-weight: bold',
      'color: gray'
    )
    console.log('Arguments:', ctx.arg)
    console.log('Timestamp:', new Date().toISOString())
  },

  afterQuery: (result, ctx) => {
    console.log(
      `%c[${ctx.def.endpoint}]%c Success`,
      'color: green; font-weight: bold',
      'color: gray'
    )
    if (result.data) {
      console.log('Response:', result.data)
    }
    console.log('Timestamp:', new Date().toISOString())
  },

  onError: (error, ctx) => {
    console.error(
      `%c[${ctx.def.endpoint}]%c Error`,
      'color: red; font-weight: bold',
      'color: gray'
    )
    console.error('Error:', error)
    console.error('Arguments:', ctx.arg)
    console.error('Timestamp:', new Date().toISOString())
  },
}
```

### 2. Analytics Plugin

Send usage events to analytics service:

```typescript
const analyticsPlugin: ApiPlugin = {
  name: 'analytics',

  beforeQuery: (ctx) => {
    // Track query execution
    if (window.gtag) {
      window.gtag('event', 'api_query', {
        endpoint: ctx.def.endpoint,
        method: ctx.arg.method || 'GET',
        timestamp: Date.now(),
      })
    }

    // Also track with custom analytics
    if (window.analytics) {
      window.analytics.track('API Query', {
        endpoint: ctx.def.endpoint,
        type: ctx.def.type, // 'query' or 'mutation'
      })
    }
  },

  afterQuery: (result, ctx) => {
    // Track successful queries
    if (window.gtag) {
      window.gtag('event', 'api_success', {
        endpoint: ctx.def.endpoint,
        responseSize: JSON.stringify(result.data).length,
        timestamp: Date.now(),
      })
    }
  },

  onError: (error, ctx) => {
    // Track errors
    if (window.gtag) {
      window.gtag('event', 'api_error', {
        endpoint: ctx.def.endpoint,
        errorMessage: error?.message,
        errorStatus: error?.status,
        timestamp: Date.now(),
      })
    }

    // Send to custom error tracking
    if (window.errorReporter) {
      window.errorReporter.captureException(error, {
        tags: { endpoint: ctx.def.endpoint },
      })
    }
  },
}
```

### 3. Error Tracking Plugin (Sentry Integration)

Send production errors to monitoring service:

```typescript
const sentryPlugin: ApiPlugin = {
  name: 'sentry',

  onError: (error, ctx) => {
    // Only capture server errors (5xx)
    if (error?.status && error.status >= 500) {
      if (window.Sentry) {
        window.Sentry.captureException(error, {
          level: 'error',
          tags: {
            service: 'api',
            endpoint: ctx.def.endpoint,
            method: ctx.arg.method,
          },
          extra: {
            arguments: ctx.arg,
            errorStatus: error.status,
            timestamp: new Date().toISOString(),
          },
        })
      }
    }

    // Log client errors separately
    if (error?.status && error.status >= 400 && error.status < 500) {
      console.warn('Client error:', {
        status: error.status,
        endpoint: ctx.def.endpoint,
      })
    }
  },
}
```

### 4. State Persistence Plugin

Auto-save and restore query results:

```typescript
const persistencePlugin: ApiPlugin = {
  name: 'persistence',

  onInit: (api) => {
    console.log('📦 Restoring persisted state...')
    
    // Restore all persisted queries on app init
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('query_')) {
        try {
          const cached = JSON.parse(localStorage.getItem(key)!)
          const endpoint = key.replace('query_', '')
          console.log(
            ` Restored ${endpoint} from localStorage`,
            cached.data
          )
        } catch (e) {
          console.error(`Failed to restore ${key}`, e)
        }
      }
    })
  },

  afterQuery: (result, ctx) => {
    // Only persist successful responses
    if (!result.error && ctx.def.persist !== false) {
      const key = `query_${ctx.def.endpoint}`

      try {
        localStorage.setItem(
          key,
          JSON.stringify({
            data: result.data,
            timestamp: Date.now(),
            endpoint: ctx.def.endpoint,
          })
        )
        console.log(`💾 Persisted ${ctx.def.endpoint}`)
      } catch (e) {
        // Handle quota exceeded
        console.error('Storage quota exceeded', e)
      }
    }
  },

  onError: (error, ctx) => {
    // Clear corrupted cache on error
    const key = `query_${ctx.def.endpoint}`
    localStorage.removeItem(key)
    console.log(`🗑️  Cleared cached ${ctx.def.endpoint}`)
  },
}
```

### 5. Performance Monitoring Plugin

Track query performance metrics:

```typescript
const performancePlugin: ApiPlugin = {
  name: 'performance',

  beforeQuery: (ctx) => {
    // Mark start time
    const startMark = `${ctx.def.endpoint}_start`
    performance.mark(startMark)
  },

  afterQuery: (result, ctx) => {
    // Measure time
    const startMark = `${ctx.def.endpoint}_start`
    const endMark = `${ctx.def.endpoint}_end`

    performance.mark(endMark)
    performance.measure(
      `query_${ctx.def.endpoint}`,
      startMark,
      endMark
    )

    const measure = performance.getEntriesByName(
      `query_${ctx.def.endpoint}`
    )[0] as any

    console.log(
      `⏱️  ${ctx.def.endpoint}: ${measure.duration.toFixed(2)}ms`
    )

    // Send to monitoring
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        custom_metric_duration: measure.duration,
        custom_metric_endpoint: ctx.def.endpoint,
      })
    }
  },

  onError: (error, ctx) => {
    // Clear marks on error
    performance.clearMarks(`${ctx.def.endpoint}_start`)
    performance.clearMarks(`${ctx.def.endpoint}_end`)
  },
}
```

### 6. DevTools Integration Plugin

Enable debugging with browser developer tools:

```typescript
const devtoolsPlugin: ApiPlugin = {
  name: 'devtools',

  onInit: (api) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        '%c🔧 Query DevTools available',
        'color: purple; font-weight: bold'
      )
      // Store reference for debugging
      ;(window as any).__ZUSTIC_QUERY__ = {
        api,
        queries: new Map(),
        mutations: new Map(),
      }
    }
  },

  beforeQuery: (ctx) => {
    if ((window as any).__ZUSTIC_QUERY__) {
      const store = (window as any).__ZUSTIC_QUERY__
      const key = `${ctx.def.endpoint}_${Date.now()}`
      store.queries.set(key, {
        endpoint: ctx.def.endpoint,
        arguments: ctx.arg,
        startTime: Date.now(),
      })
    }
  },

  afterQuery: (result, ctx) => {
    if ((window as any).__ZUSTIC_QUERY__) {
      const store = (window as any).__ZUSTIC_QUERY__
      store.lastResult = {
        endpoint: ctx.def.endpoint,
        data: result.data,
        timestamp: Date.now(),
      }
    }
  },
}
```

### 7. User Feedback Plugin

Collect user feedback on API issues:

```typescript
const feedbackPlugin: ApiPlugin = {
  name: 'feedback',

  onError: (error, ctx) => {
    // Only show feedback prompt for significant errors
    if (error?.status === 500 || error?.status === 503) {
      const userEmail = localStorage.getItem('userEmail')
      
      if (confirm('An error occurred. Would you like to report it?')) {
        // Send feedback
        fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: ctx.def.endpoint,
            error: error?.message,
            timestamp: new Date().toISOString(),
            userEmail,
          }),
        }).catch(console.error)
      }
    }
  },
}
```

### 8. Request/Response Transformation Plugin

Transform data between API and app formats:

```typescript
const transformPlugin: ApiPlugin = {
  name: 'transform',

  afterQuery: (result, ctx) => {
    // Transform snake_case API responses to camelCase
    if (result.data && ctx.def.transformResponse) {
      result.data = ctx.def.transformResponse(result.data)
    }

    // Format dates
    if (result.data) {
      walkObject(result.data, (obj, key, value) => {
        if (key.includes('date') && typeof value === 'string') {
          obj[key] = new Date(value)
        }
      })
    }
  },
}

function walkObject(obj: any, callback: Function) {
  Object.keys(obj).forEach(key => {
    const value = obj[key]
    callback(obj, key, value)
    
    if (typeof value === 'object' && value !== null) {
      walkObject(value, callback)
    }
  })
}
```

---

## Plugin with Middleware

Plugins can include middleware for fine-grained request control:

```typescript
const advancedPlugin: ApiPlugin = {
  name: 'advanced',

  middleware: async (ctx, next) => {
    console.log('Middleware running in plugin')
    return await next()
  },

  beforeQuery: (ctx) => {
    console.log('Before hook')
  },

  afterQuery: (result, ctx) => {
    console.log('After hook')
  },
}

const api = createApi({
  baseQuery: myBaseQuery,
  plugins: [advancedPlugin],
  endpoints: (builder) => ({ /* ... */ })
})
```

---

## Production Example

Complete plugin setup for production:

```typescript
import { createApi } from 'zustic/query'

interface User {
  id: number
  name: string
  email: string
}

// ============ Plugins ============

const loggingPlugin: ApiPlugin = {
  name: 'logging',
  beforeQuery: (ctx) => {
    console.log(`[${ctx.def.endpoint}] Starting`)
  },
  afterQuery: (result, ctx) => {
    console.log(`[${ctx.def.endpoint}] Success`)
  },
  onError: (error, ctx) => {
    console.error(`[${ctx.def.endpoint}] Error:`, error)
  },
}

const analyticsPlugin: ApiPlugin = {
  name: 'analytics',
  beforeQuery: (ctx) => {
    if (window.gtag) {
      window.gtag('event', 'api_query', {
        endpoint: ctx.def.endpoint,
      })
    }
  },
}

const sentryPlugin: ApiPlugin = {
  name: 'sentry',
  onError: (error, ctx) => {
    if (error?.status >= 500 && window.Sentry) {
      window.Sentry.captureException(error, {
        tags: { endpoint: ctx.def.endpoint },
      })
    }
  },
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
        return { error: { status: res.status } }
      }

      return { data: await res.json() }
    } catch (error) {
      return { error: { status: 0, message: String(error) } }
    }
  },

  cacheTimeout: 5 * 60 * 1000,

  plugins: [loggingPlugin, analyticsPlugin, sentryPlugin],

  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => ({ url: '/users' }),
    }),

    createUser: builder.mutation({
      query: (user: Omit<User, 'id'>) => ({
        url: '/users',
        method: 'POST',
        body: user,
      }),
    }),
  }),
})

export const { useGetUsersQuery, useCreateUserMutation } = api
```

### Using in React

```tsx
import { useGetUsersQuery, useCreateUserMutation } from './api'

export function App() {
  // Plugins automatically:
  // - Log all queries
  // - Send analytics events
  // - Track errors to Sentry
  const { data: users, isLoading } = useGetUsersQuery()
  const [createUser] = useCreateUserMutation()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {users?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  )
}
```

---

## Best Practices

###  Do's

- **Keep plugins focused** — One concern per plugin
- **Use for side effects** — Logging, analytics, tracking
- **Handle errors gracefully** — Don't throw
- **Make plugins optional** — Users should be able to disable them
- **Document plugin behavior** — Explain what it does
- **Test plugins independently** — Test each plugin separately

###  Don'ts

- **Don't modify core logic** — Use for side effects only
- **Don't throw errors** — Always handle gracefully
- **Don't make blocking operations** — Keep them async-aware
- **Don't assume other plugins** — Don't depend on execution order
- **Don't leak memory** — Clean up resources in errors
- **Don't hardcode config** — Make plugins configurable

---

## Advanced Patterns

### Conditional Plugins

Load plugins based on environment:

```typescript
const plugins =
  process.env.NODE_ENV === 'production'
    ? [loggingPlugin, analyticsPlugin, sentryPlugin]
    : [loggingPlugin, devtoolsPlugin]

const api = createApi({
  baseQuery: myBaseQuery,
  plugins,
  endpoints: (builder) => ({ /* ... */ }),
})
```

### Plugin with Configuration

Make plugins configurable:

```typescript
const createLoggingPlugin = (options: {
  verbose?: boolean
  filter?: (endpoint: string) => boolean
}): ApiPlugin => ({
  name: 'logging',
  beforeQuery: (ctx) => {
    if (options.filter && !options.filter(ctx.def.endpoint)) {
      return
    }

    if (options.verbose) {
      console.log('Full details:', ctx.arg)
    } else {
      console.log('Query:', ctx.def.endpoint)
    }
  },
})

const api = createApi({
  baseQuery: myBaseQuery,
  plugins: [
    createLoggingPlugin({ verbose: true, filter: (e) => !e.includes('health') }),
  ],
  endpoints: (builder) => ({ /* ... */ }),
})
```
