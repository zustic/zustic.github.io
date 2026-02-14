---
sidebar_position: 2
---

# Advanced Examples

Explore advanced patterns and real-world use cases with Zustic.

## 1. Combining Multiple Stores

Use multiple stores together for better organization:

```typescript
// stores/userStore.ts
interface User {
  id: string;
  name: string;
  email: string;
}

interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));

// stores/todosStore.ts
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  userId: string;
}

interface TodosStore {
  todos: Todo[];
  addTodo: (text: string, userId: string) => void;
  removeTodo: (id: string) => void;
  toggleTodo: (id: string) => void;
  getUserTodos: (userId: string) => Todo[];
}

export const useTodosStore = create<TodosStore>((set, get) => ({
  todos: [],
  addTodo: (text, userId) =>
    set((state) => ({
      todos: [
        ...state.todos,
        {
          id: crypto.randomUUID(),
          text,
          completed: false,
          userId,
        },
      ],
    })),
  removeTodo: (id) =>
    set((state) => ({
      todos: state.todos.filter((t) => t.id !== id),
    })),
  toggleTodo: (id) =>
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    })),
  getUserTodos: (userId) =>
    get().todos.filter((t) => t.userId === userId),
}));

// Component using both stores
function Dashboard() {
  const user = useUserStore((state) => state.user);
  const { addTodo, getUserTodos } = useTodosStore();
  const userTodos = user ? getUserTodos(user.id) : [];

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <div>
        <h2>Your Todos ({userTodos.length})</h2>
        {userTodos.map((todo) => (
          <div key={todo.id}>{todo.text}</div>
        ))}
      </div>
    </div>
  );
}
```

## 2. Complex State Updates

Handle complex state transformations:

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ShopStore {
  cart: Product[];
  total: number;
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  calculateTotal: () => number;
}

export const useShopStore = create<ShopStore>((set, get) => ({
  cart: [],
  total: 0,

  addToCart: (product) =>
    set((state) => {
      const existingItem = state.cart.find((p) => p.id === product.id);
      let newCart;

      if (existingItem) {
        newCart = state.cart.map((p) =>
          p.id === product.id
            ? { ...p, quantity: p.quantity + product.quantity }
            : p
        );
      } else {
        newCart = [...state.cart, product];
      }

      const total = newCart.reduce(
        (sum, p) => sum + p.price * p.quantity,
        0
      );

      return { cart: newCart, total };
    }),

  removeFromCart: (id) =>
    set((state) => {
      const newCart = state.cart.filter((p) => p.id !== id);
      const total = newCart.reduce(
        (sum, p) => sum + p.price * p.quantity,
        0
      );
      return { cart: newCart, total };
    }),

  updateQuantity: (id, quantity) =>
    set((state) => {
      const newCart = state.cart.map((p) =>
        p.id === id ? { ...p, quantity } : p
      );
      const total = newCart.reduce(
        (sum, p) => sum + p.price * p.quantity,
        0
      );
      return { cart: newCart, total };
    }),

  clearCart: () => set({ cart: [], total: 0 }),

  calculateTotal: () => {
    const state = get();
    return state.cart.reduce((sum, p) => sum + p.price * p.quantity, 0);
  },
}));
```

## 3. Computed Values & Derived State

Calculate derived values from your store state:

```typescript
interface StatsStore {
  scores: number[];
  addScore: (score: number) => void;
  getAverage: () => number;
  getHighest: () => number;
  getLowest: () => number;
  getMedian: () => number;
}

export const useStatsStore = create<StatsStore>((set, get) => ({
  scores: [],

  addScore: (score) =>
    set((state) => ({
      scores: [...state.scores, score],
    })),

  getAverage: () => {
    const { scores } = get();
    if (scores.length === 0) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  },

  getHighest: () => {
    const { scores } = get();
    return Math.max(...scores);
  },

  getLowest: () => {
    const { scores } = get();
    return Math.min(...scores);
  },

  getMedian: () => {
    const { scores } = get();
    const sorted = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  },
}));

