---
slug: understanding-middleware-in-state-management
title: "Understanding Middleware: The Power Behind State Management"
authors: [zustic]
tags: [middleware, react, state-management, zustic]
description: "Deep dive into middleware patterns. Learn how middleware extends state management with logging, persistence, validation, and more."
image: /img/logo.png
---

# Understanding Middleware: The Power Behind State Management

Middleware is one of the most powerful but often misunderstood concepts in state management. In this post, we'll demystify middleware and show you how to use it effectively with Zustic.

<!-- truncate -->

## What is Middleware?

Middleware is a function that intercepts state changes and can perform side effects, validations, logging, or transformations before the state is actually updated.

Think of it like a security checkpoint:

```
User Action → Middleware 1 → Middleware 2 → Middleware 3 → State Updated
```

Each middleware can inspect, validate, or modify the action before it reaches the next middleware or the state.

## How Middleware Works

Middleware in Zustic follows a simple but powerful pattern. Think of it like a pipeline:

```
User Action → Middleware 1 → Middleware 2 → Middleware 3 → setState
```

Each middleware can:
1. See the previous state
2. See the update being made
3. Allow the update to proceed
4. Modify the update before it reaches the next middleware
5. React after the update is complete

## Middleware Signature

Every middleware in Zustic follows this pattern:

```typescript
type Middleware<T> = (
  set: (partial: SetStateParams<T>) => void,
  get: () => T
) => (
  next: (partial: SetStateParams<T>) => void
) => (partial: SetStateParams<T>) => void
```

Breaking it down:
1. **Outer function** receives `set` (update function) and `get` (state getter)
2. **Middle function** receives `next` (the next middleware or setState)
3. **Inner function** receives the actual update to be applied

## Basic Logger Middleware

Here's the simplest middleware - a logger:

```typescript
const loggerMiddleware = (set, get) => (next) => async (partial) => {
  // Log BEFORE the update
  const previousState = get();
  console.log('Previous state:', previousState);
  console.log('Update:', partial);

  // Call the next middleware/setState
  await next(partial);

  // Log AFTER the update
  console.log('New state:', get());
};
```

Using it:

```typescript
const useStore = create(
  (set, get) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }),
  loggerMiddleware // Add middleware here
);

// Now every update is logged!
useStore.setState((state) => ({ count: state.count + 1 }));
// Logs: Previous: {count: 0}
// Logs: Update: {count: 1}
// Logs: New: {count: 1}
```

## Using Multiple Middleware

You can chain multiple middleware together:

```typescript
const useStore = create(
  (set, get) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }),
  [loggerMiddleware, persistenceMiddleware, validationMiddleware]
);

// Execution order:
// loggerMiddleware → persistenceMiddleware → validationMiddleware → setState
```

The order matters! Middleware execute from left to right.

## Common Middleware Patterns

### 1. Persistence Middleware

Auto-save state to localStorage:

```typescript
const persistenceMiddleware = (key: string) => (set, get) => (next) => async (partial) => {
  // Apply the update
  await next(partial);

  // Then save to localStorage
  try {
    const state = get();
    localStorage.setItem(key, JSON.stringify(state));
    console.log('💾 Saved to localStorage');
  } catch (error) {
    console.error('Failed to persist:', error);
  }
};

// Usage:
const useStore = create(
  (set, get) => {
    // Load initial state from localStorage
    const saved = localStorage.getItem('mystore');
    return {
      ...JSON.parse(saved || '{}'),
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    };
  },
  persistenceMiddleware('mystore')
);
```

### 2. Validation Middleware

Validate updates before they're applied:

```typescript
const validationMiddleware = (set, get) => (next) => async (partial) => {
  const state = get();
  const updates = typeof partial === 'function' ? partial(state) : partial;

  // Validate the update
  if ('age' in updates && typeof updates.age === 'number' && updates.age < 0) {
    console.error('❌ Age cannot be negative!');
    return; // Reject the update
  }

  if ('email' in updates && !updates.email.includes('@')) {
    console.error('❌ Invalid email format!');
    return;
  }

  // Update is valid, proceed
  await next(partial);
  console.log('✅ Validation passed');
};
```

### 3. Time Travel / History Middleware

Store history for debugging and time-travel:

```typescript
const historyMiddleware = (set, get) => {
  let history: any[] = [get()];
  let historyIndex = 0;

  // Expose time-travel functions
  if (typeof window !== 'undefined') {
    (window as any).__devtools__ = {
      undo: () => {
        if (historyIndex > 0) {
          historyIndex--;
          set(history[historyIndex]);
        }
      },
      redo: () => {
        if (historyIndex < history.length - 1) {
          historyIndex++;
          set(history[historyIndex]);
        }
      },
      getHistory: () => history,
    };
  }

  return (next) => async (partial) => {
    await next(partial);

    const newState = get();
    history = history.slice(0, historyIndex + 1);
    history.push(newState);
    historyIndex++;

    console.log(`⏱️ History: ${historyIndex}/${history.length}`);
  };
};
```

Use it: `window.__devtools__.undo()` and `window.__devtools__.redo()`

### 4. Analytics Middleware

Track user actions:

