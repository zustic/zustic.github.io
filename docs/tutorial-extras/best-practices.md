---
sidebar_position: 3
---

# Best Practices

Learn the recommended patterns and approaches for using Zustic effectively.

## 1. Organize Your Stores

Keep stores organized in a dedicated directory structure:

### Recommended Structure

```
src/
├── stores/
│   ├── index.ts           # Central export point
│   ├── counterStore.ts
│   ├── userStore.ts
│   ├── authStore.ts
│   ├── appStore.ts
│   └── types.ts           # Shared types
├── components/
├── hooks/
└── utils/
```

### Central Export File

```typescript
// src/stores/index.ts
export { useCounterStore } from './counterStore';
export { useUserStore } from './userStore';
export { useAuthStore } from './authStore';
export { useAppStore } from './appStore';

// Export types
export type { CounterStore } from './counterStore';
export type { UserStore } from './userStore';
```

### Usage in Components

```typescript
// ✅ Good - import from central location
import { useCounterStore, useUserStore } from '@/stores';

// ❌ Avoid - scattered imports
import { useCounterStore } from '@/stores/counterStore';
import { useUserStore } from '@/stores/userStore';
```

## 2. Type Your Store Properly

Always define proper TypeScript interfaces for type safety:

```typescript
import { create } from 'zustic';

// Define a clear interface
interface CounterState {
  // State
  count: number;
  history: number[];

  // Actions
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  getHistory: () => number[];
}

export const useCounter = create<CounterState>((set, get) => ({
  count: 0,
  history: [],

  increment: () =>
    set((state) => ({
      count: state.count + 1,
      history: [...state.history, state.count],
    })),

  decrement: () =>
    set((state) => ({
      count: state.count - 1,
      history: [...state.history, state.count],
    })),

  reset: () => set({ count: 0, history: [] }),

  getHistory: () => get().history,
}));
```

## 3. Keep State Flat

Flatten your state structure for better performance and easier updates:

### ✅ Flat Structure (Recommended)

```typescript
const useUserStore = create((set) => ({
  userId: '123',
  userName: 'John',
  userEmail: 'john@example.com',
  userRole: 'admin',
  userAge: 30,

  setUserInfo: (name, email, age) =>
    set({
      userName: name,
      userEmail: email,
      userAge: age,
    }),
}));
```

### ❌ Deeply Nested (Avoid)

```typescript
const useUserStore = create((set) => ({
  user: {
    profile: {
      personal: {
        name: 'John',
        email: 'john@example.com',
      },
      settings: {
        notifications: true,
      },
    },
  },

  // Very complex updates needed
  setUserName: (name) =>
    set((state) => ({
      user: {
        ...state.user,
        profile: {
          ...state.user.profile,
          personal: {
            ...state.user.profile.personal,
            name,
          },
        },
      },
    })),
}));
```

## 4. Use Immutable Updates

Always create new objects instead of mutating existing state:

### ✅ Immutable Updates

```typescript
// Adding to array
set((state) => ({
  items: [...state.items, newItem],
}));

// Removing from array
set((state) => ({
  items: state.items.filter((item) => item.id !== id),
}));

// Updating object property
set((state) => ({
  user: { ...state.user, name: 'New Name' },
}));

// Mapping array
set((state) => ({
  items: state.items.map((item) =>
    item.id === id ? { ...item, completed: true } : item
  ),
}));
```

### ❌ Mutations to Avoid

```typescript
// Direct array mutation
set((state) => {
  state.items.push(newItem);  // ❌ Mutates!
  return state;
});

// Direct object mutation
set((state) => {
  state.user.name = 'New Name';  // ❌ Mutates!
  return state;
});

// Reassigning array elements
set((state) => {
  state.items[0] = newItem;  // ❌ Mutates!
  return state;
});
```

## 5. Separate Concerns

Create separate stores for different parts of your application:

### ✅ Separate Stores

```typescript
// Authentication logic
const useAuthStore = create((set) => ({
  isAuthenticated: false,
  login: () => set({ isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false }),
}));

// User data
const useUserStore = create((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
}));

// UI state
const useUIStore = create((set) => ({
  isDarkMode: false,
  toggleDarkMode: () =>
    set((state) => ({ isDarkMode: !state.isDarkMode })),
}));
```

### ❌ Single Monolithic Store

