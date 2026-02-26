---
sidebar_position: 6
---

# Middleware Guide

Learn how to use Zustic's middleware system to extend functionality.

## What is Middleware?

Middleware are functions that intercept and can modify state updates. They're useful for:

- **Logging** - Track state changes
- **Persistence** - Save state automatically
- **Validation** - Enforce state constraints
- **DevTools Integration** - Debug state changes
- **Time Travel** - Replay actions
- **Analytics** - Track user actions

## Middleware Type Definition

Zustic provides a built-in `Middleware` type for full type safety:

```typescript
import { type Middleware } from "zustic";

type Middleware<T> = (
  set: (partial: T | ((state: T) => T)) => void,
  get: () => T
) => (
  next: (partial: T | ((state: T) => T)) => void
) => (partial: T | ((state: T) => T)) => void | Promise<void>
```

Breaking it down:

1. **Outer function** receives:
   - `set`: Function to update state
   - `get`: Function to read current state

2. **Middle function** receives:
   - `next`: The next middleware in the chain or setState

3. **Inner function** receives:
   - `partial`: The actual update (object or function)

## Creating a Middleware

### Basic Logger Middleware with Types

```typescript
import { type Middleware } from "zustic";

type AppState = {
  count: number;
  name: string;
};

const logger: Middleware<AppState> = (set, get) => (next) => async (partial) => {
  // Before update
  console.log('Previous state:', get());
  console.log('Update:', partial);

  // Call next middleware or setState
  await next(partial);

  // After update
  console.log('Updated state:', get());
};
```

### Using Middleware

Pass middleware as the second parameter to `create`:

```typescript
import { type Middleware } from "zustic";

type CounterState = {
  count: number;
  increment: () => void;
};

// Define middleware with proper type
const logger: Middleware<CounterState> = (set, get) => (next) => async (partial) => {
  console.log('Previous state:', get());
  await next(partial);
  console.log('Updated state:', get());
};

// Use single middleware
const useStore = create(
  (set, get) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }),
  [logger] // Single middleware in array
);
```

### Multiple Middleware in Array

Pass multiple middleware in an array - they execute left to right:

```typescript
import { type Middleware } from "zustic";

type AppState = {
  user: { name: string; email: string };
  isLoading: boolean;
};

// Middleware 1: Logging
const loggerMiddleware: Middleware<AppState> = (set, get) => (next) => async (partial) => {
  console.log('Update:', partial);
  await next(partial);
};

// Middleware 2: Validation
const validationMiddleware: Middleware<AppState> = (set, get) => (next) => async (partial) => {
  if (typeof partial === 'function') {
    return await next(partial);
  }
  
  if (partial.user?.email && !partial.user.email.includes('@')) {
    console.warn('Invalid email');
    return;
  }
  
  console.log('Validation passed');
  await next(partial);
};

// Middleware 3: Persistence
const persistMiddleware: Middleware<AppState> = (set, get) => (next) => async (partial) => {
  await next(partial);
  localStorage.setItem('app-state', JSON.stringify(get()));
  console.log('Persisted');
};

// Use multiple middleware
const useAppStore = create(
  (set, get) => ({
    user: { name: '', email: '' },
    isLoading: false,
    setUser: (user) => set((state) => ({ ...state, user })),
  }),
  [loggerMiddleware, validationMiddleware, persistMiddleware]
  // Execution order:
  // loggerMiddleware → validationMiddleware → persistMiddleware → setState
);
```

Middleware are applied from left to right, each wrapping the next.

## Common Middleware Patterns

### 1. Logging Middleware

Track all state changes:

```typescript
const loggerMiddleware = (set, get) => (next) => async (partial) => {
  const prev = get();
  const timestamp = new Date().toISOString();

  console.group(` State Update - ${timestamp}`);
  console.log('Previous:', prev);
  console.log('Update:', partial);

  await next(partial);

  console.log('New:', get());
  console.groupEnd();
};
```

### 2. Persistence Middleware with localStorage

Auto-save to localStorage with type safety:

