---
sidebar_position: 1
---

# API Reference

Complete reference for the Zustic API.

## `create<T>(initializer, middlewares?)`

The main function to create a store.

### Parameters

- **`initializer`** `(set: SetFunction<T>, get: GetFunction<T>) => T`
  - A function that receives the `set` and `get` functions and returns the initial state object
  - The `set` function is used to update the state
  - The `get` function retrieves the current state

- **`middlewares`** (optional) `Middleware<T>[]`
  - Array of middleware functions for intercepting state updates
  - Useful for logging, persistence, debugging, etc.

### Returns

A React hook that provides access to the store state.

### Type Parameters

- **`T`** - The type of your store state (must extend `object`)

### Example

```typescript
import { create } from 'zustic';

interface MyStore {
  count: number;
  increment: () => void;
  getDoubled: () => number;
}

const useMyStore = create<MyStore>((set, get) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  getDoubled: () => get().count * 2,
}));
```

## `set` Function

The function passed to the initializer for updating state.

### Signature

```typescript
set(partial: Partial<T> | ((state: T) => Partial<T>)) => void
```

### Parameters

#### Direct Update (Object)

```typescript
set({ count: 5 })
set({ count: 0, name: 'John' })
```

#### Functional Update (Function)

```typescript
set((state) => ({ count: state.count + 1 }))
set((state) => ({
  items: [...state.items, newItem],
}))
```

### Return Value

Returns `void`. Updates are synchronous.

## `get` Function

Access the current state within actions.

### Signature

```typescript
get: () => T
```

### Purpose

Get the current state at any time. Useful for:
- Reading current state in actions
- Computing values based on state
- Avoiding stale closures in async operations

### Example

```typescript
const useStore = create((set, get) => ({
  count: 0,
  name: '',
  
  increment: () => set((state) => ({ count: state.count + 1 })),
  
  // Using get to read current state
  logCount: () => {
    const currentState = get();
    console.log('Count is:', currentState.count);
  },
  
  // Computing derived values
  getInfo: () => {
    const state = get();
    return `${state.name}: ${state.count}`;
  },
  
  // Avoiding stale closures in async
  fetchData: async () => {
    await delay(1000);
    const state = get(); // Gets fresh state
    console.log('Current count:', state.count);
  },
}));
```

## Middleware

Middleware functions intercept and modify state updates.

### Signature

```typescript
type Middleware<T> = (
  set: (partial: SetSateParams<T>) => void,
  get: () => T
) => (
  next: (partial: SetSateParams<T>) => void
) => (partial: SetSateParams<T>) => void
```

### Parameters

- **`set`** - Function to update state
- **`get`** - Function to read current state
- **`next`** - The next middleware or state update function

### Using Middleware

Pass middleware as the second parameter to `create`:

```typescript
const useStore = create<MyStore>(
  (set, get) => ({
    // Your store definition
  }),
  [middleware1, middleware2] // Array of middleware
);
```

### Example: Logger Middleware

```typescript
const logger = (set, get) => (next) => async (partial) => {
  console.log('Previous state:', get());
  await next(partial);
  console.log('Updated state:', get());
};

const useStore = create(
  (set, get) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }),
  [logger]
);
```

### Example: Persistence Middleware

```typescript
const persist = (set, get) => (next) => async (partial) => {
  await next(partial);
  // Save to localStorage after every update
  const state = get();
  localStorage.setItem('store', JSON.stringify(state));
};

const useStore = create(
  (set, get) => ({
    count: JSON.parse(localStorage.getItem('store') || '{}').count || 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }),
  [persist]
);
```

### Example: Validation Middleware

```typescript
const validator = (set, get) => (next) => async (partial) => {
  const partialState = typeof partial === 'function' 
    ? partial(get()) 
    : partial;
  
  // Validate before updating
  if (partialState.count < 0) {
    console.warn('Count cannot be negative');
    return;
  }
  
  await next(partial);
};

const useStore = create(
  (set, get) => ({
    count: 0,
    decrement: () => set((state) => ({ count: state.count - 1 })),
  }),
  [validator]
);
```

### Chaining Multiple Middleware

Middleware are applied from right to left (like Redux):

```typescript
const useStore = create(
  (set, get) => ({...}),
  [middleware1, middleware2, middleware3]
  // Execution order: middleware1 → middleware2 → middleware3 → setState
);
```

## Hook Usage

### Basic Usage

```typescript
const { count, increment } = useMyStore();
```

### With Selector

Select specific state values:

```typescript
const count = useMyStore((state) => state.count);
const increment = useMyStore((state) => state.increment);
```

