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
  cacheTimeout: 5 * 60 * 1000,  // Cache for 5 minutes
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
  cacheTimeout: 1 * 60 * 1000,  // 1 minute
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
  cacheTimeout: 30 * 60 * 1000,  // 30 minutes
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
  cacheTimeout: 0,  // Disable cache
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
        {isLoading ? 'Refreshing...' : ' Refresh'}
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

## Query Lifecycle Hooks - `onQueryStarted`

Handle asynchronous operations and side effects that occur at query execution time using the `onQueryStarted` lifecycle hook. This powerful feature enables optimistic updates, error handling, and request coordination.

### What is `onQueryStarted`?

The `onQueryStarted` lifecycle hook is called when a query execution begins, before the data fetch completes. It provides access to:

- **arg**: The arguments passed to the query
- **queryFulfilled**: A Promise that resolves with the query result or rejects with an error

### Hook Signature

```typescript
interface QueryEndpoint {
  onQueryStarted?: (
    arg: any,
    { queryFulfilled }: { queryFulfilled: Promise<{ data: any }> }
  ) => void | Promise<void>
}
```

### Basic Usage

```typescript
const api = createApi({
  baseQuery: myBaseQuery,
  endpoints: (builder) => ({
    updateUser: builder.mutation({
      query: (user) => ({ 
        url: `/users/${user.id}`, 
        method: 'PATCH',
        body: user 
      }),
      
      onQueryStarted: async (arg, { queryFulfilled }) => {
        try {
          // Wait for the query to complete
          const { data } = await queryFulfilled;
          console.log('Update successful:', data);
        } catch (error) {
          console.error('Update failed:', error);
        }
      }
    })
  })
})
```

### Optimistic Update Pattern

Apply changes immediately to the UI while the request is in flight, then revert on error:

```typescript
const api = createApi({
  baseQuery: myBaseQuery,
  endpoints: (builder) => ({
    updatePost: builder.mutation({
      query: (post) => ({ 
        url: `/posts/${post.id}`, 
        method: 'PATCH',
        body: post 
      }),
      
      onQueryStarted: async (arg, { queryFulfilled }) => {
        // Optimistically update the cache
        const patchResult = api.util.updateQueryData(
          'getPost', 
          arg.id, 
          (draft) => {
            Object.assign(draft, arg);
          }
        );
        
        try {
          // Wait for server confirmation
          await queryFulfilled;
          console.log('Post updated successfully');
        } catch (error) {
          // Revert the optimistic update on error
          patchResult.undo();
          console.error('Failed to update post:', error);
        }
      }
    })
  })
})
```

### Coordinating Multiple Requests

Synchronize multiple queries or mutations using `onQueryStarted`:

```typescript
const api = createApi({
  baseQuery: myBaseQuery,
  endpoints: (builder) => ({
    createPost: builder.mutation({
      query: (post) => ({ 
        url: '/posts', 
        method: 'POST',
        body: post 
      }),
      
      onQueryStarted: async (arg, { queryFulfilled }) => {
        try {
          const { data: newPost } = await queryFulfilled;
          
          // Invalidate related caches
          api.util.invalidateTags(['postsList']);
          
          // Update other queries with new data
          api.util.updateQueryData('getPosts', undefined, (draft) => {
            draft.push(newPost);
          });
          
          console.log('Post created:', newPost.id);
        } catch (error) {
          console.error('Failed to create post:', error);
        }
      }
    })
  })
})
```

### Error Recovery with `onQueryStarted`

Implement automatic error recovery strategies:

```typescript
const api = createApi({
  baseQuery: myBaseQuery,
  endpoints: (builder) => ({
    deletePost: builder.mutation({
      query: (postId) => ({ 
        url: `/posts/${postId}`, 
        method: 'DELETE'
      }),
      
      onQueryStarted: async (postId, { queryFulfilled }) => {
        // Store previous state for rollback
        const previousPosts = useGetPostsQuery().data;
        
        // Optimistically remove from UI
        api.util.updateQueryData('getPosts', undefined, (draft) => {
          return draft.filter(p => p.id !== postId);
        });
        
        try {
          await queryFulfilled;
          console.log('Post deleted successfully');
        } catch (error) {
          // Restore previous state on error
          if (previousPosts) {
            api.util.updateQueryData('getPosts', undefined, () => previousPosts);
          }
          console.error('Failed to delete post:', error);
        }
      }
    })
  })
})
```