```typescript
const useAppStore = create((set) => ({
  // Auth
  isAuthenticated: false,
  login: () => set({ isAuthenticated: true }),

  // User
  profile: null,
  setProfile: (profile) => set({ profile }),

  // UI
  isDarkMode: false,
  toggleDarkMode: () =>
    set((state) => ({ isDarkMode: !state.isDarkMode })),

  // ... many more features
}));
```

## 6. Error Handling

Always handle errors gracefully in async operations:

```typescript
interface AsyncStore {
  data: T | null;
  loading: boolean;
  error: Error | null;
  fetch: (query: string) => Promise<void>;
  reset: () => void;
}

export const useDataStore = create<AsyncStore>((set) => ({
  data: null,
  loading: false,
  error: null,

  fetch: async (query: string) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`/api/data?q=${query}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      set({ data, loading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      set({
        error: new Error(errorMessage),
        loading: false,
      });
    }
  },

  reset: () => set({ data: null, error: null }),
}));
```

## 7. Naming Conventions

Use clear, consistent naming for stores and actions:

```typescript
// Store naming - use 'use' prefix and descriptive names
const useCounterStore = create((set) => ({...}));
const useUserStore = create((set) => ({...}));
const useAuthStore = create((set) => ({...}));

// Action naming
const useStore = create((set) => ({
  // Getters - start with 'get'
  getTotal: () => {...},
  getActiveItems: () => {...},

  // Setters - start with 'set'
  setName: (name: string) => set({name}),
  setActive: (active: boolean) => set({active}),

  // Toggles - start with 'toggle'
  toggleVisibility: () => set((state) => ({...})),
  toggleDarkMode: () => set((state) => ({...})),

  // Fetchers - start with 'fetch'
  fetchUsers: async () => {...},
  fetchData: async () => {...},

  // Handlers - start with 'handle' or specific verb
  handleSubmit: (data) => {...},
  addItem: (item) => {...},
  removeItem: (id) => {...},
}));
```

## 8. Optimization Tips

### Minimize Subscriptions

```typescript
// ✅ Subscribe only to needed state
const count = useStore((state) => state.count);
const name = useStore((state) => state.name);

// ❌ Subscribe to entire store when you need one property
const { count } = useStore(); // Re-renders on any state change
```

### Use Memoization

```typescript
import { memo, useMemo } from 'react';

// Memoize heavy components
const UserCard = memo(function UserCard({ userId }: { userId: string }) {
  const user = useUserStore((state) =>
    state.users.find((u) => u.id === userId)
  );

  return <div>{user?.name}</div>;
});

// Memoize computed values
function UserStats() {
  const scores = useStatsStore((state) => state.scores);

  const average = useMemo(
    () => scores.reduce((a, b) => a + b, 0) / scores.length,
    [scores]
  );

  return <div>Average: {average}</div>;
}
```

### Split Large Stores

For applications with extensive state, split into multiple stores:

```typescript
// Instead of one massive store
const useAppStore = create((set) => ({
  // 50+ properties and methods...
}));

// Use multiple focused stores
const useAuthStore = create((set) => ({...}));
const useUserStore = create((set) => ({...}));
const useCartStore = create((set) => ({...}));
const useUIStore = create((set) => ({...}));
const useSettingsStore = create((set) => ({...}));
```

## 9. Testing Stores

Make your stores testable:

```typescript
// Store definition
export const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 }),
}));

// Example test
describe('useCounterStore', () => {
  beforeEach(() => {
    // Reset state between tests
    useCounterStore.setState({ count: 0 });
  });

  test('should increment count', () => {
    const store = useCounterStore.getState();
    store.increment();
    expect(store.count).toBe(1);
  });

  test('should reset count', () => {
    const store = useCounterStore.getState();
    store.increment();
    store.reset();
    expect(store.count).toBe(0);
  });
});
```

## 10. Documentation

Document your stores clearly:

```typescript
/**
 * Counter store for managing application-wide counter state.
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const { count, increment, decrement } = useCounterStore();
 *   return <button onClick={increment}>{count}</button>;
 * }
 * ```
 */
interface CounterStore {
  /** Current count value */
  count: number;

  /** Increments the count by 1 */
  increment: () => void;

  /** Decrements the count by 1 */
  decrement: () => void;

  /** Resets count to 0 */
  reset: () => void;
}

export const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));
```

By following these best practices, you'll write cleaner, more maintainable Zustic code!