```typescript
import { type Middleware } from "zustic";

type PersistenceState = {
  count: number;
  name: string;
};

const persistMiddleware: Middleware<PersistenceState> = (set, get) => (next) => async (partial) => {
  await next(partial);

  try {
    const state = get();
    localStorage.setItem('app-state', JSON.stringify(state));
    console.log('Saved to localStorage');
  } catch (error) {
    console.error('Failed to persist:', error);
  }
};

// Usage:
const useStore = create(
  (set, get) => {
    const saved = localStorage.getItem('app-state');
    const initialState = saved ? JSON.parse(saved) : {};
    
    return {
      count: initialState.count ?? 0,
      name: initialState.name ?? '',
      increment: () => set((state) => ({ ...state, count: state.count + 1 })),
      setName: (name: string) => set((state) => ({ ...state, name })),
    };
  },
  [persistMiddleware]
);
```

### 2b. Persistence Middleware with Custom Storage

Use custom storage service with typed keys:

```typescript
import { type Middleware } from "zustic";
import storage, { type StorageKey } from "@src/core/storage/storage";

// Generic persist middleware factory
export const persist = <T extends object>(key: StorageKey): Middleware<T> => 
  (_set, get) => (next) => (partial) => {
    next(partial);
    
    try {
      const state = get() as any;
      storage.setItem(key, JSON.stringify(state?.data || []));
      console.log(`Persisted ${key} to storage`);
    } catch (error) {
      console.error(`Failed to persist ${key}:`, error);
    }
  };

// Usage with type-safe storage keys:
type UserState = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  posts: Array<{ id: number; title: string }>;
};

const useUserStore = create(
  (set, get) => ({
    user: null as any,
    posts: [],
    setUser: (user: any) => set((state) => ({ ...state, user })),
    addPost: (post: any) => set((state) => ({
      ...state,
      posts: [...state.posts, post]
    })),
  }),
  [persist<UserState>('user-data')]
);
```

### 3. Validation Middleware

Validate updates before applying:

```typescript
const validateMiddleware = (set, get) => (next) => async (partial) => {
  const state = get();
  const updates = typeof partial === 'function' ? partial(state) : partial;

  // Custom validation logic
  if ('age' in updates && updates.age < 0) {
    console.warn(' Age cannot be negative');
    return;
  }

  if ('email' in updates && !updates.email.includes('@')) {
    console.warn(' Invalid email');
    return;
  }

  await next(partial);
  console.log(' Validation passed');
};
```

### 3b. Permission-Based Middleware

Control state updates based on user permissions:

```typescript
import { type Middleware } from "zustic";

type PermissionMiddlewareState = {
  adminData: any;
  publicData: any;
  role: 'admin' | 'user' | 'guest';
};

// Permission-based middleware factory
export const requiredPermission = (permission: string): Middleware<PermissionMiddlewareState> => 
  (set, get) => (next) => async (partial) => {
    const state = get();
    const userRole = state.role;
    
    // Check if user has required permission
    const hasPermission = userRole === 'admin' || permission === 'public';
    
    if (!hasPermission) {
      console.warn(`Permission denied: requires ${permission}`);
      return;
    }
    
    console.log(`Permission granted for ${permission}`);
    await next(partial);
  };

// Usage with multiple permission middlewares in array:
type AppState = {
  adminData: { users: any[] };
  publicData: { posts: any[] };
  role: 'admin' | 'user' | 'guest';
};

const useStore = create(
  (set, get) => ({
    adminData: { users: [] },
    publicData: { posts: [] },
    role: 'user' as const,
    setAdminData: (data: any) => set((state) => ({ ...state, adminData: data })),
    setPublicData: (data: any) => set((state) => ({ ...state, publicData: data })),
  }),
  [
    requiredPermission('admin'),   // Check admin permissions
    requiredPermission('public'),  // Check public permissions
    persistMiddleware              // Persist to storage
  ]
);
```

### 4. Time-Travel Middleware

Store history for debugging:

```typescript
const historyMiddleware = (set, get) => {
  let history = [get()];
  let historyIndex = 0;

  return (next) => async (partial) => {
    await next(partial);

    const state = get();
    history = history.slice(0, historyIndex + 1);
    history.push(state);
    historyIndex++;

    console.log(`History: ${historyIndex + 1}/${history.length}`);
  };
};
```