### Abort/Cancel Request Handling

Handle request cancellation within `onQueryStarted`:

```typescript
let abortController: AbortController | null = null;

const api = createApi({
  baseQuery: myBaseQuery,
  endpoints: (builder) => ({
    searchUsers: builder.query({
      query: (searchTerm) => ({ 
        url: '/users/search',
        params: { q: searchTerm },
        signal: abortController?.signal
      }),
      
      onQueryStarted: async (arg, { queryFulfilled }) => {
        // Cancel previous search
        abortController?.abort();
        abortController = new AbortController();
        
        try {
          const { data } = await queryFulfilled;
          console.log('Found users:', data);
        } catch (error) {
          if (error?.name === 'AbortError') {
            console.log('Search cancelled');
          } else {
            console.error('Search failed:', error);
          }
        }
      }
    })
  })
})

// Cancel pending search
export function cancelSearch() {
  abortController?.abort();
}
```

### Real-Time Update Subscription Pattern

Use `onQueryStarted` to establish real-time connections or subscriptions:

```typescript
const api = createApi({
  baseQuery: myBaseQuery,
  endpoints: (builder) => ({
    watchMessages: builder.query({
      query: (roomId) => ({ url: `/messages/${roomId}` }),
      
      onQueryStarted: async (roomId, { queryFulfilled }) => {
        let ws: WebSocket | null = null;
        
        try {
          const { data: initialMessages } = await queryFulfilled;
          console.log('Initial messages loaded:', initialMessages.length);
          
          // Establish WebSocket connection
          ws = new WebSocket(`wss://api.example.com/messages/${roomId}`);
          
          ws.onmessage = (event) => {
            const newMessage = JSON.parse(event.data);
            
            // Update cache with real-time message
            api.util.updateQueryData('watchMessages', roomId, (draft) => {
              draft.push(newMessage);
            });
          };
        } catch (error) {
          console.error('Failed to load messages:', error);
        } finally {
          // Cleanup on completion
          ws?.close();
        }
      }
    })
  })
})
```

### Debouncing/Throttling with `onQueryStarted`

Control request frequency using `onQueryStarted`:

```typescript
let lastRequestTime = 0;
const DEBOUNCE_MS = 500;