function Stats() {
  const store = useStatsStore();
  const average = store.getAverage();
  const highest = store.getHighest();

  return (
    <div>
      <p>Average: {average.toFixed(2)}</p>
      <p>Highest: {highest}</p>
    </div>
  );
}
```

## 4. Next.js Integration

Using Zustic with Next.js:

```typescript
// app/store/counterStore.ts
'use client';

import { create } from 'zustic';

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

// app/components/Counter.tsx
'use client';

import { useCounterStore } from '@/app/store/counterStore';

export default function Counter() {
  const { count, increment, decrement } = useCounterStore();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}

// app/page.tsx
import Counter from './components/Counter';

export default function Home() {
  return (
    <main>
      <h1>Counter App</h1>
      <Counter />
    </main>
  );
}
```

## 5. React Native Usage

Using Zustic with React Native:

```typescript
import { create } from 'zustic';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ThemeStore {
  isDark: boolean;
  toggleTheme: () => void;
}

const useThemeStore = create<ThemeStore>((set) => ({
  isDark: false,
  toggleTheme: () =>
    set((state) => ({ isDark: !state.isDark })),
}));

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
  },
});

function App() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000' : '#fff' },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: isDark ? '#fff' : '#000' },
        ]}
      >
        {isDark ? 'Dark Mode' : 'Light Mode'}
      </Text>
      <TouchableOpacity onPress={toggleTheme}>
        <Text style={{ color: isDark ? '#fff' : '#000' }}>
          Toggle Theme
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default App;
```

## 6. Async Operations

Handling async state updates:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

interface UserStore {
  user: User | null;
  loading: boolean;
  error: string | null;
  fetchUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: false,
  error: null,

  fetchUser: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const user = await response.json();
      set({ user, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false,
      });
    }
  },
}));

function UserProfile({ userId }: { userId: string }) {
  const { user, loading, error, fetchUser } = useUserStore();

  React.useEffect(() => {
    fetchUser(userId);
  }, [userId, fetchUser]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

## 7. Form Management

Complete form handling with Zustic:

```typescript
interface FormState {
  values: Record<string, string>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setField: (name: string, value: string) => void;
  setError: (name: string, error: string) => void;
  setTouched: (name: string) => void;
  reset: () => void;
}

const initialValues = {
  email: '',
  password: '',
  name: '',
};

export const useFormStore = create<FormState>((set) => ({
  values: initialValues,
  errors: {},
  touched: {},

  setField: (name, value) =>
    set((state) => ({
      values: { ...state.values, [name]: value },
    })),

  setError: (name, error) =>
    set((state) => ({
      errors: { ...state.errors, [name]: error },
    })),

  setTouched: (name) =>
    set((state) => ({
      touched: { ...state.touched, [name]: true },
    })),

  reset: () =>
    set({
      values: initialValues,
      errors: {},
      touched: {},
    }),
}));

function LoginForm() {
  const { values, errors, touched, setField, setError, setTouched, reset } =
    useFormStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!values.email) {
      setError('email', 'Email is required');
      return;
    }
    if (!values.password) {
      setError('password', 'Password is required');
      return;
    }

    // Submit
    try {
      await api.login(values);
      reset();
    } catch (error) {
      setError('form', 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="email"
        value={values.email}
        onChange={(e) => setField('email', e.target.value)}
        onBlur={() => setTouched('email')}
      />
      {touched.email && errors.email && <span>{errors.email}</span>}

      <input
        name="password"
        type="password"
        value={values.password}
        onChange={(e) => setField('password', e.target.value)}
        onBlur={() => setTouched('password')}
      />
      {touched.password && errors.password && <span>{errors.password}</span>}

      <button type="submit">Login</button>
    </form>
  );
}
```

## 8. Middleware for Logging

Add logging middleware to track all state changes:

```typescript
interface LogEntry {
  timestamp: number;
  action: string;
  prevState: string;
  nextState: string;
}