```typescript
const analyticsMiddleware = (set, get) => (next) => async (partial) => {
  const state = get();
  const actionName = typeof partial === 'function' ? 'update' : Object.keys(partial)[0];

  // Send to analytics
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({
      action: actionName,
      timestamp: Date.now(),
      previousState: state,
    }),
  });

  await next(partial);
};
```

### 5. Debounce Middleware

Debounce frequent updates (useful for search, typing, etc.):

```typescript
const debounceMiddleware = (ms: number) => {
  let timeoutId: NodeJS.Timeout;

  return (set, get) => (next) => async (partial) => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(async () => {
      await next(partial);
      console.log('⏱️ Debounced update applied');
    }, ms);
  };
};

// Usage: Wait 300ms before updating search
const useSearchStore = create(
  (set) => ({
    query: '',
    setQuery: (query: string) => set({ query }),
  }),
  debounceMiddleware(300)
);
```

## Real-World Example

Let's combine multiple middleware for a complete user store:

```typescript
type UserStore = {
  user: null | { id: number; email: string; name: string }
  isLoading: boolean
  error: null | string
  setUser: (user: any) => void
  logout: () => void
}

const useUserStore = create<UserStore>(
  (set, get) => {
    // Load persisted user
    const saved = localStorage.getItem('user');
    const initialUser = saved ? JSON.parse(saved) : null;

    return {
      user: initialUser,
      isLoading: false,
      error: null,
      
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, error: null }),
    };
  },
  [
    // Logger first
    (set, get) => (next) => async (partial) => {
      console.log('Updating:', partial);
      await next(partial);
    },
    
    // Validation
    (set, get) => (next) => async (partial) => {
      const updates = typeof partial === 'function' ? partial(get()) : partial;
      if ('user' in updates && updates.user && !updates.user.email?.includes('@')) {
        console.error('Invalid email');
        return;
      }
      await next(partial);
    },
    
    // Persistence
    (set, get) => (next) => async (partial) => {
      await next(partial);
      if ('user' in get()) {
        localStorage.setItem('user', JSON.stringify(get().user));
      }
    },
  ]
);
```

## Best Practices

### 1. Keep Middleware Pure

Middleware should not modify external state directly:

```typescript
// ✅ Good
const middleware = (set, get) => (next) => async (partial) => {
  console.log('Updating');
  await next(partial);
};

// ❌ Bad
let counter = 0;
const badMiddleware = (set, get) => (next) => async (partial) => {
  counter++; // Side effect!
  await next(partial);
};
```

### 2. Call `next` Only Once

```typescript
// ✅ Good
const middleware = (set, get) => (next) => async (partial) => {
  console.log('Before');
  await next(partial);
  console.log('After');
};

// ❌ Bad - causes issues
const badMiddleware = (set, get) => (next) => async (partial) => {
  await next(partial);
  set(partial); // Calls middleware again!
};
```

### 3. Order Matters

```typescript
// This logs, then persists
const store1 = create(initialState, [loggerMiddleware, persistenceMiddleware]);

// This persists, then logs
const store2 = create(initialState, [persistenceMiddleware, loggerMiddleware]);

// Same middlewares, different behavior!
```

### 4. Handle Errors Gracefully

```typescript
const safeMiddleware = (set, get) => (next) => async (partial) => {
  try {
    await next(partial);
  } catch (error) {
    console.error('Middleware error:', error);
    // Handle gracefully - maybe revert state
  }
};
```

## Performance Tips

### 1. Keep Middleware Lightweight

Avoid heavy computations inside middleware:

```typescript
// ✅ Lightweight
const middleware = (set, get) => (next) => async (partial) => {
  console.log('Update');
  await next(partial);
};

// ❌ Heavy computation
const heavyMiddleware = (set, get) => (next) => async (partial) => {
  const result = await runExpensiveCalculation();
  await next(partial);
};
```

### 2. Consider Conditional Middleware

```typescript
const conditionalLogger = 
  process.env.NODE_ENV === 'development' 
    ? loggerMiddleware 
    : (set, get) => (next) => (partial) => next(partial);

const useStore = create(initialState, conditionalLogger);
```

## Testing Middleware

```typescript
describe('loggerMiddleware', () => {
  it('should log state changes', async () => {
    const logs: any[] = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args);

    const useStore = create(
      (set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }),
      (set, get) => (next) => async (partial) => {
        console.log('Updating:', partial);
        await next(partial);
      }
    );

    useStore.setState((state) => ({ count: state.count + 1 }));

    expect(logs.length).toBeGreaterThan(0);
    console.log = originalLog;
  });
});
```

## Conclusion

Zustic middleware provides a clean, functional approach to extending state management:

✅ **Simple** - Easy to understand and create
✅ **Composable** - Chain multiple middleware together
✅ **Powerful** - Handle logging, persistence, validation, and more
✅ **Flexible** - Create custom middleware for any use case

Start using middleware to build more robust, observable, and maintainable state management!

**Next Steps:**
- Check out the [Middleware Guide](/docs/tutorial-extras/middleware) for complete documentation
- See [Advanced Examples](/docs/tutorial-extras/advanced-examples) for complex middleware patterns
- Read our [Best Practices](/docs/tutorial-extras/best-practices) guide