const api = createApi({
  baseQuery: myBaseQuery,
  endpoints: (builder) => ({
    autoSavePost: builder.mutation({
      query: (post) => ({ 
        url: `/posts/${post.id}`, 
        method: 'PATCH',
        body: post 
      }),
      
      onQueryStarted: async (arg, { queryFulfilled }) => {
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;
        
        if (timeSinceLastRequest < DEBOUNCE_MS) {
          console.log('Request debounced - too frequent');
          return;
        }
        
        lastRequestTime = now;
        
        try {
          const { data } = await queryFulfilled;
          console.log('Auto-save successful');
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    })
  })
})
```

### Usage in Components

```tsx
'use client';

import { useUpdatePostMutation } from './api';

export function EditPostForm({ postId }: { postId: number }) {
  const [updatePost, { isLoading }] = useUpdatePostMutation();
  const [title, setTitle] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // The onQueryStarted hook handles optimistic updates
      await updatePost({ id: postId, title }) ;
      console.log('Post updated');
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={title} 
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title"
      />
      <button disabled={isLoading}>
        {isLoading ? 'Updating...' : 'Update Post'}
      </button>
    </form>
  );
}
```

### Key Benefits

✅ **Optimistic Updates** - Improve perceived performance  
✅ **Error Recovery** - Automatically revert on failure  
✅ **Request Coordination** - Synchronize multiple operations  
✅ **Real-Time Integration** - Connect to WebSocket/SSE  
✅ **Request Control** - Debounce, throttle, or cancel  
✅ **Side Effects** - Execute logic at query start time  

### Common Patterns Summary

| Pattern | Use Case | Benefit |
|---------|----------|---------|
| **Optimistic Update** | Mutations | Instant UI feedback |
| **Rollback on Error** | Data modification | User confidence |
| **Real-Time Sync** | Live data | Current information |
| **Request Debounce** | Auto-save | Prevent spam requests |
| **Abort/Cancel** | Search queries | Clean up resources |

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

###  Recommended Patterns

- Use `skip` option for conditional queries
- Call `reFetch()` to manually refetch when needed
- Transform responses for your app's data format
- Use appropriate `cacheTimeout` values
- Handle errors in component UI

###  Anti-Patterns to Avoid

- Don't call hooks conditionally (use `skip` instead)
- Don't create API instances inside components
- Don't forget to handle loading states
- Don't pass `undefined` as query arguments
- Don't ignore error states in UI

## Cache Management Utilities

Zustic Query provides powerful utility functions for advanced cache manipulation, enabling optimistic updates, tag-based invalidation, and programmatic cache control.

### updateQueryData - Optimistic Updates

Manually update query cache data with optimistic updates. Perfect for optimistic updates where you update the cache immediately while mutations are in flight.

```typescript
/**
 * Manually update query cache data with optimistic updates.
 * 
 * @example
 * ```typescript
 * const undo = api.utils.updateQueryData('getUser', {id: 1}, (draft) => {
 *   draft.name = 'Updated Name';
 * });
 * 
 * // If something goes wrong, undo the changes
 * undo?.();
 * ```
 */
api.utils.updateQueryData: <K extends QueryKeys<T>>(
  key: K,
  arg: InferQueryArg<T[K]>,
  updater: (data: InferQueryResult<T[K]>) => InferQueryResult<T[K]>
) => UpdateQueryPatchResult | undefined
```

**Returns:** `UpdateQueryPatchResult | undefined`

```typescript
export type UpdateQueryPatchResult = {
  /**
   * Reverts the cache back to its previous state.
   * Useful for rolling back optimistic updates when a request fails.
   */
  undo: () => void;
};
```

#### Optimistic Update with Undo Example

The most common pattern: update cache immediately, rollback on error.

```tsx
export function UpdateUserEmail() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const { mutate: updateUser } = useUpdateUserMutation()
  
  const handleSubmit = async () => {
    setLoading(true)
    
    try {
      // Store undo function for rollback
      const res = api.utils.updateQueryData('getUser', { id: 1 }, (draft) => {
        draft.email = email
      })
      
      // Send to server
      const result = await updateUser({ id: 1, email })
      
      setEmail('')
      alert('Email updated successfully!')
    } catch (error) {
      console.error('Failed to update:', error)
      
      // Rollback the optimistic update on error
      res?.undo()
      alert('Failed to update email. Changes reverted.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="New email"
        disabled={loading}
      />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Updating...' : 'Update Email'}
      </button>
    </div>
  )
}
```

#### Pessimistic Update Pattern

Update server first, then update cache only on success.

```tsx
export function UpdateUserEmailPessimistic() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { mutate: updateUser } = useUpdateUserMutation()
  
  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Mutate on server first
      const result = await updateUser({ id: 1, email })
      
      // Only update cache after server confirms
      if (result.success) {
        api.utils.updateQueryData('getUser', { id: 1 }, (draft) => {
          draft.email = email
        })
        
        setEmail('')
        alert('Email updated successfully!')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Update failed'
      setError(errorMessage)
      console.error('Failed to update:', err)
      // Cache is NOT updated on error, data stays accurate
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="New email"
        disabled={loading}
      />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Updating...' : 'Update Email'}
      </button>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  )
}
```

#### Comparing Optimistic vs Pessimistic

| Aspect | Optimistic | Pessimistic |
|--------|-----------|-------------|
| **UX** | Instant feedback | Delayed feedback |
| **Cache Update** | Immediately | After server confirmation |
| **Undo Needed** | Yes (on error) | No |
| **Best For** | Fast, reliable connections | Critical data, slow connections |
| **Complexity** | Higher | Lower |

---

### Advanced: Conditional Undo

Sometimes you want to undo only specific changes:

```tsx
export function ComplexUpdateExample() {
  const { mutate: updateUser } = useUpdateUserMutation()
  
  const handleUpdate = async (updates: Partial<User>) => {
    // Store original data before update
    const originalData = api.utils.getApiDraftData('getUser', { id: 1 })
    
    // Optimistically update
    const res = api.utils.updateQueryData('getUser', { id: 1 }, (draft) => {
     return Object.assign(draft, updates)
    })
    
    try {
      await updateUser({ id: 1, ...updates })
      console.log('Update successful')
    } catch (error) {
      console.error('Update failed:', error)
      
      // Revert changes
      res?.undo()

      // Alternative: manually restore specific fields
      // api.utils.updateQueryData('getUser', { id: 1 }, (draft) => {
      //   draft.email = originalData?.email
      //   draft.name = originalData?.name
      // })
    }
  }
  
  return (
    <button onClick={() => handleUpdate({ email: 'new@example.com' })}>
      Update Email
    </button>
  )
}
```

---

#### Bulk Cache Operations

Transform entire cached datasets with complex logic:

```tsx
// Remove user from cached list
api.utils.updateQueryData('getUsers', undefined, (draft) => {
  return draft.filter(user => user.id !== userId)
})

// Sort cached users alphabetically
api.utils.updateQueryData('getUsers', undefined, (draft) => {
  draft.sort((a, b) => a.name.localeCompare(b.name))
  return draft
})

// Add new item to cached list
api.utils.updateQueryData('getUsers', undefined, (draft) => {
  draft.push(newUser)
  return draft
})

// Map and transform cached data
api.utils.updateQueryData('getUserPosts', { userId: 1 }, (draft) => {
  return draft.map(post => ({
    ...post,
    edited: true,
    updatedAt: new Date().toISOString()
  }))
})
```

### getApiDraftData - Read Cached Query Data

Retrieves cached query data for a specific endpoint and arguments without triggering a new request.

```typescript
/**
 * Retrieves cached query data for a specific endpoint and arguments.
 *
 * Useful when you need to read the current cached state of a query
 * without triggering a new request.
 *
 * @template K - The endpoint key
 * @param key - The endpoint name (e.g., 'getUser', 'getPosts')
 * @param arg - The arguments used when calling the endpoint
 * @returns The cached query data if available, otherwise `undefined`
 *
 * @example
 * ```typescript
 * const user = api.utils.getApiDraftData('getUser', { id: 1 });
 *
 * if (user) {
 *   console.log(user.name);
 * }
 * ```
 */
api.utils.getApiDraftData: <K extends QueryKeys<T>> (
  key: K,
  arg: InferQueryArg<T[K]>
) => InferQueryResult<T[K]> | undefined
```

**Returns:** `InferQueryResult<T[K]> | undefined` - The cached data or undefined if not cached

#### Reading Cached Data Example

```tsx
export function UserProfile({ userId }: { userId: number }) {
  const { data: user } = useGetUserQuery({ id: userId })

  const handleShowCachedData = () => {
    // Read from cache without making a request
    const cachedUser = api.utils.getApiDraftData('getUser', { id: userId })
    
    if (cachedUser) {
      console.log('Cached user:', cachedUser.name)
      alert(`User: ${cachedUser.name}`)
    } else {
      alert('No cached data available')
    }
  }

  return (
    <div>
      <h1>{user?.name}</h1>
      <button onClick={handleShowCachedData}>
        Show Cached Data
      </button>
    </div>
  )
}
```

#### Pre-fetching Data Check

```tsx
export function UsersList() {
  const { data: users } = useGetUsersQuery()

  const handlePrefetchUser = async (userId: number) => {
    // Check if user data is already cached
    const cached = api.utils.getApiDraftData('getUser', { id: userId })
    
    if (cached) {
      // Data is already cached, no need to fetch
      console.log('Data already available:', cached)
      return
    }
    
    // Data not cached, trigger a fetch
    await api.endpoints.getUser.initiate({ id: userId })
  }

  return (
    <div>
      {users?.map(user => (
        <button
          key={user.id}
          onClick={() => handlePrefetchUser(user.id)}
        >
          Load {user.name}
        </button>
      ))}
    </div>
  )
}
```

#### Bulk Cache Operations

Transform entire cached datasets with complex logic:

```tsx
// Remove user from cached list
api.utils.updateQueryData('getUsers', undefined, (draft) => {
  return draft.filter(user => user.id !== userId)
})

// Sort cached users alphabetically
api.utils.updateQueryData('getUsers', undefined, (draft) => {
  draft.sort((a, b) => a.name.localeCompare(b.name))
  return draft
})

// Add new item to cached list
api.utils.updateQueryData('getUsers', undefined, (draft) => {
  draft.push(newUser)
  return draft
})

// Map and transform cached data
api.utils.updateQueryData('getUserPosts', { userId: 1 }, (draft) => {
  return draft.map(post => ({
    ...post,
    edited: true,
    updatedAt: new Date().toISOString()
  }))
})
```

### invalidateTags - Tag-Based Cache Invalidation

Invalidate cached queries by tag names. This is essential after mutations when you want to refresh all related data without knowing specific cache keys.

```tsx
/**
 * Invalidates cached queries by tag names.
 * 
 * Clears the cache for all endpoints whose providesTags match the provided tags.
 * Supports both simple string tags and object tags with specific IDs.
 */
api.utils.invalidateTags(tags?: (string | {type: string; id?: string | number})[]): void
```

#### Invalidate All Related Data After Mutation

```tsx
export function CreateUserForm() {
  const [name, setName] = useState('')
  const { mutate: createUser } = useCreateUserMutation()

  const handleSubmit = async () => {
    try {
      const newUser = await createUser({ name })
      
      // Invalidate all 'users' related cache
      // This triggers refetch for all queries that provide 'users' tag
      api.utils.invalidateTags(['users'])
      
      setName('')
    } catch (error) {
      console.error('Failed to create user:', error)
    }
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      handleSubmit()
    }}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="User name"
      />
      <button type="submit">Create User</button>
    </form>
  )
}
```

#### Invalidate Specific Items with ID Tags

```tsx
export function DeleteUserButton({ userId }: { userId: number }) {
  const { mutate: deleteUser } = useDeleteUserMutation()

  const handleDelete = async () => {
    try {
      await deleteUser(userId)
      
      // Invalidate the specific user and all their posts
      api.utils.invalidateTags([
        { type: 'users', id: userId },
        { type: 'posts', id: userId }
      ])
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  return <button onClick={handleDelete}>Delete User</button>
}
```

#### Multiple Tag Invalidation After Complex Mutations

```tsx
export function TransferOwnershipForm() {
  const { mutate: transferOwnership } = useTransferOwnershipMutation()

  const handleTransfer = async (postId: number, newOwnerId: number) => {
    try {
      await transferOwnership({ postId, newOwnerId })
      
      // Invalidate multiple related caches
      api.utils.invalidateTags([
        { type: 'posts', id: postId },
        { type: 'userPosts', id: newOwnerId },
        'posts' // Refresh all posts
      ])
    } catch (error) {
      console.error('Failed to transfer:', error)
    }
  }

  return (
    // ... form UI
  )
}
```

### resetApiState - Full Cache Reset

Completely reset the API state by clearing all cached data and refetching active queries. Useful for scenarios like user logout or resetting application state.

```tsx
/**
 * Resets the entire API state by clearing the cache for all queries.
 * 
 * This function iterates through all cached queries and clears their cache,
 * which effectively resets all cached data. Useful for user logout or app reset.
 */
api.utils.resetApiState(): void
```

#### Reset on Logout

```tsx
export function LogoutButton() {
  const handleLogout = async () => {
    try {
      // Clear auth token from storage
      localStorage.removeItem('authToken')
      
      // Reset entire API state
      // Clears all sensitive user data from cache
      api.utils.resetApiState()
      
      // Redirect to login
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <button onClick={handleLogout} className="logout-btn">
      Logout
    </button>
  )
}
```

#### Reset on Permission Change

```tsx
export function PermissionGuard({ requiredPermission, children }: any) {
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const result = await api.getPermissions()
        const allowed = result.permissions.includes(requiredPermission)
        
        if (!allowed) {
          // User lost permission - clear all cached data
          api.utils.resetApiState()
          setHasPermission(false)
          return
        }
        
        setHasPermission(true)
      } catch (error) {
        api.utils.resetApiState()
        setHasPermission(false)
      }
    }

    checkPermission()
  }, [requiredPermission])

  return hasPermission ? children : <AccessDenied />
}
```

### refetchQuery - Single Query Refresh

Manually refetch a specific query, bypassing cache and forcing fresh data. Useful for explicit refresh buttons or after certain user actions.

```tsx
/**
 * Clears cache and refetches a specific query by endpoint key and arguments.
 * 
 * Useful when you want to refresh a single query without affecting others.
 * Always bypasses cache and fetches fresh data.
 */
