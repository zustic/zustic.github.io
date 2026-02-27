---
slug: form-state-management-simplified
title: "Form State Management with Zustic"
authors: [zustic]
tags: [forms, state-management, validation, react, zustic]
description: "Learn how to handle form state with Zustic using a simple, efficient validation pattern. Perfect for building forms of any complexity."
image: /img/logo.png
---

# Form State Management with Zustic

Building forms in React doesn't have to be complicated. In this guide, I'll show you how to use **Zustic** with a simple, elegant validation pattern that works for simple contact forms and complex multi-step forms alike.

<!-- truncate -->

## Why This Approach?

This pattern is:
- **Minimal**: No external validation libraries needed (but can add them if you want)
- **Type-safe**: Full TypeScript support
- **Reusable**: Works for any form
- **Flexible**: Easy to extend with additional validation rules

## The Pattern

The core idea is to define a `Field` type with metadata about each field, then build actions to update and validate fields.

```typescript
type Field = {
  value: string
  error: string | null
  required?: { value: boolean; message: string }
  pattern?: { value: RegExp; message: string }
  min?: { value: number; message: string }
  max?: { value: number; message: string }
}
```

This gives us:
- `value`: The field's current value
- `error`: Any validation error message
- `required`, `pattern`, `min`, `max`: Validation rules

## Simple Login Form Example

Let's build a login form with email and password:

```typescript
import { create } from 'zustic'
import React from 'react'

type Field = {
  value: string
  error: string | null
  required?: { value: boolean; message: string }
  pattern?: { value: RegExp; message: string }
  min?: { value: number; message: string }
  max?: { value: number; message: string }
}

type FormStore = {
  email: Field
  password: Field
  setFieldValue: (field: 'email' | 'password', value: string) => void
  validateField: (field: 'email' | 'password') => void
  handleSubmit: (cb: (data: { email: string; password: string }) => void) => (e: React.FormEvent<HTMLFormElement>) => void
}

const useForm = create<FormStore>((set, get) => ({
  email: {
    value: '',
    error: null,
    required: { value: true, message: 'Email is required' },
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Invalid email format',
    },
    min: { value: 5, message: 'Email must be at least 5 characters' },
    max: { value: 255, message: 'Email must be less than 255 characters' },
  },
  password: {
    value: '',
    error: null,
    required: { value: true, message: 'Password is required' },
    pattern: {
      value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
      message: 'Password must be at least 8 characters and contain letters and numbers',
    },
    min: { value: 8, message: 'Password must be at least 8 characters' },
    max: { value: 255, message: 'Password must be less than 255 characters' },
  },

  // Update field value
  setFieldValue: (field, value) => {
    set((state) => ({
      [field]: {
        ...state[field],
        value,
      },
    }));
  },
  
  // Validate a field and set error message
  validateField: (field) => {
    set((state) => {
      const fieldState = state[field]
      let error: string | null = null

      // Check required
      if (fieldState.required?.value && !fieldState.value) {
        error = fieldState.required.message
      } 
      // Check pattern
      else if (fieldState.pattern?.value && !fieldState.pattern.value.test(fieldState.value)) {
        error = fieldState.pattern.message
      } 
      // Check min length
      else if (fieldState.min && fieldState.value.length < fieldState.min.value) {
        error = fieldState.min.message
      } 
      // Check max length
      else if (fieldState.max && fieldState.value.length > fieldState.max.value) {
        error = fieldState.max.message
      } else {
        error = null
      }

      return {
        [field]: {
          ...fieldState,
          error,
        },
      }
    })
  },
  
  // Handle form submission
  handleSubmit: (cb)=> (e) => {
    e.preventDefault()
    get().validateField('email')
    get().validateField('password')
    
    const emailError = get().email.error
    const passwordError = get().password.error   

    if(!emailError && !passwordError) {
      cb({
        email: get().email.value,
        password: get().password.value,
      })
    }
  }
}))
```

## Building the Form Component

Now let's create a reusable `Controller` component for form fields:

