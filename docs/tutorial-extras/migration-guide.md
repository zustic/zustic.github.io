---
sidebar_position: 4
---

# Migration Guide

Learn how to migrate from other state management solutions to Zustic.

## From Context API

If you're using React Context API, migrating to Zustic is straightforward.

### Context API Pattern

```typescript
// Before: Context API
import { createContext, useContext, useState } from 'react';

const CounterContext = createContext<{
  count: number;
  setCount: (count: number) => void;
} | null>(null);

export function CounterProvider({ children }) {
  const [count, setCount] = useState(0);

  return (
    <CounterContext.Provider value={{ count, setCount }}>
      {children}
    </CounterContext.Provider>
  );
}

function useCounter() {
  const context = useContext(CounterContext);
  if (!context) throw new Error('useCounter must be used within CounterProvider');
  return context;
}

// Component
function App() {
  return (
    <CounterProvider>
      <Counter />
    </CounterProvider>
  );
}

function Counter() {
  const { count, setCount } = useCounter();
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### Zustic Pattern

```typescript
// After: Zustic
import { create } from 'zustic';

const useCounter = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// No provider needed!
function App() {
  return <Counter />;
}

function Counter() {
  const { count, increment } = useCounter();
  return <button onClick={increment}>{count}</button>;
}
```

### Benefits

- ✅ No provider wrapper needed
- ✅ No context drilling
- ✅ Simpler code
- ✅ Better performance (no unnecessary re-renders)

## From Redux

Redux to Zustic migration example:

### Redux Pattern

```typescript
// Before: Redux
import { createSlice, configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';

// Slice
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
  },
});

// Store
export const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
  },
});

// Hooks
export const { increment, decrement } = counterSlice.actions;

// Component
function Counter() {
  const dispatch = useDispatch();
  const count = useSelector((state) => state.counter.value);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(decrement())}>-</button>
    </div>
  );
}
```

### Zustic Pattern

```typescript
// After: Zustic
import { create } from 'zustic';

// Store
export const useCounter = create((set) => ({
  value: 0,
  increment: () => set((state) => ({ value: state.value + 1 })),
  decrement: () => set((state) => ({ value: state.value - 1 })),
}));

// Component
function Counter() {
  const { value, increment, decrement } = useCounter();

  return (
    <div>
      <p>Count: {value}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}
```

### Migration Steps

1. **Remove Redux setup**
   ```bash
   npm uninstall redux react-redux @reduxjs/toolkit
   ```

2. **Create Zustic store**
   ```typescript
   import { create } from 'zustic';

   export const useStore = create((set) => ({
     // Move your state here
     // Convert reducers to actions
   }));
   ```

3. **Update components**
   - Replace `useSelector` with hook destructuring
   - Replace `useDispatch` with direct action calls
   - Remove `dispatch(action())` - just call the action directly

### Benefits

- ✅ Much less boilerplate
- ✅ Easier to learn
- ✅ Faster to implement
- ✅ Smaller bundle size

## From Zustand

Zustic is inspired by Zustand but with some differences:

### Zustand Pattern

```typescript
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

### Zustic Pattern

```typescript
import { create } from 'zustic';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

The API is very similar! Main differences:

| Feature | Zustand | Zustic |
|---------|---------|--------|
| Bundle Size | ~2KB | ~500B |
| Dependencies | 1 | 0 (React only) |
| Learning Curve | Easy | Very Easy |
| Middleware | Yes | No |
| DevTools | Yes | No |

Migration is as simple as changing the import:

```typescript
// Change this
import { create } from 'zustand';

// To this
import { create } from 'zustic';
```

## From MobX

MobX to Zustic migration:

### MobX Pattern

```typescript
// Before: MobX
import { makeAutoObservable } from 'mobx';
import { useLocalObservable } from 'mobx-react-lite';

class CounterStore {
  count = 0;

  constructor() {
    makeAutoObservable(this);
  }

  increment() {
    this.count++;
  }

  decrement() {
    this.count--;
  }
}

function Counter() {
  const store = useLocalObservable(() => new CounterStore());

  return (
    <div>
      <p>Count: {store.count}</p>
      <button onClick={() => store.increment()}>+</button>
      <button onClick={() => store.decrement()}>-</button>
    </div>
  );
}
```

### Zustic Pattern

```typescript
// After: Zustic
import { create } from 'zustic';

const useCounter = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

function Counter() {
  const { count, increment, decrement } = useCounter();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}
```

### Benefits

- ✅ No class-based approach
- ✅ No decorators needed
- ✅ Simpler syntax
- ✅ Better TypeScript support

## Migration Checklist

When migrating to Zustic, follow this checklist:

### 1. Inventory Your State

- List all global state management solutions currently used
- Identify where state is defined (Redux slices, Context providers, MobX stores, etc.)

### 2. Create Zustic Stores

- Create a new store file for each piece of global state
- Convert actions/reducers to simple functions
- Add proper TypeScript types

### 3. Update Components

- Replace old hooks with new Zustic hooks
- Remove dispatch calls or context consumption
- Update event handlers to call actions directly

### 4. Remove Dependencies

- Uninstall old state management libraries
- Update package.json

### 5. Test Everything

- Run existing tests
- Write new tests for stores
- Manual testing in browser/app

### 6. Clean Up

- Remove old provider wrappers
- Delete old store files
- Update imports throughout project

## Code Example: Complete Migration

### Before (Redux)

```typescript
// store/counterSlice.ts
import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1; },
    decrement: (state) => { state.value -= 1; },
  },
});

export default slice.reducer;
export const { increment, decrement } = slice.actions;

// App.tsx
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './store/counterSlice';

const store = configureStore({
  reducer: { counter: counterReducer },
});

function App() {
  return (
    <Provider store={store}>
      <Counter />
    </Provider>
  );
}

// components/Counter.tsx
import { useDispatch, useSelector } from 'react-redux';
import { increment, decrement } from '../store/counterSlice';

function Counter() {
  const dispatch = useDispatch();
  const value = useSelector((state) => state.counter.value);

  return (
    <div>
      <p>{value}</p>
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(decrement())}>-</button>
    </div>
  );
}
```

### After (Zustic)

```typescript
// store/counterStore.ts
import { create } from 'zustic';

interface CounterStore {
  value: number;
  increment: () => void;
  decrement: () => void;
}

export const useCounterStore = create<CounterStore>((set) => ({
  value: 0,
  increment: () => set((state) => ({ value: state.value + 1 })),
  decrement: () => set((state) => ({ value: state.value - 1 })),
}));

// App.tsx
import Counter from './components/Counter';

function App() {
  return <Counter />;
}

// components/Counter.tsx
import { useCounterStore } from '../store/counterStore';

function Counter() {
  const { value, increment, decrement } = useCounterStore();

  return (
    <div>
      <p>{value}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}
```

## Comparison Table

| Aspect | Redux | Zustand | MobX | Zustic |
|--------|-------|---------|------|--------|
| Bundle Size | 7KB | 2KB | 13KB | ~500B |
| Learning Curve | Hard | Easy | Medium | Very Easy |
| Boilerplate | Lots | Minimal | Medium | Minimal |
| TypeScript | ✅ | ✅ | ✅ | ✅ |
| DevTools | ✅ | ✅ | ✅ | ❌ |
| Middleware | ✅ | ✅ | ❌ | ❌ |
| Complexity | High | Low | Medium | Very Low |

Choose what works best for your project!