api.utils.refetchQuery(key: string, arg: any): void
```

#### Manual Refresh Button

```tsx
export function UsersList() {
  const { data: users, isLoading } = useGetUsersQuery()

  const handleRefresh = () => {
    // Refetch only this specific query
    api.utils.refetchQuery('getUsers', undefined)
  }

  return (
    <div>
      <button onClick={handleRefresh} disabled={isLoading}>
        {isLoading ? 'Refreshing...' : '🔄 Refresh Users'}
      </button>
      <ul>
        {users?.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

#### Selective Query Refresh

```tsx
export function Dashboard() {
  const { data: stats } = useGetStatsQuery()
  const { data: users } = useGetUsersQuery()
  
  const handleStatsRefresh = () => {
    // Only refresh stats, don't touch users cache
    api.utils.refetchQuery('getStats', undefined)
  }

  const handleUsersRefresh = () => {
    // Only refresh users with specific filter
    api.utils.refetchQuery('getUsers', { role: 'admin' })
  }

  return (
    <div>
      <section>
        <button onClick={handleStatsRefresh}>Refresh Stats</button>
        <Stats data={stats} />
      </section>
      <section>
        <button onClick={handleUsersRefresh}>Refresh Admin Users</button>
        <UsersList data={users} />
      </section>
    </div>
  )
}
```

#### Conditional Auto-Refresh

```tsx
export function RealTimeStats() {
  const { data: stats, isLoading } = useGetStatsQuery()

  // Auto-refresh specific query every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      api.utils.refetchQuery('getStats', undefined)
    }, 30 * 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <div>Last updated: {stats?.timestamp}</div>
      <Stats data={stats} loading={isLoading} />
    </div>
  )
}
```

## Combining Multiple Utilities

These utilities work together for powerful cache management patterns:

```tsx
export function ComplexMutationFlow() {
  const { mutate: createPost } = useCreatePostMutation()

  const handleCreatePost = async (title: string, content: string) => {
    try {
      // 1. Optimistically update lists
      api.utils.updateQueryData('getPosts', undefined, (draft) => [
        ...draft,
        { id: 'tmp', title, content, status: 'pending' }
      ])

      // 2. Perform mutation
      const post = await createPost({ title, content })

      // 3. Clean up optimistic data and refetch
      api.utils.refetchQuery('getPosts', undefined)

      // 4. Invalidate related caches
      api.utils.invalidateTags([
        { type: 'posts', id: post.id },
        'postCount'
      ])
    } catch (error) {
      // On error, invalidate to get fresh data
      api.utils.invalidateTags(['posts'])
    }
  }

  return (
    // ... form UI
  )
}
```