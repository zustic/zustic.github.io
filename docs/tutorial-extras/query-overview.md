---
sidebar_position: 1
title: Query API Overview
description: Lightweight server state management for Zustic
---

# Query API Overview

Zustic Query is a lightweight server state management library built on Zustic Core. It manages server state with automatic caching, middleware support, and plugin hooks.

## Core Architecture

Based on your implementation:

- **`createApi`**: Main factory function that creates your API instance
- **`baseQuery`**: Custom async function that handles all network requests
- **`endpoints`**: Builder pattern for defining queries and mutations
- **`clashTimeout`**: Cache expiration time in milliseconds (default: 30 seconds)
- **Middleware**: Pipeline for request/response transformation
- **Plugins**: Lifecycle hooks (beforeQuery, afterQuery, onError)

## How It Works

```typescript
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
  clashTimeout: 5 * 60 * 1000,

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

## Key Features

- **Auto-Generated Hooks**: Queries become `use{Name}Query`, mutations become `use{Name}Mutation`
- **Smart Caching**: Check cache before network request, use `reFetch()` to bypass
- **Middleware**: Transform requests/responses in pipeline
- **Plugins**: Hook into query lifecycle events
- **Type-Safe**: Full TypeScript support with generics
- **State Management**: Tracks loading, error, success states

## Caching Flow

1. **First Call**: Executes baseQuery, stores data in cache with expiration
2. **Cached Calls**: Returns cached data instantly if not expired
3. **Expired Cache**: Fetches fresh data when cache expires
4. **Manual Refetch**: Call `reFetch()` to bypass cache immediately


# Real-World Comparison

Below is a practical comparison with major server-state libraries.

| Feature | Zustic Query | TanStack Query | RTK Query | SWR | Apollo Client |
|----------|---------------|----------------|------------|------|----------------|
| Bundle Size | 🟢 Very Small | 🟡 Medium | 🟡 Medium | 🟢 Small | 🔴 Large |
| Custom Fetch Control | 🟢 Full Control | 🟡 Abstracted | 🟡 Redux-based | 🟡 Limited | 🔴 GraphQL-only |
| Auto Hook Generation | 🟢 Yes | 🟢 Yes | 🟢 Yes | 🔴 No | 🟢 Yes |
| Built-in Cache | 🟢 Yes | 🟢 Advanced | 🟢 Advanced | 🟢 Yes | 🟢 Advanced |
| Middleware System | 🟢 Yes | 🔴 No | 🟢 Yes | 🔴 No | 🟡 Links |
| Plugin Lifecycle | 🟢 Yes | 🔴 No | 🔴 No | 🔴 No | 🟡 Limited |
| Global Interceptors | 🟢 Yes | 🟡 Via QueryClient | 🟢 Yes | 🔴 No | 🟢 Yes |
| Redux Required | ❌ No | ❌ No | 🟢 Yes | ❌ No | ❌ No |
| GraphQL Support | 🟡 Manual | 🟡 Manual | 🟡 Manual | 🟡 Manual | 🟢 Native |
| Learning Curve | 🟢 Low | 🟡 Medium | 🔴 High | 🟢 Low | 🔴 High |