const loggerMiddleware = (set, get) => (next) => async (partial) => {
  const prevState = get();
  const timestamp = Date.now();

  console.log(' Action:',
    typeof partial === 'function' ? 'function' : Object.keys(partial)
  );
  console.log('📊 Previous state:', prevState);

  await next(partial);

  const nextState = get();
  console.log(' Updated state:', nextState);
  console.log('⏱️ Time:', new Date(timestamp).toISOString());
  console.log('---');
};

const useStore = create(
  (set, get) => ({
    count: 0,
    name: '',
    increment: () => set((state) => ({ count: state.count + 1 })),
    setName: (name: string) => set({ name }),
  }),
  [loggerMiddleware]
);
```

## 9. Middleware for Persistence

Save state to localStorage automatically:

```typescript
const persistMiddleware = (key: string) => (set, get) => (next) => async (partial) => {
  await next(partial);

  // Save to localStorage after each update
  const state = get();
  try {
    localStorage.setItem(key, JSON.stringify(state));
    console.log('💾 State persisted');
  } catch (error) {
    console.error('Failed to persist state:', error);
  }
};

const useCounterStore = create(
  (set, get) => {
    // Load from localStorage on init
    const saved = localStorage.getItem('counter-store');
    const initialState = saved ? JSON.parse(saved) : { count: 0 };

    return {
      ...initialState,
      increment: () => set((state) => ({ count: state.count + 1 })),
      decrement: () => set((state) => ({ count: state.count - 1 })),
    };
  },
  [persistMiddleware('counter-store')]
);
```

## 10. Middleware for Validation

Validate state before updates:

```typescript
const validateMiddleware = (set, get) => (next) => async (partial) => {
  const state = get();
  const updates = typeof partial === 'function' ? partial(state) : partial;

  // Validate updates
  if ('age' in updates && updates.age < 0) {
    console.warn(' Age cannot be negative');
    return;
  }

  if ('email' in updates && !updates.email.includes('@')) {
    console.warn(' Invalid email format');
    return;
  }

  // Valid, proceed with update
  await next(partial);
  console.log(' Validation passed');
};

const useUserStore = create(
  (set, get) => ({
    email: 'test@example.com',
    age: 25,
    setEmail: (email: string) => set({ email }),
    setAge: (age: number) => set({ age }),
  }),
  [validateMiddleware]
);

// Usage:
// useUserStore.setAge(-5); //  Blocked
// useUserStore.setEmail('invalid'); //  Blocked
// useUserStore.setAge(30); //  Allowed
```

## 11. Combining Multiple Middleware

Chain multiple middleware together:

```typescript
const timeoutMiddleware = (ms: number) => (set, get) => (next) => async (partial) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Update timeout')), ms)
  );

  try {
    await Promise.race([next(partial), timeout]);
  } catch (error) {
    console.error('⏱️ Update timed out:', error);
  }
};

const debugMiddleware = (set, get) => (next) => async (partial) => {
  console.log('🐛 Debug: action triggered');
  await next(partial);
};

const useStore = create(
  (set, get) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }),
  [
    loggerMiddleware,
    validateMiddleware,
    persistMiddleware('app-store'),
    debugMiddleware,
    timeoutMiddleware(5000),
  ]
);
```

## 12. Using `get` with Derived State

Compute values using the current state:

```typescript
interface CartStore {
  items: { id: string; price: number; quantity: number }[];
  addItem: (item: any) => void;
  removeItem: (id: string) => void;
  getTotal: () => number;
  getItemCount: () => number;
  getSummary: () => string;
}

const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (item) =>
    set((state) => ({
      items: [...state.items, item],
    })),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  // Compute total price
  getTotal: () => {
    const state = get();
    return state.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  },

  // Compute item count
  getItemCount: () => {
    const state = get();
    return state.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  // Get formatted summary
  getSummary: () => {
    const state = get();
    const total = state.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const count = state.items.reduce((sum, item) => sum + item.quantity, 0);
    return `${count} items - $${total.toFixed(2)}`;
  },
}));

// Usage:
function CartSummary() {
  const store = useCartStore();
  return <div>{store.getSummary()}</div>;
}
```

These examples showcase the flexibility and power of Zustic for managing various types of application state. Pick the patterns that fit your use case!
