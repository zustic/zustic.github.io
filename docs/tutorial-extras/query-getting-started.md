---
sidebar_position: 2
title: Getting Started
description: Step-by-step guide to set up Zustic Query in your React app
---

# Getting Started with Zustic Query

Zustic Query is a lightweight data-fetching abstraction built on top of Zustand.  
It supports:

- Queries & Mutations
- Caching
- Refetching
- Middleware
- Plugins
- Transform hooks

---

## Installation

```bash
npm install zustic
````

Import from the query subpath:

```ts
import { createApi } from "zustic/query";
```

---

# Step 1: Create Your API

Create `src/api.ts`:

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
  clashTimeout: 60 * 1000,

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

# Step 2: Using Query Hooks

Query hooks automatically execute on mount (unless skipped).

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
        🔄 Refresh
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

```ts
const {
  data,
  isLoading,
  isError,
  isSuccess,
  error,
  reFetch,
} = useGetUsersQuery(arg, options);
```

| Field       | Description               |
| ----------- | ------------------------- |
| `data`      | Returned data             |
| `isLoading` | True during first request |
| `isError`   | True if request failed    |
| `isSuccess` | True if request succeeded |
| `error`     | Error value               |
| `reFetch`   | Manually trigger refetch  |

---

## Conditional Queries (skip)

```tsx
export function UserProfile({ userId }: { userId?: number }) {
  const { data } = useGetUserQuery(userId, {
    skip: !userId,
  });

  if (!userId) return <div>Select a user</div>;

  return <div>{data?.name}</div>;
}
```

---

# Step 3: Using Mutation Hooks

Mutations are manually triggered.

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

```ts
const [execute, state] = useCreateUserMutation();
```

Where `state` contains:

```ts
{
  data,
  isLoading,
  isError,
  isSuccess,
  error
}
```

Execute mutation:

```ts
await execute(payload);
```

---

# Refetching Data

```tsx
const { reFetch } = useGetUsersQuery();

<button onClick={() => reFetch()}>
  Refresh
</button>
```

---

# Caching

Zustic Query automatically caches results.

Cache duration is controlled by:

```ts
clashTimeout: 60 * 1000
```

* Cached data is reused if arguments match
* `reFetch()` forces bypassing cache

---

# Transform & Lifecycle Hooks

Endpoints support advanced features:

```ts
builder.query({
  query: () => ({ url: "/users" }),

  transformResponse: (data, prev) => {
    return data;
  },

  transformError: (error) => {
    return error;
  },

  onSuccess: async (data) => {
    console.log("Success:", data);
  },

  onError: async (error) => {
    console.error("Error:", error);
  },
  middlewares: [],
  plugins: [],
});
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