```typescript
interface ControllerProps {
  field: 'email' | 'password';
  render: (value: string, error: string | null, onChange: (value: string) => void) => React.ReactNode;
}

function Controller({ field, render }: ControllerProps) {
  const state = useForm()
  const value = state[field].value
  const error = state[field].error
  const setFieldValue = state.setFieldValue
  const validateField = state.validateField

  const element = render(value, error, (value) => {
    setFieldValue(field, value)
    validateField(field)
  })
  return element
}

export default function LoginForm() {
  const handleSubmit = useForm((s)=>s.handleSubmit)

  const onSubmit = (data: { email: string; password: string }) => {
    console.log('Form submitted:', data);
    // Send to API
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller 
        field='email'
        render={(value, error, onChange) => (
          <div className='form-group'>
            <label>Email</label>
            <input 
              type="text" 
              value={value} 
              onChange={(e) => onChange(e.target.value)} 
              placeholder="your@email.com"
            />
            {error && <span className='error'>{error}</span>}
          </div>
        )}
      />

      <Controller 
        field='password'
        render={(value, error, onChange) => (
          <div className='form-group'>
            <label>Password</label>
            <input 
              type="password" 
              value={value} 
              onChange={(e) => onChange(e.target.value)}
              placeholder="••••••••"
            />
            {error && <span className='error'>{error}</span>}
          </div>
        )}
      />

      <button type="submit">Login</button>
    </form>
  )
}
```

## Advanced: Adding More Fields

To add more fields, simply extend the pattern:

```typescript
type FormStore = {
  email: Field
  password: Field
  name: Field           // Add new field
  phone: Field          // Add new field
  // ... other fields
  
  setFieldValue: (field: keyof FormStore, value: string) => void
  validateField: (field: keyof FormStore) => void
}

const useForm = create<FormStore>((set, get) => ({
  // ... existing fields
  
  name: {
    value: '',
    error: null,
    required: { value: true, message: 'Name is required' },
    min: { value: 2, message: 'Name must be at least 2 characters' },
    max: { value: 100, message: 'Name must be less than 100 characters' },
  },

  phone: {
    value: '',
    error: null,
    pattern: {
      value: /^\d{10,}$/,
      message: 'Phone must be at least 10 digits',
    },
  },
  
  // ... rest of store
}))
```

## With Validation Libraries

### Using Zod

```typescript
import { z } from 'zod';

const emailSchema = z.string().email('Invalid email');
const passwordSchema = z.string().min(8, 'Min 8 chars').regex(/[A-Za-z]/, 'Letters required').regex(/\d/, 'Numbers required');

validateField: (field) => {
  set((state) => {
    const fieldState = state[field];
    let error: string | null = null;

    try {
      if (field === 'email') {
        emailSchema.parse(fieldState.value);
      } else if (field === 'password') {
        passwordSchema.parse(fieldState.value);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        error = err.errors[0].message;
      }
    }

    return {
      [field]: { ...fieldState, error },
    };
  });
}
```

### Using Yup

```typescript
import * as yup from 'yup';

const emailSchema = yup.string().email('Invalid email').required();
const passwordSchema = yup.string().min(8).required();

validateField: async (field) => {
  const state = get();
  const fieldState = state[field];
  let error: string | null = null;

  try {
    if (field === 'email') {
      await emailSchema.validate(fieldState.value);
    } else if (field === 'password') {
      await passwordSchema.validate(fieldState.value);
    }
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      error = err.message;
    }
  }

  set((state) => ({
    [field]: { ...state[field], error },
  }));
}
```

## Best Practices

### 1. Validate on Blur

Only show errors after the user has interacted with the field:

```typescript
<input 
  onBlur={() => validateField('email')}
  onChange={(e) => {
    setFieldValue('email', e.target.value);
    // Don't validate on every keystroke
  }}
/>
```

### 2. Clear Errors on Change

Clear field errors when the user starts typing:

```typescript
setFieldValue: (field, value) => {
  set((state) => ({
    [field]: {
      ...state[field],
      value,
      error: null,  // Clear error on change
    },
  }));
}
```

### 3. Disable Submit While Errors Exist

```typescript
<button 
  type="submit"
  disabled={useForm((s) => !!(s.email.error || s.password.error))}
>
  Login
</button>
```

### 4. Show Loading State

```typescript
type FormStore = {
  // ... fields
  isSubmitting: boolean
  setIsSubmitting: (value: boolean) => void
}

// In handleSubmit
handleSubmit: (cb) => async (e) => {
  e.preventDefault()
  get().validateField('email')
  get().validateField('password')
  
  if(!get().email.error && !get().password.error) {
    set({ isSubmitting: true })
    try {
      await cb({
        email: get().email.value,
        password: get().password.value,
      })
    } finally {
      set({ isSubmitting: false })
    }
  }
}
```

## Why Zustic Works Great for Forms

**Lightweight** - Only ~500B, won't bloat your bundle  
**Simple** - No complex middleware setup needed  
**Type-safe** - Full TypeScript support  
**Flexible** - Works with any validation approach  
**Performant** - Efficient re-renders with selectors  
**Familiar** - Similar to other state management libraries

## Conclusion

This pattern gives you everything you need for form state management:
- Simple validation rules
- Type-safe updates
- Clean component structure
- Easy to extend and customize

Start building better forms with Zustic today! 

