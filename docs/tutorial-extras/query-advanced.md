---
sidebar_position: 4
title: Advanced Features
description: Caching strategies, optimization, and advanced patterns
---

# Advanced Features

Master advanced patterns for caching, optimization, and performance.

## Caching System

Zustic Query implements a time-based caching system. Each endpoint tracks cache expiration.

### How Caching Works

```typescript
const api = createApi({
  baseQuery: myBaseQuery,
  clashTimeout: 5 * 60 * 1000,  // Cache for 5 minutes
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => ({ url: '/users' })
    })
  })
})

// First call: Network request, store in cache
const { data: users1 } = useGetUsersQuery()

// Within 5 minutes: Return cached data instantly
const { data: users2 } = useGetUsersQuery()

// After 5 minutes: Fetch fresh data
const { data: users3 } = useGetUsersQuery()

// Manual refetch: Bypass cache immediately
const { reFetch } = useGetUsersQuery()
reFetch()  // Always fetches fresh
```

### Cache Configuration

Short cache for real-time data:

```typescript
const api = createApi({
  baseQuery: myBaseQuery,
  clashTimeout: 1 * 60 * 1000,  // 1 minute
  endpoints: (builder) => ({
    getLiveStats: builder.query({
      query: () => ({ url: '/stats' })
    })
  })
})
```

Long cache for stable data:

```typescript
const api = createApi({
  baseQuery: myBaseQuery,
  clashTimeout: 30 * 60 * 1000,  // 30 minutes
  endpoints: (builder) => ({
    getCountries: builder.query({
      query: () => ({ url: '/countries' })
    })
  })
})
```

No cache - always fresh:

```typescript
const api = createApi({
  baseQuery: myBaseQuery,
  clashTimeout: 0,  // Disable cache
  endpoints: (builder) => ({
    getRandomNumber: builder.query({
      query: () => ({ url: '/random' })
    })
  })
})
```

## Cache Invalidation

Force refresh and bypass cache:

```typescript
export function UsersList() {
  const { data, reFetch, isLoading } = useGetUsersQuery()

  const handleRefresh = () => {
    reFetch()  // Bypass cache, fetch fresh data
  }

  return (
    <div>
      <button onClick={handleRefresh} disabled={isLoading}>
        {isLoading ? 'Refreshing...' : '🔄 Refresh'}
      </button>
      <ul>
        {data?.map(user => <li key={user.id}>{user.name}</li>)}
      </ul>
    </div>
  )
}
```

## Response Transformation

Transform API responses to app format:

```typescript
interface ApiUser {
  id: number
  first_name: string
  last_name: string
  created_at: string
}

interface AppUser {
  id: number
  fullName: string
  joinDate: Date
}

endpoints: (builder) => ({
  getUser: builder.query({
    query: (id) => ({ url: `/users/${id}` }),

    // Transform API format to app format
    transformResponse: (data: ApiUser): AppUser => {
      return {
        id: data.id,
        fullName: `${data.first_name} ${data.last_name}`,
        joinDate: new Date(data.created_at)
      }
    }
  })
})

// Component receives transformed data
export function UserDetail({ userId }: { userId: number }) {
  const { data: user } = useGetUserQuery(userId)

  return (
    <div>
      <h1>{user?.fullName}</h1>
      <p>Joined: {user?.joinDate.toLocaleDateString()}</p>
    </div>
  )
}
```

## Error Handling

### Transform Errors

```typescript
endpoints: (builder) => ({
  getUser: builder.query({
    query: (id) => ({ url: `/users/${id}` }),

    // Normalize error messages
    transformError: (error: string) => {
      if (error.includes('404')) return 'User not found'
      if (error.includes('401')) return 'Unauthorized'
      if (error.includes('500')) return 'Server error'
      return 'An error occurred'
    }
  })
})
```

### Error Recovery with Retry

