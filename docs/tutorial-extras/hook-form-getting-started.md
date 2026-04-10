---
sidebar_position: 6
title: Hook Form
description: Create type-safe, validated React forms with built-in state management, Zod/Yup support, and zero boilerplate using Zustic Hook Form.
keywords: [hook-form, form validation, React forms, Zod, Yup, form state management, TypeScript forms]
---

# Hook Form - Getting Started

Build type-safe, production-ready React forms with built-in validation, state management, and automatic error handling. Perfect for simple forms and complex multi-step workflows.

## Overview

Zustic Hook Form provides a lightweight form management solution that combines state management with validation:

- **Type-Safe** - Full TypeScript support with compile-time key validation
- **Validation Built-In** - Support for Zod, Yup, or built-in rules (required, pattern, min, max)
- **Automatic State** - No need for useState for each field
- **Error Management** - Automatic error tracking and recovery
- **Developer Experience** - Simple API, zero boilerplate
- **Lightweight** - Only ~3KB gzipped

## Installation

```bash
npm install zustic
```

## Quick Start

### Step 1: Define Your Form

```typescript
// types.ts
export interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}
```

### Step 2: Create Form Instance

```typescript
// forms/login.ts
import { createForm } from 'zustic/hook-form';

export const loginForm = createForm<LoginForm>({
  defaultValues: {
    email: {
      value: '',
      required: { value: true, message: 'Email is required' },
      pattern: {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Invalid email format'
      }
    },
    password: {
      value: '',
      required: { value: true, message: 'Password is required' },
      min: { value: 8, message: 'Password must be at least 8 characters' }
    },
    rememberMe: {
      value: false
    }
  }
});
```

### Step 3: Use in Component

```tsx
'use client';

import { loginForm } from './forms/login';
import type { LoginForm } from './types';

export function LoginPage() {
  const { handleSubmit, Controller, getErrors } = loginForm();

  const handleLogin = async (data: LoginForm) => {
    console.log('Form submitted:', data);
    // Call API, redirect, etc.
  };

  return (
    <form onSubmit={handleSubmit(handleLogin)}>
      <div className="form-group">
        <Controller
          field="email"
          render={({ value, error, onChange }) => (
            <>
              <input
                type="email"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter email"
              />
              {error && <span className="error">{error}</span>}
            </>
          )}
        />
      </div>

      <div className="form-group">
        <Controller
          field="password"
          render={({ value, error, onChange }) => (
            <>
              <input
                type="password"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter password"
              />
              {error && <span className="error">{error}</span>}
            </>
          )}
        />
      </div>

      <div className="form-group">
        <Controller
          field="rememberMe"
          render={({ value, onChange }) => (
            <label>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
              />
              Remember me
            </label>
          )}
        />
      </div>

      <button type="submit">Login</button>
    </form>
  );
}
```

## Key Features

### ✅ Built-In Validation Rules

Validate without external libraries:

```typescript
createForm({
  defaultValues: {
    email: {
      value: '',
      required: true,                    // Required field
      pattern: { 
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
        message: 'Invalid email' 
      }
    },
    age: {
      value: 0,
      min: { value: 18, message: 'Must be 18+' },
      max: { value: 120, message: 'Invalid age' }
    }
  }
});
```

### ✅ Zod & Yup Support

Use powerful validation libraries:

```typescript
import { z } from 'zod';
import { createForm, zodResolver } from 'zustic/hook-form';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
  age: z.number().min(18, 'Must be 18+')
});

const form = createForm({
  defaultValues: {
    email: '',
    password: '',
    age: 0
  },
  resolver: zodResolver(schema)
});
```

### ✅ Automatic State Management

No useState needed:

```typescript
const { 
  watch,           // Get field value
  setValue,        // Update field value
  getErrors,       // Get all/specific errors
  setError,        // Set custom error
  isDirty,         // Check if modified
  isTouched,       // Check if focused
  reset,           // Reset to initial
  handleSubmit     // Form submission
} = form();
```

### ✅ Easy Error Handling

Display errors per field or all at once:

```typescript
// Get specific field error
const emailError = getErrors('email');

// Get all errors
const allErrors = getErrors();
// { email: 'Invalid email', password: 'Required' }

// Set custom error (useful for server errors)
setError('email', 'Email already registered');
```

## Form State Tracking

Track user interactions automatically:

```typescript
const { isDirty, isTouched, watch } = form();

// Check if form has been modified
isDirty();           // false initially, true after change

// Check if specific field was focused
isTouched('email');  // false initially, true after blur

// Watch field value for real-time updates
const emailValue = watch('email');
```

## What You Get

After setup, you have everything for production forms:

✅ **Type-Safe** - TypeScript catches invalid field names  
✅ **Validation** - Built-in + Zod/Yup support  
✅ **Error Management** - Automatic tracking and recovery  
✅ **State Tracking** - Know when fields are dirty/touched  
✅ **No Boilerplate** - Simple, straightforward API  
✅ **Performance** - Efficient re-renders with selector pattern  

## Next Steps

- **[API Reference](./hook-form-api-reference.md)** - Complete API documentation
- **[Examples](./hook-form-examples.md)** - Real-world use cases
- **[Advanced Guide](./hook-form-advanced.md)** - Complex patterns and techniques

## Common Patterns

### Simple Form with Validation

```tsx
const { handleSubmit, Controller } = form();

return (
  <form onSubmit={handleSubmit((data) => console.log(data))}>
    <Controller field="email" render={...} />
    <Controller field="password" render={...} />
    <button type="submit">Submit</button>
  </form>
);
```

### Display Errors

```tsx
const { getErrors } = form();
const errors = getErrors();

return (
  <div>
    {errors.email && <p className="error">{errors.email}</p>}
    {errors.password && <p className="error">{errors.password}</p>}
  </div>
);
```

### Reset Form After Success

```tsx
const { handleSubmit, reset } = form();

const onSubmit = async (data) => {
  await api.submit(data);
  reset();  // Clear form and errors
};
```

---

Ready to build forms? Let's explore the [examples](/docs/tutorial-extras/hook-form-examples)! 🚀
