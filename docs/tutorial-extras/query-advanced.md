---
sidebar_position: 5
title: Advanced Features & Optimization
description: Master caching strategies, performance optimization, and advanced patterns
---

# Advanced Features & Optimization

Learn advanced techniques for building performant, scalable server state management with Zustic Query.

## Caching Architecture

Zustic Query uses an intelligent time-based caching system where each endpoint maintains its own cache expiration timer, allowing fine-grained control over data freshness and network efficiency.

### Cache Flow & Behavior

The caching mechanism follows a predictable lifecycle:

```tsx
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

### Cache Configuration Strategies

#### Real-Time Data (Short Cache)

For frequently changing data, use a short cache window:

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

#### Stable Data (Long Cache)

For reference data that rarely changes, use extended cache durations:

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

#### Always Fresh (No Cache)

For data that must always be current, disable caching entirely:

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

## Manual Cache Invalidation

Use `reFetch()` to bypass the cache and retrieve fresh data immediately. This is essential for operations like user-initiated refreshes or after data modifications.

### Refresh Button Example

```tsx
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

## Data Transformation

Transform API responses into application-specific formats, enabling clean separation between server contracts and application logic.

### Response Normalization

```jsx
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

## Error Handling & Recovery

Implement robust error handling with transformation and automatic retry strategies.

### Error Normalization

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

### Automatic Retry with Exponential Backoff

Improve reliability by automatically retrying failed requests with progressive delays:

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

## Sequential Data Dependencies

Implement dependent query patterns where subsequent requests only execute after prerequisite data is loaded, preventing unnecessary network overhead.

### Multi-Step Data Loading

```jsx
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

## Real-Time Data Updates

Implement polling patterns for data that requires frequent refresh cycles, such as live statistics or status feeds.

### Polling Implementation

```jsx
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

## Optimized Network Requests

Reduce network overhead and improve performance by batching multiple individual requests into single batch operations.

### Batching Multiple Resources
```jsx
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

## Computational Memoization

Cache expensive computations to prevent redundant calculations across re-renders, improving application responsiveness and memory efficiency.

### Memoizing Derived State
```jsx
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

## Conditional Query Execution

Control which queries execute based on runtime conditions, permissions, or feature flags, optimizing resource usage and enabling progressive feature rollout.

### Permission & Feature-Based Loading
```tsx
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

## Best Practices & Anti-Patterns

Follow these patterns to build robust, performant applications.

### ✅ Recommended Patterns

- Use `skip` option for conditional queries
- Call `reFetch()` to manually refetch when needed
- Transform responses for your app's data format
- Use appropriate `clashTimeout` values
- Handle errors in component UI

### ❌ Anti-Patterns to Avoid

- Don't call hooks conditionally (use `skip` instead)
- Don't create API instances inside components
- Don't forget to handle loading states
- Don't pass `undefined` as query arguments
- Don't ignore error states in UI

## TypeScript Integration

Zustic Query provides full type inference through generics, enabling compile-time safety and superior IDE support.

### Type-Safe Query Definitions

```tsx
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