### 5. Debounce Middleware

Debounce frequent updates:

```typescript
const debounceMiddleware = (ms: number) => {
  let timeoutId: NodeJS.Timeout;

  return (set, get) => (next) => async (partial) => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(async () => {
      await next(partial);
      console.log('Debounced update applied');
    }, ms);
  };
};

// Usage:
const useStore = create(
  (set, get) => ({
    searchQuery: '',
    setQuery: (query: string) => set({ searchQuery: query }),
  }),
  [debounceMiddleware(300)] // Wait 300ms before updating
);
```

### 6. Async Middleware

Handle async operations:

```typescript
const asyncMiddleware = (set, get) => (next) => async (partial) => {
  console.log('Processing...');

  try {
    await next(partial);
    console.log(' Update completed');
  } catch (error) {
    console.error(' Update failed:', error);
  }
};
```

### 7. Analytics Middleware

Track user actions:

```typescript
const analyticsMiddleware = (set, get) => (next) => async (partial) => {
  const actionName = typeof partial === 'function' 
    ? 'update' 
    : Object.keys(partial)[0];

  // Send to analytics service
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({
      action: actionName,
      timestamp: Date.now(),
      previousState: get(),
    }),
  });

  await next(partial);
};
```

## Advanced Patterns

### Immer Middleware

Enable immutable-style updates with Immer for easier nested state mutations:

```typescript
import produce from 'immer';

const immerMiddleware = (set, get) => (next) => async (partial) => {
  const update = typeof partial === 'function' ? partial(get()) : partial;

  // Use Immer to produce the next state
  const nextState = produce(get(), (draft) => {
    Object.assign(draft, update);
  });

  await next(() => nextState);
};

// Usage: Update nested state easily
type AppState = {
  user: {
    profile: {
      name: string;
      email: string;
      settings: {
        notifications: boolean;
        theme: 'light' | 'dark';
      };
    };
  };
  posts: Array<{ id: number; title: string; likes: number }>;
};

const useStore = create(
  (set, get) => ({
    user: {
      profile: {
        name: 'John',
        email: 'john@example.com',
        settings: {
          notifications: true,
          theme: 'light'
        }
      }
    },
    posts: [],
    
    // With Immer middleware, you can mutate directly
    updateUserName: (name: string) => set((state) => {
      // This looks like mutation but is actually immutable!
      state.user.profile.name = name;
      return state
    }),
    
    updateSettings: (theme: 'light' | 'dark') => set((state) => {
      state.user.profile.settings.theme = theme;
      return state
    }),
    
    incrementPostLikes: (postId: number) => set((state) => {
      const post = state.posts.find(p => p.id === postId);
      if (post) {
        post.likes += 1;
      }
    }),
    
    addPost: (title: string) => set((state) => {
      state.posts.push({
        id: Date.now(),
        title,
        likes: 0
      });
      return state
    })
  }),
  [immerMiddleware]
);

// In component - update nested state easily
export function UserSettings() {
  const { user, updateUserName, updateSettings } = useStore();

  return (
    <div>
      <input
        value={user.profile.name}
        onChange={(e) => updateUserName(e.target.value)}
      />
      <select
        value={user.profile.settings.theme}
        onChange={(e) => updateSettings(e.target.value as 'light' | 'dark')}
      >
        <option>light</option>
        <option>dark</option>
      </select>
    </div>
  );
}
```

**Benefits of Immer Middleware:**
- Write mutation-style code (easier to read)
- Get immutability guarantees (no accidental mutations)
- Simpler nested state updates (no deep spreads)
- Works with TypeScript (full type safety)
- No need to manually spread nested objects

**Before (without Immer):**
```typescript
// Deep nesting makes this verbose
updateSettings: (theme: 'light' | 'dark') => set((state) => ({
  ...state,
  user: {
    ...state.user,
    profile: {
      ...state.user.profile,
      settings: {
        ...state.user.profile.settings,
        theme
      }
    }
  }
}))
```

**After (with Immer):**
```typescript
// Clean and simple mutation-style syntax
updateSettings: (theme: 'light' | 'dark') => set((state) => {
  state.user.profile.settings.theme = theme;
  return state
})
```

