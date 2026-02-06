---
sidebar_position: 1
description: Zustic is a lightweight, minimal state management library for React using useSyncExternalStore. Learn how to get started with Zustic.
keywords: [React, state management, zustic, lightweight library, React hooks, redux, zustand, reduxtoolkit]
---

# Getting Started with Zustic

## Welcome to Zustic

Zustic is a **lightweight, minimal state management library for React** using `useSyncExternalStore`. It's perfect for managing global state in React, React Native, and Next.js applications with zero boilerplate and maximum developer experience.

### ✨ Key Features

#### Core Features
- **🪶 Lightweight** - Only ~500B (gzipped) with zero dependencies
- **⚡ Simple API** - One function (`create`) to manage state
- **🎣 React Hooks** - Native React hooks integration with automatic subscriptions
- **📱 Multi-Platform** - React, React Native, Next.js, and more
- **🔄 Reactive Updates** - Automatic re-renders with optimized batching
- **💾 TypeScript Support** - Full type safety without extra configuration
- **🚀 Production Ready** - Trusted by production applications

#### Advanced Capabilities
- **🧩 Middleware Support** - Extend functionality with logging, persistence, validation, and more
- **� Direct State Access** - `get()` function for reading state outside components
- **🎯 Selective Subscriptions** - Components only re-render when their data changes
- **⚙️ Extensible** - Build custom middleware for any use case
- **🧪 Fully Testable** - Easy to test stores with middleware and async operations
- **🔗 Framework Agnostic Middleware** - Create middleware once, use everywhere

## What is Zustic?

Zustic provides a simple, functional approach to state management. Instead of complex boilerplate like Redux or Context API providers, Zustic offers a minimal API that's easy to understand and use.

### Why Choose Zustic?

**Size & Performance**
- **Ultra-lightweight**: ~500B (gzipped) - smaller than Redux, Zustand, and MobX
- **Zero dependencies**: No hidden packages or bloat
- **Optimized rendering**: Built on `useSyncExternalStore` for minimal re-renders
- **Smart subscriptions**: Only subscribe to the data your component needs

**Developer Experience**
- **Easy to learn**: Master the entire API in 5 minutes
- **Zero boilerplate**: No actions, reducers, or providers needed
- **First-class TypeScript**: Full type inference without extra setup
- **Intuitive API**: `create()`, `set()`, `get()` - that's it!

**Scalability**
- **Extensible architecture**: Middleware system for logging, persistence, validation, and more
- **Built for teams**: Works seamlessly with TypeScript and modern tooling
- **Production-ready**: Used in real applications with thousands of users
- **Easy migration**: Simple path from Context API, Redux, or other libraries

**Middleware Power**
- **Logger middleware** - Track state changes in development
- **Persistence middleware** - Auto-save state to localStorage/AsyncStorage
- **Validation middleware** - Ensure state integrity
- **Time-travel debugging** - Replay state changes for debugging
- **Custom middleware** - Build anything you need

**Comparison**

| Feature | Zustic | Redux | Zustand | Context API |
|---------|--------|-------|---------|-------------|
| Bundle Size | ~500B | ~6KB | ~2KB | 0B (built-in) |
| Learning Curve | ⭐ Easy | ⭐⭐⭐⭐⭐ Hard | ⭐⭐ Easy | ⭐⭐⭐ Medium |
| Boilerplate | Minimal | Massive | Minimal | Some |
| TypeScript Support | ✅ Excellent | ✅ Good | ✅ Good | ✅ Good |
| Middleware | ✅ Built-in | ✅ Required | ✅ Optional | ❌ No |
| Performance | ✅ Optimized | ✅ Good | ✅ Optimized | ⚠️ Re-renders |
| API Simplicity | ✅ Very Simple | ❌ Complex | ✅ Simple | ⚠️ Provider Hell |

## Quick Example

Here's a simple counter store:

```typescript
import { create } from 'zustic';

type CounterStore = {
  count: number;
  inc: () => void;
  dec: () => void;
  reset: () => void;
};

export const useCounter = create<CounterStore>((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
  dec: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));
```

Use it in your component:

```typescript
import { useCounter } from './store';

function Counter() {
  const { count, inc, dec, reset } = useCounter();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={inc}>Increment</button>
      <button onClick={dec}>Decrement</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

## Advanced: With Middleware

Zustic's middleware system lets you extend functionality without changing your store code. Add logging, persistence, validation, or any custom logic:

```typescript
// Logger middleware - track all state changes
const logger = (set, get) => (next) => async (partial) => {
  console.log('Previous state:', get());
  await next(partial);
  console.log('Updated state:', get());
};

// Persistence middleware - auto-save to localStorage
const persist = (set, get) => (next) => async (partial) => {
  await next(partial);
  localStorage.setItem('counter', JSON.stringify(get()));
};

// Create store with multiple middleware
export const useCounter = create<CounterStore>(
  (set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
    dec: () => set((state) => ({ count: state.count - 1 })),
    reset: () => set({ count: 0 }),
  }),
  [logger, persist] // Add middleware array
);
```

**Middleware Benefits:**
- ✅ Add features without modifying store code
- ✅ Reuse middleware across multiple stores
- ✅ Logging, persistence, validation out of the box
- ✅ Time-travel debugging capabilities
- ✅ Custom business logic easily added

Learn more in [Middleware Guide](./tutorial-extras/middleware)

## Installation

Get started in just one command:

```bash
npm install zustic
```

Or with yarn:

```bash
yarn add zustic
```

Or with pnpm:

```bash
pnpm add zustic
```

## Next Steps

### Get Started Quickly
- **[Installation & Setup](./tutorial-basics/installation)** - Install Zustic and configure your project
- **[Basic Usage](./tutorial-basics/basic-usage)** - Create your first store and use state in components

### Deepen Your Knowledge
- **[API Reference](./tutorial-extras/api-reference)** - Complete API documentation for `create()`, `set()`, `get()`, and middleware
- **[Middleware Guide](./tutorial-extras/middleware)** - Master middleware with 7+ patterns and real-world examples
- **[Advanced Examples](./tutorial-extras/advanced-examples)** - Complex patterns, async operations, and multi-store setups

### Best Practices & Migration
- **[Best Practices](./tutorial-extras/best-practices)** - Code organization, typing, and optimization tips
- **[Migration Guide](./tutorial-extras/migration-guide)** - Moving from Redux, Context API, Zustand, or MobX
- **[FAQ & Troubleshooting](./tutorial-extras/faq)** - Common questions and solutions

### Popular Use Cases
1. **Form State** - Manage complex form states with validation
2. **User Authentication** - Store user info, tokens, and permissions
3. **Theme Management** - Toggle between light/dark modes
4. **Notification System** - Handle toast and modal states
5. **API Caching** - Store and sync API responses
6. **Shopping Cart** - Persist and update cart items

## Browser Support

Zustic works in all modern browsers that support ES6 and React 16.8+:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers supporting React Native

## Community

Have questions? Need help?

- 📖 [GitHub Repository](https://github.com/DeveloperRejaul/zustic)
- 🐛 [Report Issues](https://github.com/DeveloperRejaul/zustic/issues)
- 💬 [Discussions](https://github.com/DeveloperRejaul/zustic/discussions)

## License

Zustic is released under the ISC License. See [LICENSE](https://github.com/DeveloperRejaul/zustic/blob/main/LICENSE) for details.
