---
slug: zustic-query-complete-guide
title: 'Zustic Query: Complete Guide to Server State Management'
authors: zustic
tags: [zustic, query, server-state, data-fetching, guide]
image: /img/logo.png
date: 2026-02-18
description: 'Learn how to use Zustic Query for powerful, minimal server state management with automatic caching, middleware, and intelligent data fetching.'
---

Introducing **Zustic Query** - a lightweight, powerful server state management library built on top of Zustic Core. If you're building React applications and tired of complex data-fetching solutions, Zustic Query offers a refreshingly simple alternative.

<!-- truncate -->

## What is Zustic Query?

Zustic Query is a minimal yet feature-complete server state management library that handles:

- **Automatic HTTP requests** with built-in caching
- **Middleware pipelines** for request/response transformation
- **Plugin system** for logging, analytics, and error tracking
- **Zero boilerplate** - define endpoints once, get hooks automatically
- **Full TypeScript support** with complete type inference

### Why Zustic Query?

If you've used Redux Toolkit, RTK Query, or TanStack Query, you know the pain:

- Complex setup with lots of boilerplate
- Large bundle sizes
- Steep learning curves
- Unnecessary dependencies

Zustic Query is different. It's **tiny (~2KB gzipped)**, **simple**, and **powerful**.

| Feature | Zustic Query | RTK Query | TanStack Query | SWR |
|---------|:-------:|:-------:|:-------:|:-------:|
| **Bundle Size** | ~2KB | ~15KB | ~20KB | ~4KB |
| **Setup Time** | 5 min | 30+ min | 20 min | 5 min |
| **Learning Curve** | Very Easy | Hard | Medium | Easy |
| **Middleware** | Built-in | Yes | No | No |
| **Plugins** | Yes | Yes | No | No |
| **Zero Config** | Yes | No | No | Yes |

## Getting Started in 5 Minutes

### Step 1: Install

```bash
npm install zustic
```

### Step 2: Define Your API

Create your first API with a simple configuration:

```typescript
import { createApi } from 'zustic/query'

const api = createApi({
  // Custom fetch function
  baseQuery: async (params) => {
    const res = await fetch(params.url, {
      method: params.method || 'GET',
      headers: params.headers,
      body: params.body ? JSON.stringify(params.body) : undefined
    })
    return { data: await res.json() }
  },

  // Cache for 5 minutes
  cacheTimeout: 5 * 60 * 1000,

  // Define endpoints
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => ({ url: '/api/users', method: 'GET' })
    }),

    getUserById: builder.query({
      query: (id: number) => ({ url: `/api/users/${id}`, method: 'GET' })
    }),

    createUser: builder.mutation({
      query: (user: { name: string; email: string }) => ({
        url: '/api/users',
        method: 'POST',
        body: user
      })
    })
  })
})

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation
} = api
```

That's it! You now have fully typed hooks with automatic state management.

### Step 3: Use in Your Components

```tsx
import { useGetUsersQuery, useCreateUserMutation } from './api'

export function UsersList() {
  const { data: users, isLoading, isError } = useGetUsersQuery()
  const { mutate: createUser } = useCreateUserMutation()

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error loading users</div>

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users?.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

## Core Features Explained

### 1. Intelligent Caching

Zustic Query automatically caches responses. Subsequent calls within the cache timeout return instantly:

```typescript
const api = createApi({
  baseQuery: myBaseQuery,
  cacheTimeout: 5 * 60 * 1000,  // 5 minutes
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => ({ url: '/users' })
    })
  })
})

// First call: Network request
const { data: users1 } = useGetUsersQuery()

// Within 5 minutes: Instant cached response
const { data: users2 } = useGetUsersQuery()