```typescript
const retryMiddleware = async (ctx, next) => {
  let lastError

  // Try up to 3 times
  for (let i = 0; i < 3; i++) {
    const result = await next()

    if (!result.error) {
      return result
    }

    lastError = result.error

    // Exponential backoff: 1s, 2s, 4s
    if (i < 2) {
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000))
    }
  }

  return { error: lastError }
}

const api = createApi({
  baseQuery: myBaseQuery,
  middlewares: [retryMiddleware],
  endpoints: (builder) => ({
    getUser: builder.query({
      query: (id) => ({ url: `/users/${id}` })
    })
  })
})
```

## Dependent Queries

Wait for one query before fetching another:

```typescript
export function UserPosts({ userId }: { userId: number }) {
  // First query: fetch user
  const { data: user } = useGetUserQuery(userId)

  // Second query: depends on user being loaded
  const { data: posts } = useGetUserPostsQuery(user?.id ?? 0, {
    skip: !user  // Skip until user is loaded
  })

  return (
    <div>
      <h1>{user?.name}</h1>
      {posts?.map(post => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  )
}
```

## Polling for Real-Time Data

```typescript
import { useEffect } from 'react'

export function LiveStats() {
  const { data: stats, reFetch } = useGetStatsQuery()

  // Poll every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      reFetch()
    }, 5000)

    return () => clearInterval(interval)
  }, [reFetch])

  return <div>Count: {stats?.count}</div>
}
```

## Batch Requests

Reduce network requests by batching:

```typescript
// Problem: Multiple individual requests
export function Users() {
  const { data: user1 } = useGetUserQuery(1)
  const { data: user2 } = useGetUserQuery(2)
  const { data: user3 } = useGetUserQuery(3)
  // 3 separate requests
}

// Solution: Batch endpoint
const api = createApi({
  baseQuery: myBaseQuery,
  endpoints: (builder) => ({
    getUsersBatch: builder.query({
      query: (ids: number[]) => ({
        url: '/users/batch',
        method: 'POST',
        body: { ids }
      })
    })
  })
})

export function Users() {
  const { data: users } = useGetUsersBatchQuery([1, 2, 3])
  // 1 request for all users
}
```

## Memoization

```typescript
import { useMemo } from 'react'

export function UsersList() {
  const { data: users } = useGetUsersQuery()

  // Memoize expensive computations
  const sortedUsers = useMemo(() => {
    return users?.sort((a, b) => a.name.localeCompare(b.name)) || []
  }, [users])

  const usersByRole = useMemo(() => {
    return users?.reduce((acc, user) => {
      if (!acc[user.role]) acc[user.role] = []
      acc[user.role].push(user)
      return acc
    }, {} as Record<string, any>) || {}
  }, [users])

  return <UserTable sorted={sortedUsers} byRole={usersByRole} />
}
```

## Selective Queries

```typescript
export function Dashboard() {
  // Only fetch if admin
  const isAdmin = useIsAdmin()

  const { data: analytics } = useGetAnalyticsQuery(undefined, {
    skip: !isAdmin
  })

  // A/B testing
  const useNewUI = useFeatureFlag('new-ui')

  const { data: legacyData } = useGetPostsQuery(undefined, {
    skip: useNewUI
  })

  const { data: modernData } = useGetPostsV2Query(undefined, {
    skip: !useNewUI
  })

  return <Dashboard data={modernData || legacyData} analytics={analytics} />
}
```

## Best Practices

### ✅ DO

- Use `skip` option for conditional queries
- Call `reFetch()` to manually refetch when needed
- Transform responses for your app's data format
- Use appropriate `clashTimeout` values
- Handle errors in component UI

### ❌ DON'T

- Don't call hooks conditionally (use `skip` instead)
- Don't create API instances inside components
- Don't forget to handle loading states
- Don't pass `undefined` as query arguments
- Don't ignore error states in UI

## TypeScript Support

Full type inference with generics:

```typescript
interface User {
  id: number
  name: string
  email: string
}

const api = createApi({
  baseQuery: async (params) => { /* ... */ },
  endpoints: (builder) => ({
    getUser: builder.query({
      query: (id: number) => ({ url: `/users/${id}` })
    })
  })
})

// Hook types are inferred
const { data } = useGetUserQuery(123)  // data: any | undefined
```