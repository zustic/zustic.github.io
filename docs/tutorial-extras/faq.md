---
sidebar_position: 5
---

# Troubleshooting & FAQ

Solutions to common issues and frequently asked questions.

## Troubleshooting

### Issue: State Not Updating

**Problem**: You update state with `set()`, but the state doesn't change.

**Solution**: Make sure you're using `set` correctly:

```typescript
// ❌ Wrong - trying to access state outside of set function
const increment = () => {
  state.count += 1; // state is undefined!
};

// ✅ Correct - use set with functional update
const increment = () => set((state) => ({ count: state.count + 1 }));
```

### Issue: Component Not Re-rendering

**Problem**: State updates but component doesn't re-render.

**Possible Causes**:

1. **Hook not used at top level**
   ```typescript
   // ❌ Wrong - conditional hook call
   if (someCondition) {
     const count = useStore((state) => state.count);
   }

   // ✅ Correct - call at top level
   const count = useStore((state) => state.count);
   if (someCondition) {
     // use count here
   }
   ```

2. **Mutating instead of creating new object**
   ```typescript
   // ❌ Wrong - mutates existing object
   set((state) => {
     state.items[0].name = 'Updated';
     return state;
   });

   // ✅ Correct - creates new object
   set((state) => ({
     items: state.items.map((item, i) =>
       i === 0 ? { ...item, name: 'Updated' } : item
     ),
   }));
   ```

### Issue: TypeScript Type Errors

**Problem**: TypeScript complains about store types.

**Solution**: Properly type your store interface:

```typescript
// ✅ Good - define interface first
interface MyStore {
  count: number;
  name: string;
  increment: () => void;
  setName: (name: string) => void;
}

const useStore = create<MyStore>((set) => ({
  count: 0,
  name: '',
  increment: () => set((state) => ({ count: state.count + 1 })),
  setName: (name) => set({ name }),
}));
```

### Issue: "Cannot find module 'zustic'"

**Problem**: Import error for Zustic.

**Solution**: Make sure Zustic is installed:

```bash
npm install zustic
# or
yarn add zustic
# or
pnpm add zustic
```

Verify installation:

```bash
npm list zustic
```

### Issue: Memory Leaks in React Native

**Problem**: State subscriptions not being cleaned up.

**Solution**: This is handled automatically by Zustic. If you see memory leaks:

1. Ensure components are properly unmounting
2. Avoid creating stores inside components
3. Create stores at module level:

```typescript
// ✅ Good - store at module level
const useStore = create((set) => ({...}));

function MyComponent() {
  const state = useStore();
  return <div>{state.count}</div>;
}

// ❌ Bad - store created on every render
function MyComponent() {
  const useStore = create((set) => ({...})); // Creates new store each render!
  return <div></div>;
}
```

### Issue: Stale Closures in Async Functions

**Problem**: Old state values in async callbacks.

**Solution**: Use a getter function to access current state:

```typescript
// ❌ Wrong - stale closure
const useStore = create((set, get) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  asyncAction: async () => {
    await delay(1000);
    set((state) => ({ count: state.count + 1 })); // Uses stale state
  },
}));

// ✅ Correct - use get() for current state
const useStore = create((set, get) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  asyncAction: async () => {
    await delay(1000);
    const currentState = get(); // Gets current state
    set({ count: currentState.count + 1 });
  },
}));
```

## FAQ

### Q: Should I create one store or multiple stores?

**A**: Create multiple stores to separate concerns:

```typescript
// ✅ Good - separated concerns
const useAuthStore = create((set) => ({...})); // Auth logic
const useUserStore = create((set) => ({...})); // User data
const useUIStore = create((set) => ({...}));   // UI state

// ❌ Bad - all in one
const useAppStore = create((set) => ({
  // Auth, user, UI, cart, notifications, etc.
}));
```

### Q: How do I access state in multiple components?

**A**: Zustic is global by default - use the same hook in any component:

```typescript
// counterStore.ts
export const useCounter = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// ComponentA.tsx
function ComponentA() {
  const { count } = useCounter();
  return <div>Count: {count}</div>;
}

// ComponentB.tsx
function ComponentB() {
  const { increment } = useCounter();
  return <button onClick={increment}>Increment</button>;
}
```

### Q: How do I reset state?

**A**: Add a reset action to your store:

```typescript
const useStore = create((set) => ({
  count: 0,
  name: '',
  
  reset: () => set({ count: 0, name: '' }),
  
  // Or for complex resets
  hardReset: () => set({
    count: 0,
    name: '',
    // ... all initial state
  }),
}));
```

### Q: How do I access state in async operations?

**A**: Use the `get()` function to read current state:

```typescript
const useStore = create((set, get) => ({
  count: 0,

  asyncIncrement: async () => {
    await delay(1000);
    const currentState = get(); // Gets fresh state
    set({ count: currentState.count + 1 });
  },
}));
```

### Q: Can I use middleware?