### Full State

Get the entire state object:

```typescript
const state = useMyStore();
```

## Advanced Patterns

### Multiple Stores

You can create and use multiple independent stores:

```typescript
const useCounterStore = create((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
}));

const useUserStore = create((set) => ({
  name: '',
  setName: (name: string) => set({ name }),
}));

function App() {
  const counter = useCounterStore();
  const user = useUserStore();
  // Use both stores
}
```

### Nested State Updates

For nested objects, spread the parent object:

```typescript
const useStore = create((set) => ({
  user: { name: 'John', age: 30 },
  updateUser: (updates: Partial<User>) =>
    set((state) => ({
      user: { ...state.user, ...updates },
    })),
}));
```

### Array Manipulation

Use array methods to update arrays immutably:

```typescript
const useStore = create((set) => ({
  items: [] as Item[],

  addItem: (item: Item) =>
    set((state) => ({
      items: [...state.items, item],
    })),

  removeItem: (id: string) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  updateItem: (id: string, updates: Partial<Item>) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),
}));
```

### Conditional Updates

```typescript
const useStore = create((set) => ({
  count: 0,
  incrementIfEven: () =>
    set((state) => ({
      count: state.count % 2 === 0 ? state.count + 1 : state.count,
    })),
}));
```

### Batch Updates

Update multiple properties at once:

```typescript
const useCatalogStore = create((set) => ({
  items: [],
  filters: {},
  sorting: 'name',
  isLoading: false,

  loadItems: async (query: string) => {
    set({ isLoading: true });
    try {
      const data = await fetchItems(query);
      set({
        items: data,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },
}));
```

## TypeScript Support

Zustic has full TypeScript support with proper type inference.

### Typing State

```typescript
interface AppState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  fetchUser: (id: string) => Promise<void>;
  clearUser: () => void;
}

const useAppStore = create<AppState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  fetchUser: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await api.getUser(id);
      set({ user, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  clearUser: () => set({ user: null }),
}));
```

### Type-Safe Selectors

```typescript
// Selector with proper typing
const userName = useAppStore((state) => state.user?.name ?? 'Guest');
const count = useCounterStore((state) => state.count);
```

## Performance Considerations

### Minimize Subscriptions

Only subscribe to the state you need:

```typescript
// ✅ Good - only subscribes to count
const count = useStore((state) => state.count);

// ❌ Unnecessary - subscribes to entire store
const { count } = useStore();
```

### Memoization

Memoize components that depend on store state:

```typescript
import { memo } from 'react';

const Counter = memo(function Counter() {
  const count = useStore((state) => state.count);
  return <div>{count}</div>;
});
```

### Split Large Stores

For large applications, split state into multiple stores:

```typescript
// ✅ Good - separate concerns
const useUserStore = create((set) => ({...}));
const useCartStore = create((set) => ({...}));
const useUIStore = create((set) => ({...}));

// ❌ Bad - everything in one store
const useAppStore = create((set) => ({...})); // Too much state
```

## Common Patterns

### Loading States

```typescript
const useDataStore = create((set) => ({
  data: null,
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.getData();
      set({ data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));
```

### Theme Management

```typescript
type Theme = 'light' | 'dark';

const useThemeStore = create((set) => ({
  theme: 'light' as Theme,
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),
}));
```

### Form State

```typescript
const useFormStore = create((set) => ({
  values: { email: '', password: '' },
  errors: {} as Record<string, string>,

  setField: (field: string, value: string) =>
    set((state) => ({
      values: { ...state.values, [field]: value },
    })),

  setError: (field: string, error: string) =>
    set((state) => ({
      errors: { ...state.errors, [field]: error },
    })),

  reset: () =>
    set({
      values: { email: '', password: '' },
      errors: {},
    }),
}));
```

## Troubleshooting

### State Not Updating?

Make sure you're using the `set` function correctly:

```typescript
// ❌ Wrong - missing set
const increment = () => ({ count: state.count + 1 });

// ✅ Correct
const increment = () => set((state) => ({ count: state.count + 1 }));
```

### Component Not Re-rendering?

Ensure you're using the hook at the top level:

```typescript
// ❌ Wrong - hook called conditionally
if (condition) {
  const count = useStore((state) => state.count);
}

// ✅ Correct - hook at top level
const count = useStore((state) => state.count);
if (condition) {
  // Use count here
}
```

### Type Errors?

Make sure your store is properly typed:

```typescript
// Define interface first
interface MyStore {
  count: number;
  increment: () => void;
}

// Then create with type
const useStore = create<MyStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```
