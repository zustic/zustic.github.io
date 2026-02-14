---
sidebar_position: 2
title: Getting Started
description: Build your first data-fetching layer with Zustic Query
---

# Getting Started with Zustic Query

Set up Zustic Query in minutes and start building robust server state management. This guide walks through installing, configuring, and using the Query API in your React application.

## Features Overview

Zustic Query provides everything needed for modern data fetching:

- **Queries & Mutations** — Read and write operations with built-in state management
- **Intelligent Caching** — Automatic cache management with configurable expiration
- **Manual Refetching** — Force fresh data when needed
- **Middleware Pipeline** — Intercept and transform requests/responses
- **Plugin System** — Extend functionality with lifecycle hooks
- **Response Transformation** — Normalize API responses to app formats

---

## Installation

Install the Zustic package:

```bash
npm install zustic
```

Import the API factory from the query submodule:

```typescript
import { createApi } from 'zustic/query'
```

---

## Step 1: Define Your API Configuration

Create `src/api.ts` to centralize your server state management:

```ts
import { createApi } from "zustic/query";

interface User {
  id: number;
  name: string;
  email: string;
}

export const api = createApi({
  // Required: base query handler
  baseQuery: async (params) => {
    try {
      const res = await fetch(
        `https://jsonplaceholder.typicode.com${params.url}`,
        {
          method: params.method || "GET",
          headers: params.headers,
          body: params.body ? JSON.stringify(params.body) : undefined,
        }
      );

      if (!res.ok) {
        return { error: `HTTP ${res.status}` };
      }

      return { data: await res.json() };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  // Cache duration (default: 30 seconds)
  cacheTimeout: 60 * 1000,

  endpoints: (builder) => ({
    // Query endpoint
    getUsers: builder.query({
      query: () => ({
        url: "/users",
        method: "GET",
      }),
    }),

    // Query with param
    getUser: builder.query({
      query: (id: number) => ({
        url: `/users/${id}`,
      }),
    }),

    // Mutation endpoint
    createUser: builder.mutation({
      query: (user: Omit<User, "id">) => ({
        url: "/users",
        method: "POST",
        body: user,
      }),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
} = api;
```

---

## Step 2: Using Query Hooks

Query hooks automatically fetch data when components mount (unless explicitly skipped). Auto-generated hook names follow the pattern `use{EndpointName}Query`.

### Fetching List Data

```tsx
import { useGetUsersQuery } from "./api";

export function UsersList() {
  const {
    data,
    isLoading,
    isError,
    isSuccess,
    error,
    reFetch,
  } = useGetUsersQuery(undefined);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {String(error)}</div>;

  return (
    <div>
      <button onClick={() => reFetch()}>
         Refresh
      </button>

      <ul>
        {data?.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Query Hook Return Values

Every query hook returns a state object with the following properties:

```typescript
const {
  data,
  isLoading,
  isError,
  isSuccess,
  error,
  reFetch,
} = useGetUsersQuery(arg, options)
```

| Property    | Type      | Description                              |
| ----------- | --------- | ---------------------------------------- |
| `data`      | `T`       | The resolved response data               |
| `isLoading` | `boolean` | True during the initial request          |
| `isError`   | `boolean` | True if the request failed               |
| `isSuccess` | `boolean` | True if the request completed            |
| `error`     | `string?` | Error message if request failed          |
| `reFetch`   | `() => void` | Function to manually trigger fresh data |

---

## Conditional Queries

Use the `skip` option to prevent queries from executing until specific conditions are met.

### Skip Until Data Available

```tsx
export function UserProfile({ userId }: { userId?: number }) {
  // Query only executes if userId is defined
  const { data } = useGetUserQuery(userId, {
    skip: !userId,
  })

  if (!userId) return <div>Select a user first</div>

  return <div>{data?.name}</div>
}
```

---

## Step 3: Using Mutation Hooks

Mutations represent write operations (POST, PUT, DELETE) that are manually triggered on demand.

### Creating Resources

```tsx
import { useCreateUserMutation } from "./api";

export function CreateUserForm() {
  const [createUser, { isLoading, isError, error }] =
    useCreateUserMutation();

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const result = await createUser({
      name: formData.get("name"),
      email: formData.get("email"),
    });

    if (!result.error) {
      console.log("Created:", result.data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" required />
      <input name="email" required />

      <button disabled={isLoading}>
        {isLoading ? "Creating..." : "Create"}
      </button>

      {isError && <div>{String(error)}</div>}
    </form>
  );
}
```

---

## Mutation Hook Return Values

Mutation hooks return a tuple with the execution function and state object:

```typescript
{
  data,
  isLoading,
  isError,
  isSuccess,
  error
}
```

Mutation execution:

```typescript
// Call with payload
const result = await execute(payload)

// Handle result
if (result.error) {
  console.error('Operation failed:', result.error)
} else {
  console.log('Success:', result.data)
}
```

---

## Manual Refetching

Force queries to fetch fresh data by calling `reFetch()`:

```tsx
export function UsersList() {
  const { data, reFetch } = useGetUsersQuery()

  return (
    <div>
      <button onClick={() => reFetch()}>
         Refresh Data
      </button>
      {/* Display users */}
    </div>
  )
}
```

---

## Automatic Caching

Zustic Query automatically manages data freshness through intelligent caching:

```typescript
const api = createApi({
  baseQuery: myBaseQuery,
  cacheTimeout: 60 * 1000,  // Cache for 60 seconds
  endpoints: (builder) => (/* ... */)
})
```

**Cache Behavior:**
-  Cached data reused if arguments match and cache hasn't expired
-  `reFetch()` always fetches fresh regardless of cache
-  Different arguments trigger separate cache entries

---

## Advanced Endpoint Configuration

Endpoints support lifecycle hooks and transformation functions for advanced scenarios:

```typescript
builder.query({
  query: () => ({ url: '/users' }),

  // Transform successful responses
  transformResponse: (data, meta) => {
    return data
  },

  // Transform error messages
  transformError: (error, meta) => {
    return error
  },

  // React to successful operations
  onSuccess: async (data) => {
    console.log('Success:', data)
  },

  // React to failures
  onError: async (error) => {
    console.error('Error:', error)
  },

  middlewares: [],
  plugins: [],
})
```

---

# Middleware & Plugins

You can configure global middleware and plugins:

```ts
createApi({
  baseQuery,
  middlewares: [],
  plugins: [],
  endpoints: (builder) => ({ ... }),
});
```
