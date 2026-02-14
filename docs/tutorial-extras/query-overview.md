---
sidebar_position: 1
title: Query API Overview
description: Lightweight server state management built on Zustic Core
---

# Query API Overview

Zustic Query is a minimal yet powerful server state management library. Built on top of Zustic Core, it provides automatic caching, middleware pipelines, and plugin hooks for complete control over your data-fetching layer.

## Core Concepts

### Main Building Blocks

- **`createApi`** — Factory function that creates your API configuration with endpoints and middleware
- **`baseQuery`** — Custom async handler for all HTTP requests (fetch, axios, etc.)
- **`endpoints`** — Builder pattern for declaring query and mutation operations
- **`cacheTimeout`** — Cache expiration window in milliseconds (default: 30 seconds)
- **Middleware** — Request/response transformation pipeline executed sequentially
- **Plugins** — Lifecycle hooks (beforeQuery, afterQuery, onError) for side effects

## Basic Example
```tsx
Here's how the pieces fit together:
import { createApi } from 'zustic/query'

const api = createApi({
  // 1. Custom fetch function
  baseQuery: async (params) => {
    const res = await fetch(params.url, {
      method: params.method || 'GET',
      headers: params.headers,
      body: params.body ? JSON.stringify(params.body) : undefined
    })
    return { data: await res.json() }
  },

  // 2. Cache duration
  cacheTimeout: 5 * 60 * 1000,

  // 3. Define endpoints
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => ({ url: '/users', method: 'GET' })
    }),

    createUser: builder.mutation({
      query: (user) => ({ url: '/users', method: 'POST', body: user })
    })
  })
})

// 4. Auto-generated hooks
export const { useGetUsersQuery, useCreateUserMutation } = api
```

---

## How It Works

Zustic Query follows a declarative pattern where you define your API once, and everything else is generated:

1. **Configuration** — Define `baseQuery`, `cacheTimeout`, and `endpoints`
2. **Auto-Generation** — Hooks are automatically created from endpoints
3. **Execution** — Hooks manage state, caching, and request lifecycle
4. **Flexibility** — Middleware and plugins customize behavior globally or per-endpoint

---

## Key Capabilities

- **Auto-Generated Hooks** — Queries become `use{Name}Query`, mutations become `use{Name}Mutation`
- **Intelligent Caching** — Automatic request deduplication with time-based expiration
- **Middleware Pipeline** — Global or endpoint-specific request/response transformation
- **Plugin System** — Lifecycle hooks for logging, analytics, error recovery
- **Type-Safe** — Full TypeScript support with complete type inference
- **State Tracking** — Built-in `isLoading`, `isError`, `isSuccess` states

---

## Cache Lifecycle

Zustic Query's caching system optimizes performance by reducing redundant requests:

**Stage 1 — First Request**
- Executes `baseQuery` function
- Stores result with expiration timer
- Returns data to component

**Stage 2 — Subsequent Requests**
- Checks if cache exists and hasn't expired
- Returns cached data instantly (zero network latency)
- No `baseQuery` execution

**Stage 3 — Expired Cache**
- Automatically fetches fresh data when timeout expires
- Updates cache with new response
- Triggers component re-render

**Stage 4 — Manual Refetch**
- Calling `reFetch()` skips cache entirely
- Immediately executes `baseQuery`
- Always returns fresh data

---

## Comparison with Alternatives

| Feature | Zustic Query | TanStack Query | RTK Query | SWR | Apollo Client |
|:--------|:------:|:------:|:------:|:------:|:------:|
| **Bundle Size** |  Tiny |  Medium |  Large |  Small |  Very Large |
| **Custom Fetch** |  Full |  Limited |  Redux |  Hooks |  GraphQL |
| **Auto Hooks** |  Yes |  Yes |  Yes |  No |  Yes |
| **Middleware** |  Yes |  No |  Yes |  No |  Links |
| **Plugins** |  Yes |  No |  No |  No |  Limited |
| **Learning Curve** |  Low |  Medium |  High |  Low |  High |
| **TypeScript** |  Excellent |  Excellent |  Good |  Fair |  Fair |
| **Zero Config** |  Yes |  No |  No |  Yes |  No |

---

## Next Steps

