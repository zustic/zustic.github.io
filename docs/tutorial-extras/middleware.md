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

## Middleware Signature

```typescript
type Middleware<T> = (
  set: (partial: SetSateParams<T>) => void,
  get: () => T
) => (
  next: (partial: SetSateParams<T>) => void
) => (partial: SetSateParams<T>) => void
```

Breaking it down:

1. **Outer function** receives `set` and `get`
2. **Middle function** receives `next` (the next middleware or setState)
3. **Inner function** receives the actual update `partial`

## Creating a Middleware

### Basic Logger Middleware

```typescript
const logger = (set, get) => (next) => async (partial) => {
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
const useStore = create(
  (set, get) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }),
  [logger] // Single middleware
);
```

### Multiple Middleware

```typescript
const useStore = create(
  (set, get) => ({...}),
  [middleware1, middleware2, middleware3]
);

// Execution order:
// middleware1 → middleware2 → middleware3 → setState
```

Middleware are applied from left to right, each wrapping the next.

## Common Middleware Patterns

### 1. Logging Middleware

Track all state changes:

```typescript
const loggerMiddleware = (set, get) => (next) => async (partial) => {
  const prev = get();
  const timestamp = new Date().toISOString();

  console.group(`🔵 State Update - ${timestamp}`);
  console.log('Previous:', prev);
  console.log('Update:', partial);

  await next(partial);

  console.log('New:', get());
  console.groupEnd();
};
```

### 2. Persistence Middleware

Auto-save to localStorage:

```typescript
const persistMiddleware = (key: string) => (set, get) => (next) => async (partial) => {
  await next(partial);

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
    const saved = localStorage.getItem('mystore');
    return {
      ...JSON.parse(saved || '{}'),
      increment: () => set((state) => ({ count: state.count + 1 })),
    };
  },
  [persistMiddleware('mystore')]
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
    console.warn('❌ Age cannot be negative');
    return;
  }

  if ('email' in updates && !updates.email.includes('@')) {
    console.warn('❌ Invalid email');
    return;
  }

  await next(partial);
  console.log('✅ Validation passed');
};
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
      console.log('⏱️ Debounced update applied');
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
  console.log('⏳ Processing...');

  try {
    await next(partial);
    console.log('✅ Update completed');
  } catch (error) {
    console.error('❌ Update failed:', error);
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
      console.warn('⚠️ Rate limit exceeded');
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
// ✅ Good
const middleware = (set, get) => (next) => async (partial) => {
  console.log('Updating');
  await next(partial);
};

// ❌ Bad - modifying external state
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
// ❌ Bad - causes infinite loop
const badMiddleware = (set, get) => (next) => async (partial) => {
  await next(partial);
  set(partial); // Calls middleware again!
};

// ✅ Good - call next only once
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
// ❌ Don't do heavy work in middleware
const badMiddleware = (set, get) => (next) => async (partial) => {
  const expensiveCalculation = await runHeavyComputation();
  await next(partial);
};

// ✅ Keep middleware lightweight
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
