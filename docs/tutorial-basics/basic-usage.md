---
sidebar_position: 2
---

# Basic Usage

Learn the fundamentals of Zustic by creating and using your first store.

## Core Concept

Zustic is built around a simple idea: **stores are just functions that return state and actions**.

## Creating a Store

The `create` function is all you need:

```typescript
import { create } from 'zustic';

const useStore = create((set) => ({
  // Your state and actions here
}));
```

### Simple Counter Store

Here's a basic counter example:

```typescript
import { create } from 'zustic';

interface CounterStore {
  count: number;
  inc: () => void;
  dec: () => void;
}

const useCounter = create<CounterStore>((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
  dec: () => set((state) => ({ count: state.count - 1 })),
}));
```

## Using the Store

Use the store just like any React hook:

```typescript
import { useCounter } from './counterStore';

function Counter() {
  const { count, inc, dec } = useCounter();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={inc}>Increment</button>
      <button onClick={dec}>Decrement</button>
    </div>
  );
}
```

## State Updates

### Method 1: Direct State Update

Pass an object with the new state:

```typescript
const useStore = create((set) => ({
  count: 0,
  reset: () => set({ count: 0 }),
}));
```

### Method 2: Functional Update

Use a function to access the previous state:

```typescript
const useStore = create((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
}));
```

This is useful when your new state depends on the previous state.

### Method 3: Using `get` to Access Current State

The `get` function allows you to read the current state anywhere:

```typescript
const useStore = create((set, get) => ({
  count: 0,
  name: '',
  
  // Use get to read current state
  logState: () => {
    const state = get();
    console.log('Current state:', state);
  },
  
  // Compute derived values
  getInfo: () => {
    const state = get();
    return `${state.name}: ${state.count}`;
  },
  
  // Access state in async operations
  fetchData: async () => {
    await delay(1000);
    const currentState = get(); // Gets latest state
    console.log('Count is:', currentState.count);
  },
}));
```

## Complex State Example

Let's create a more complex todo store:

```typescript
import { create } from 'zustic';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoStore {
  todos: Todo[];
  addTodo: (text: string) => void;
  removeTodo: (id: number) => void;
  toggleTodo: (id: number) => void;
  clearCompleted: () => void;
}

const useTodoStore = create<TodoStore>((set) => {
  let nextId = 1;

  return {
    todos: [],

    addTodo: (text: string) =>
      set((state) => ({
        todos: [
          ...state.todos,
          { id: nextId++, text, completed: false },
        ],
      })),

    removeTodo: (id: number) =>
      set((state) => ({
        todos: state.todos.filter((todo) => todo.id !== id),
      })),

    toggleTodo: (id: number) =>
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ),
      })),

    clearCompleted: () =>
      set((state) => ({
        todos: state.todos.filter((todo) => !todo.completed),
      })),
  };
});
```

## Using the Todo Store

```typescript
import { useTodoStore } from './todoStore';

function TodoApp() {
  const { todos, addTodo, removeTodo, toggleTodo, clearCompleted } =
    useTodoStore();

  const handleAdd = () => {
    const text = prompt('Enter todo:');
    if (text) addTodo(text);
  };

  return (
    <div>
      <button onClick={handleAdd}>Add Todo</button>

      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
              {todo.text}
            </span>
            <button onClick={() => removeTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>

      <button onClick={clearCompleted}>Clear Completed</button>
    </div>
  );
}
```

## Accessing Single State Values

You can destructure the store to access individual values:

```typescript
const count = useCounter((state) => state.count);
const { count, inc } = useCounter();
```

## State Best Practices

### Keep State Flat

```typescript
// Good - flat structure
const useStore = create((set) => ({
  userName: 'John',
  userEmail: 'john@example.com',
  userRole: 'admin',
}));
```

### Avoid Deep Nesting

```typescript
// Bad - deeply nested
const useStore = create((set) => ({
  user: {
    profile: {
      personal: {
        name: 'John',
      },
    },
  },
}));
```

### Use Immutable Updates

```typescript
// Good - creates new array
set((state) => ({
  items: [...state.items, newItem],
}));

// Bad - mutates existing array
set((state) => {
  state.items.push(newItem);
  return state;
});
```

## Common Patterns

### Toggle Boolean

```typescript
const useUIStore = create((set) => ({
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
```

### Array Operations

```typescript
const useListStore = create((set) => ({
  items: [] as string[],

  // Add item
  add: (item: string) =>
    set((state) => ({
      items: [...state.items, item],
    })),

  // Remove item
  remove: (index: number) =>
    set((state) => ({
      items: state.items.filter((_, i) => i !== index),
    })),

  // Clear all
  clear: () => set({ items: [] }),
}));
```

### Nested Object Updates

```typescript
const useUserStore = create((set) => ({
  profile: { name: '', email: '', age: 0 },

  updateProfile: (updates: Partial<Profile>) =>
    set((state) => ({
      profile: { ...state.profile, ...updates },
    })),
}));
```

## Next Steps

- Explore [Advanced Examples](../tutorial-extras/advanced-examples)
- Learn [Best Practices](../tutorial-extras/best-practices)
- Check the complete [API Reference](../tutorial-extras/api-reference)