// After 5 minutes: Fresh network request
const { data: users3 } = useGetUsersQuery()
```

### 2. Manual Refetching

Force fresh data when needed:

```tsx
export function Users() {
  const { data, reFetch, isLoading } = useGetUsersQuery()

  const handleRefresh = () => {
    reFetch()  // Bypass cache, fetch fresh data
  }

  return (
    <div>
      <button onClick={handleRefresh} disabled={isLoading}>
        {isLoading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  )
}
```

### 3. Conditional Queries (Skip)

Only fetch when needed:

```tsx
export function UserDetail({ userId }: { userId?: number }) {
  const { data: user } = useGetUserByIdQuery(userId ?? 0, {
    skip: !userId  // Don't fetch if no userId
  })

  return <div>{user?.name}</div>
}
```

### 4. Data Transformation

Transform API responses to your app format:

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
    transformResponse: (data: ApiUser): AppUser => ({
      id: data.id,
      fullName: `${data.first_name} ${data.last_name}`,
      joinDate: new Date(data.created_at)
    })
  })
})
```

### 5. Update Query Data

Manually update cached data without refetching:

```typescript
export function UpdateUserEmail() {
  const { mutate: updateUser } = useUpdateUserMutation()

  const handleSubmit = async (email: string) => {
    try {
      await updateUser({ email }).unwrap()

      // Update cache directly
      api.util.updateQueryData('getUser', { page: 1, limit: 10 }, (draft) => {
        draft = draft.map(d => ({
          ...d,
          email: email
        }))
        return draft
      })
    } catch (error) {
      console.error('Failed to update:', error)
    }
  }

  return (
    <button onClick={() => handleSubmit('new@email.com')}>
      Update Email
    </button>
  )
}
```

## Advanced Features

### Middleware for Request/Response Transformation

```typescript
const authMiddleware = async (ctx, next) => {
  // Add auth token to all requests
  const result = await next()

  if (!result.data) {
    const token = localStorage.getItem('auth_token')
    if (token) {
      ctx.request.headers = {
        ...ctx.request.headers,
        Authorization: `Bearer ${token}`
      }
    }
  }

  return result
}

const api = createApi({
  baseQuery: myBaseQuery,
  middlewares: [authMiddleware],
  endpoints: (builder) => ({
    // Your endpoints
  })
})
```

### Plugins for Side Effects

```typescript
const loggingPlugin = {
  name: 'logging',

  beforeQuery: (ctx) => {
    console.log(`📤 [${ctx.def.endpoint}] Starting request`)
  },

  afterQuery: (result, ctx) => {
    console.log(`✅ [${ctx.def.endpoint}] Success`)
  },

  onError: (error, ctx) => {
    console.error(`❌ [${ctx.def.endpoint}] Error:`, error)
  }
}

const api = createApi({
  baseQuery: myBaseQuery,
  plugins: [loggingPlugin],
  endpoints: (builder) => ({
    // Your endpoints
  })
})
```

### Automatic Retry with Exponential Backoff

```typescript
const retryPlugin = {
  name: 'retry',

  onError: async (error, ctx, retry) => {
    if (ctx.retryCount < 3) {
      // Wait 1s, 2s, 4s before retry
      const delay = Math.pow(2, ctx.retryCount) * 1000
      await new Promise(r => setTimeout(r, delay))
      return retry()
    }
  }
}
```

## Real-World Example: Todo App

Here's a complete example of a todo app using Zustic Query:

```typescript
import { createApi } from 'zustic/query'

interface Todo {
  id: number
  title: string
  completed: boolean
}

const api = createApi({
  baseQuery: async (params) => {
    const res = await fetch(`https://api.example.com${params.url}`, {
      method: params.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: params.body ? JSON.stringify(params.body) : undefined
    })
    return { data: await res.json() }
  },

  cacheTimeout: 2 * 60 * 1000,

  endpoints: (builder) => ({
    getTodos: builder.query({
      query: () => ({ url: '/todos' })
    }),

    getTodoById: builder.query({
      query: (id: number) => ({ url: `/todos/${id}` })
    }),

    createTodo: builder.mutation({
      query: (todo: { title: string }) => ({
        url: '/todos',
        method: 'POST',
        body: todo
      })
    }),

    updateTodo: builder.mutation({
      query: (todo: Todo) => ({
        url: `/todos/${todo.id}`,
        method: 'PUT',
        body: todo
      })
    }),

    deleteTodo: builder.mutation({
      query: (id: number) => ({
        url: `/todos/${id}`,
        method: 'DELETE'
      })
    })
  })
})

export const {
  useGetTodosQuery,
  useGetTodoByIdQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation
} = api
```

Use in component:

```tsx
import {
  useGetTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation
} from './api'

export function TodoApp() {
  const { data: todos, reFetch } = useGetTodosQuery()
  const { mutate: createTodo } = useCreateTodoMutation()
  const { mutate: updateTodo } = useUpdateTodoMutation()
  const { mutate: deleteTodo } = useDeleteTodoMutation()

  const handleToggle = (todo: Todo) => {
    updateTodo({ ...todo, completed: !todo.completed })
  }

  const handleDelete = (id: number) => {
    deleteTodo(id)
    reFetch()  // Refresh the list
  }

  return (
    <div>
      <h1>My Todos</h1>
      {todos?.map(todo => (
        <div key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => handleToggle(todo)}
          />
          <span>{todo.title}</span>
          <button onClick={() => handleDelete(todo.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
```

## Best Practices

✅ **DO:**
- Use `skip` option for conditional queries
- Call `reFetch()` to manually refetch when needed
- Transform responses for your app's data format
- Use appropriate `cacheTimeout` values for your use case
- Handle errors and loading states in your UI
- Leverage middleware for cross-cutting concerns

❌ **DON'T:**
- Call hooks conditionally (use `skip` instead)
- Create API instances inside components
- Forget to handle loading and error states
- Pass `undefined` as query arguments
- Ignore error states in the UI

## Conclusion

Zustic Query combines the best parts of RTK Query, TanStack Query, and SWR into a tiny (~2KB), powerful package with **zero configuration overhead**.

Whether you're building a small side project or a large-scale application, Zustic Query gives you the tools to manage server state efficiently and elegantly.

### Next Steps

- 📖 [Read the full documentation](/docs/tutorial-extras/query-getting-started)
- 🔨 [Try the interactive Query Builder](/query-builder)
- 💬 [Join our community on GitHub](https://github.com/DeveloperRejaul/zustic)
- 📦 [Install from NPM](https://www.npmjs.com/package/zustic)

Happy coding! 🚀
