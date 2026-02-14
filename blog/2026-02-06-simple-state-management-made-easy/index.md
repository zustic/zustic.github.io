---
slug: simple-state-management-made-easy
title: "Simple State Management: Making State Easy with Zustic"
authors: [zustic]
tags: [state-management, zustic, react, simple, beginners]
description: "Learn how to manage state the simple way. Zustic makes state management so easy that anyone can understand it in 5 minutes."
image: /img/logo.png
---

# Simple State Management: Making State Easy with Zustic

State management doesn't have to be complicated. In fact, most applications don't need the complexity of Redux. Let's explore how to manage state simply and effectively with Zustic.

<!-- truncate -->

## The State Management Journey

As React developers, we typically go through these stages:

### Stage 1: useState (Simple Apps)
```tsx
function Counter() {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  )
}
```

Works great for single components!

### Stage 2: Prop Drilling (Growing Apps)
```tsx
function App() {
  const [count, setCount] = useState(0)
  
  return (
    <Parent count={count} setCount={setCount}>
      <Child count={count} setCount={setCount} />
    </Parent>
  )
}
```

Passing props through many components gets tedious.

### Stage 3: Context API (Medium Apps)
```tsx
const CountContext = createContext()

function App() {
  const [count, setCount] = useState(0)
  
  return (
    <CountContext.Provider value={{ count, setCount }}>
      <Child />
    </CountContext.Provider>
  )
}

function Child() {
  const { count, setCount } = useContext(CountContext)
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>
}
```

Works, but requires providers everywhere and causes unnecessary re-renders.

### Stage 4: State Management Library (Complex Apps)
This is where Zustic shines! ✨

## Why Zustic is the Simplest Solution

### Concept 1: Global Store
Think of your app state in one place:

```tsx
import { create } from 'zustic'

// Define your store
const useCountStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))

// Use anywhere - no providers!
function Counter() {
  const { count, increment, decrement } = useCountStore()
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+1</button>
      <button onClick={decrement}>-1</button>
    </div>
  )
}
```

**That's it!** No providers, no context, no complexity.

### Concept 2: Multiple Stores
Keep your stores organized:

```tsx
// User store
const useUserStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))

// UI store
const useUIStore = create((set) => ({
  isMenuOpen: false,
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
}))

// Cart store
const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ 
    items: state.items.filter(item => item.id !== id) 
  })),
}))

// Use them independently!
function App() {
  const { user } = useUserStore()
  const { isMenuOpen } = useUIStore()
  const { items } = useCartStore()
  
  return (
    <div>
      <h1>Hello {user?.name}</h1>
      {isMenuOpen && <Menu />}
      <p>Cart items: {items.length}</p>
    </div>
  )
}
```

### Concept 3: Simple State Updates
Updating state is straightforward:

```tsx
const useStore = create((set) => ({
  // Initial state
  count: 0,
  user: null,
  todos: [],
  
  // Simple updates
  increment: () => set((state) => ({ count: state.count + 1 })),
  setUser: (user) => set({ user }),
  
  // Adding to array
  addTodo: (todo) => set((state) => ({
    todos: [...state.todos, todo]
  })),
  
  // Removing from array
  removeTodo: (id) => set((state) => ({
    todos: state.todos.filter(t => t.id !== id)
  })),
  
  // Complex updates
  updateTodo: (id, updates) => set((state) => ({
    todos: state.todos.map(t => 
      t.id === id ? { ...t, ...updates } : t
    )
  })),
}))
```

### Concept 4: Accessing State Outside Components
Sometimes you need state outside React:

```tsx
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

// In components
function Counter() {
  const count = useStore((state) => state.count)
  return <div>{count}</div>
}

// Outside components - use get()
useStore.setState({ count: 10 })
console.log(useStore.getState()) // { count: 10 }
```

## Real-World Examples

### Example 1: Todo App
```tsx
type TodoStore = {
  todos: Array<{ id: number; text: string; done: boolean }>
  addTodo: (text: string) => void
  toggleTodo: (id: number) => void
  removeTodo: (id: number) => void
  clearDone: () => void
}

const useTodoStore = create<TodoStore>((set) => ({
  todos: [],
  
  addTodo: (text) => set((state) => ({
    todos: [...state.todos, {
      id: Date.now(),
      text,
      done: false,
    }]
  })),
  
  toggleTodo: (id) => set((state) => ({
    todos: state.todos.map(todo =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    )
  })),
  
  removeTodo: (id) => set((state) => ({
    todos: state.todos.filter(todo => todo.id !== id)
  })),
  
  clearDone: () => set((state) => ({
    todos: state.todos.filter(todo => !todo.done)
  })),
}))

// Use in component
function TodoApp() {
  const { todos, addTodo, toggleTodo, removeTodo } = useTodoStore()
  const [input, setInput] = useState('')
  
  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Add todo..."
      />
      <button onClick={() => {
        addTodo(input)
        setInput('')
      }}>
        Add
      </button>
      
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            {todo.text}
            <button onClick={() => removeTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### Example 2: Authentication
```tsx
type AuthStore = {
  user: null | { id: number; email: string; name: string }
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  
  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      const user = await response.json()
      set({ user, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
  
  logout: () => set({ user: null }),
}))

// Use in component
function LoginForm() {
  const { login, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(email, password)
      // User logged in!
    } catch (error) {
      console.error('Login failed:', error)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        type="password"
      />
      <button disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

## Key Takeaways

 **Simple to understand** - Just JavaScript functions
 **No boilerplate** - No actions, reducers, or providers
 **TypeScript friendly** - Full type inference
 **Flexible** - Works with async, nested state, arrays
 **Fast** - Only re-renders when subscribed state changes
 **Powerful** - Add middleware for logging, persistence, validation

## State Management Decision Tree

```
Is your app small?
├─ Yes → useState is fine
└─ No → Zustic!

Do you need complex patterns?
├─ Yes → Zustic + middleware
└─ No → Zustic basic

Do you need enterprise features?
├─ Yes → Consider Redux (but try Zustic first!)
└─ No → Zustic!
```

## Conclusion

State management should be simple. Zustic proves that you don't need complexity to have powerful, scalable state management. In fact, **simple is better**.

Start with Zustic today and enjoy:
-  5-minute learning curve
-  Zero dependencies
-  ~500B bundle size
-  Perfect for teams

Get started: [Zustic Installation](/docs/tutorial-basics/installation)

---

**Found this helpful? Check out our other blog posts on middleware and React state management!**