### Conditional Middleware

```typescript
const conditionalMiddleware = (shouldLog: boolean) => (set, get) => (next) => async (partial) => {
  if (shouldLog) {
    console.log('Update:', partial);
  }
  await next(partial);
};

// Usage:
const useStore = create(
  (set, get) => ({...}),
  [conditionalMiddleware(process.env.NODE_ENV === 'development')]
);
```

### Middleware with Rollback

```typescript
const rollbackMiddleware = (set, get) => (next) => async (partial) => {
  const previousState = get();

  try {
    await next(partial);
  } catch (error) {
    console.error('Error occurred, rolling back:', error);
    set(previousState);
    throw error;
  }
};
```

### Rate Limiting

```typescript
const rateLimitMiddleware = (maxUpdates: number, window: number) => {
  const updates: number[] = [];

  return (set, get) => (next) => async (partial) => {
    const now = Date.now();
    const recentUpdates = updates.filter(t => now - t < window);

    if (recentUpdates.length >= maxUpdates) {
      console.warn(' Rate limit exceeded');
      return;
    }

    updates.push(now);
    await next(partial);
  };
};

// Usage: Max 5 updates per 1 second
const useStore = create(
  (set, get) => ({...}),
  [rateLimitMiddleware(5, 1000)]
);
```

## Best Practices

### 1. Keep Middleware Pure

Middleware should not have side effects outside of logging/persistence:

```typescript
//  Good
const middleware = (set, get) => (next) => async (partial) => {
  console.log('Updating');
  await next(partial);
};

//  Bad - modifying external state
let counter = 0;
const badMiddleware = (set, get) => (next) => async (partial) => {
  counter++; // Side effect!
  await next(partial);
};
```

### 2. Handle Errors

```typescript
const safeMiddleware = (set, get) => (next) => async (partial) => {
  try {
    await next(partial);
  } catch (error) {
    console.error('Middleware error:', error);
    // Handle gracefully
  }
};
```

### 3. Avoid Infinite Loops

```typescript
//  Bad - causes infinite loop
const badMiddleware = (set, get) => (next) => async (partial) => {
  await next(partial);
  set(partial); // Calls middleware again!
};

//  Good - call next only once
const goodMiddleware = (set, get) => (next) => async (partial) => {
  await next(partial);
  console.log('Update complete');
};
```

### 4. Order Matters

```typescript
// Different order = different behavior
const useStore1 = create((set) => ({...}), [loggerMiddleware, persistMiddleware]);
const useStore2 = create((set) => ({...}), [persistMiddleware, loggerMiddleware]);

// useStore1 logs, then persists
// useStore2 persists, then logs
```

## Testing Middleware

```typescript
describe('loggerMiddleware', () => {
  it('should log state changes', async () => {
    const logs: any[] = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(...args);

    const useStore = create(
      (set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }),
      [loggerMiddleware]
    );

    const store = useStore.getState();
    store.increment();

    expect(logs.length).toBeGreaterThan(0);
    console.log = originalLog;
  });
});
```

## Performance Considerations

### 1. Async Middleware

Be careful with async middleware - they can slow down updates:

```typescript
// Lighter weight - sync logging
const syncLogger = (set, get) => (next) => (partial) => {
  console.log('Update:', partial);
  next(partial);
};

// Heavier - async operations
const asyncLogger = (set, get) => (next) => async (partial) => {
  console.log('Update:', partial);
  await next(partial);
};
```

### 2. Avoid Heavy Computations

```typescript
//  Don't do heavy work in middleware
const badMiddleware = (set, get) => (next) => async (partial) => {
  const expensiveCalculation = await runHeavyComputation();
  await next(partial);
};

//  Keep middleware lightweight
const goodMiddleware = (set, get) => (next) => async (partial) => {
  console.log('Updating');
  await next(partial);
};
```

## Summary

Middleware in Zustic provides powerful extensibility for:
- Debugging and monitoring
- Persistence and synchronization
- Validation and constraints
- Analytics and tracking
- Time travel and history

Use them to build robust, observable state management!
