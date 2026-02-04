---
sidebar_position: 1
---

# Installation & Setup

## Installation

### Using npm

```bash
npm install zustic
```

### Using yarn

```bash
yarn add zustic
```

### Using pnpm

```bash
pnpm add zustic
```

## Requirements

- **Node.js**: 14.0 or higher
- **React**: 16.8 or higher (hooks support required)
- **TypeScript**: Optional, but recommended

## Verify Installation

To verify that Zustic is installed correctly, create a simple test file:

```typescript
import { create } from 'zustic';

const useTestStore = create((set) => ({
  value: 0,
  setValue: (v: number) => set({ value: v }),
}));

console.log('Zustic installed successfully!');
```

## Project Setup

### 1. Create Store Directory

It's a good practice to organize your stores in a dedicated directory:

```
src/
├── stores/
│   ├── index.ts
│   ├── counterStore.ts
│   ├── userStore.ts
│   └── appStore.ts
├── components/
└── pages/
```

### 2. Create Your First Store

Create `src/stores/counterStore.ts`:

```typescript
import { create } from 'zustic';

interface CounterState {
  count: number;
  inc: () => void;
  dec: () => void;
  reset: () => void;
}

export const useCounter = create<CounterState>((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
  dec: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));
```

### 3. Export Stores

Create `src/stores/index.ts`:

```typescript
export { useCounter } from './counterStore';
export { useUserStore } from './userStore';
export { useAppStore } from './appStore';
```

### 4. Use in Components

```typescript
import { useCounter } from '@/stores';

export default function Counter() {
  const { count, inc, dec, reset } = useCounter();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={inc}>+</button>
      <button onClick={dec}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

## TypeScript Configuration

### tsconfig.json

Make sure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

## Next.js Setup

For Next.js projects, create stores with the `'use client'` directive:

```typescript
'use client';

import { create } from 'zustic';

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),
}));
```

## React Native Setup

Zustic works seamlessly with React Native:

```typescript
import { create } from 'zustic';
import { View, Text, TouchableOpacity } from 'react-native';

const useThemeStore = create((set) => ({
  isDark: false,
  toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
}));

export default function App() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#000' : '#fff' }}>
      <Text>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
      <TouchableOpacity onPress={toggleTheme}>
        <Text>Toggle</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Troubleshooting

### Issue: "Zustic is not defined"

Make sure you're importing from the correct package:

```typescript
// ✅ Correct
import { create } from 'zustic';

// ❌ Wrong
import { create } from 'zustand'; // Different package!
```

### Issue: TypeScript errors

Ensure your React version is 16.8+:

```bash
npm list react
```

If you need to update:

```bash
npm install react@latest react-dom@latest
```

## Next Steps

- Learn [Basic Usage](./basic-usage)
- Explore [Advanced Examples](../tutorial-extras/advanced-examples)
- Check the [API Reference](../tutorial-extras/api-reference)