**A**: Yes! Pass middleware as the second parameter:

```typescript
const logger = (set, get) => (next) => async (partial) => {
  console.log('Before:', get());
  await next(partial);
  console.log('After:', get());
};

const useStore = create(
  (set, get) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }),
  [logger]
);
```

### Q: What can I do with middleware?

**A**: Middleware can:
- Log state changes
- Persist state to localStorage
- Validate updates
- Track analytics
- Implement time-travel debugging
- Add custom behavior to all updates

### Q: Can I use Zustic with Next.js?

**A**: Yes! Mark stores with `'use client'`:

```typescript
// store/myStore.ts
'use client';

import { create } from 'zustic';

export const useStore = create((set) => ({...}));
```

### Q: How do I persist state to localStorage?

**A**: Save state when it updates:

```typescript
const useStore = create((set) => {
  // Load from localStorage
  const saved = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('store') || '{}')
    : {};

  return {
    count: saved.count ?? 0,
    increment: () => set((state) => {
      const newState = { count: state.count + 1 };
      localStorage.setItem('store', JSON.stringify(newState));
      return newState;
    }),
  };
});
```

Or create a helper:

```typescript
function createPersistentStore(key, initialState, creator) {
  const saved = JSON.parse(localStorage.getItem(key) || JSON.stringify(initialState));

  return create((set) => {
    const store = creator((newState) => {
      localStorage.setItem(key, JSON.stringify(newState));
      set(newState);
    });

    return { ...store, ...saved };
  });
}

const useStore = createPersistentStore('mystore', { count: 0 }, (set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

### Q: How do I handle async operations?

**A**: Use async functions in your actions:

```typescript
const useStore = create((set) => ({
  data: null,
  loading: false,
  error: null,

  fetchData: async (url) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(url);
      const data = await response.json();
      set({ data, loading: false });
    } catch (error) {
      set({
        error: error.message,
        loading: false,
      });
    }
  },
}));
```

### Q: Can I have computed/derived state?

**A**: Yes, use functions in your store:

```typescript
const useStore = create((set, get) => ({
  scores: [100, 200, 300],
  
  getAverage: () => {
    const { scores } = get();
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  },
  
  getMax: () => Math.max(...get().scores),
  
  getMin: () => Math.min(...get().scores),
}));

function Stats() {
  const store = useStore();
  return <div>Average: {store.getAverage()}</div>;
}
```

### Q: Should I use selectors in my components?

**A**: It's optional but can improve performance:

```typescript
// Selector - only subscribes to count
const count = useStore((state) => state.count);

// Full state - subscribes to entire store
const { count } = useStore();
```

Both work - use selectors when performance matters.

### Q: How do I test stores?

**A**: Use `getState()` to access state outside components:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useStore } from './store';

describe('Store', () => {
  test('should increment', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

### Q: Is Zustic suitable for large apps?

**A**: Yes! Use multiple stores for better organization:

```typescript
// authentication
const useAuthStore = create((set) => ({...}));

// user data
const useUserStore = create((set) => ({...}));

// products/catalog
const useProductStore = create((set) => ({...}));

// shopping cart
const useCartStore = create((set) => ({...}));

// notifications
const useNotificationStore = create((set) => ({...}));

// ui state
const useUIStore = create((set) => ({...}));
```

This keeps each store focused and manageable.

### Q: What's the performance impact?

**A**: Minimal! Zustic is very lightweight:

- Bundle size: ~500B (gzipped)
- Uses `useSyncExternalStore` for optimal subscriptions
- No unnecessary re-renders
- Better performance than Context API

### Q: Can I use Zustic with class components?

**A**: No, Zustic uses hooks which require functional components. If you need to use class components, you can:

1. Migrate to functional components
2. Use a wrapper component with hooks

```typescript
// Wrapper component
function CounterWrapper() {
  const { count, increment } = useCounter();
  return <MyClassComponent count={count} increment={increment} />;
}
```

### Q: How do I debug my stores?

**A**: Use React DevTools and console logging:

```typescript
const useStore = create((set) => ({
  count: 0,
  increment: () => {
    console.log('Before:', useStore.getState().count);
    set((state) => {
      console.log('Updating count:', state.count);
      return { count: state.count + 1 };
    });
    console.log('After:', useStore.getState().count);
  },
}));
```

### Q: Is there middleware support?

**A**: Zustic keeps things simple - no built-in middleware. For logging, use a wrapper:

```typescript
function createLoggedStore(creator) {
  return create((set) => {
    const store = creator((state) => {
      console.log('State update:', state);
      set(state);
    });
    return store;
  });
}
```

## Still Have Questions?

- 📖 [GitHub Discussions](https://github.com/DeveloperRejaul/zustic/discussions)
- 🐛 [Report Issues](https://github.com/DeveloperRejaul/zustic/issues)
- 💬 [GitHub Issues](https://github.com/DeveloperRejaul/zustic/issues)
