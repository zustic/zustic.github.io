---
sidebar_position: 2
title: API Reference
description: Complete API reference for createForm function, Controller component, and form state management methods with type definitions.
keywords: [hook-form API, createForm, Controller, form methods, setFieldValue, handleSubmit, validation]
---

# Hook Form API Reference

Complete API documentation for all Hook Form functions and methods.

## `createForm<T>(params)`

Creates a type-safe form instance with validation and state management.

**Type Parameters:**
- `T` - Type of form values (must extend `Record<string, any>`)

**Parameters:**

```typescript
interface HookFormParams<T extends Record<string, any>> {
  // Initial field values with optional validation rules
  defaultValues: {
    [K in keyof T]: Field<T[K]> | T[K];
  };
  
  // Optional custom validation resolver (Zod, Yup, etc)
  resolver?: Resolver<T>;
}
```

**Returns:** A function that returns form methods and Controller component

**Example:**

```typescript
import { createForm, zodResolver } from 'zustic/hook-form';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const form = createForm<{ email: string; password: string }>({
  defaultValues: {
    email: { value: '', required: true },
    password: { value: '', required: true }
  },
  resolver: zodResolver(schema)
});
```

---

## Form Hook

Call the form function returned by `createForm` in your component:

```typescript
const { handleSubmit, Controller, watch, setValue, ... } = form();
```

### Returned Methods

#### `handleSubmit(callback)`

Submit handler that validates all fields before calling callback.

```typescript
const handleSubmit: (
  cb: (data: T) => void | Promise<void>
) => (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
```

**Example:**

```tsx
const { handleSubmit } = form();

const onSubmit = (data: LoginForm) => {
  console.log('Valid data:', data);
  // Make API call, redirect, etc
};

return (
  <form onSubmit={handleSubmit(onSubmit)}>
    {/* form fields */}
  </form>
);
```

---

#### `Controller`

Component for controlled form inputs with automatic validation.

```typescript
interface ControllerProps<T extends Record<string, any>> {
  // Field name to control
  field: keyof T;
  
  // Render function receiving field props
  render: (field: {
    value: any;
    error: string;
    onChange: (value: any) => void;
  }) => React.ReactNode;
}
```

**Example:**

```tsx
const { Controller } = form();

<Controller
  field="email"
  render={({ value, error, onChange }) => (
    <div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="email"
      />
      {error && <span className="error">{error}</span>}
    </div>
  )}
/>
```

---

#### `watch(field)`

Get current field value with automatic re-renders.

```typescript
const watch: (field: keyof T) => T[keyof T];
```

**Example:**

```tsx
const { watch } = form();

const email = watch('email');
const password = watch('password');

return (
  <p>
    Email: {email}
    {password.length > 0 && ' ✓'}
  </p>
);
```

---

#### `setValue(field, value)`

Update field value programmatically.

```typescript
const setValue: (field: keyof T, value: T[keyof T]) => void;
```

**Example:**

```tsx
const { setValue } = form();

// Pre-fill form
useEffect(() => {
  setValue('email', 'user@example.com');
  setValue('name', 'John Doe');
}, []);
```

---

#### `setFieldValue(field, value)`

Update field value with type conversion (string to number, etc).

```typescript
const setFieldValue: (field: keyof T, value: any) => void;
```

**Example:**

```tsx
const { setFieldValue } = form();

// Auto-converts string to number
setFieldValue('age', '25');  // Converts to number 25
```

---

#### `getErrors(field?)`

Get all form errors or specific field error.

```typescript
const getErrors: (field?: keyof T) => 
  | Partial<Record<keyof T, string>>
  | string;
```

**Example:**

```tsx
const { getErrors } = form();

// Get all errors
const errors = getErrors();
// { email: "Invalid email", password: "Too short" }

// Get specific field error
const emailError = getErrors('email');
// "Invalid email"
```

---

#### `setError(field, error)`

Manually set error for a field (useful for server-side errors).

```typescript
const setError: (field: keyof T, error: string) => void;
```

**Example:**

```tsx
const { setError } = form();

try {
  await api.login(data);
} catch (error) {
  setError('email', 'Email already registered');
}
```

---

#### `clearFieldError(field)`

Clear error for a specific field.

```typescript
const clearFieldError: (field: keyof T) => void;
```

**Example:**

```tsx
const { clearFieldError } = form();

clearFieldError('email');  // Removes error
```

---

#### `clearAllErrors()`

Clear all field errors at once.

```typescript
const clearAllErrors: () => void;
```

**Example:**

```tsx
const { clearAllErrors } = form();

clearAllErrors();  // Clears all errors
```

---

#### `isDirty(field?)`

Check if form or specific field has been modified.

```typescript
const isDirty: (field?: keyof T) => boolean;
```

**Example:**

```tsx
const { isDirty } = form();

// Check if any field changed
if (isDirty()) {
  console.log('Form has unsaved changes');
}

// Check specific field
if (isDirty('email')) {
  console.log('Email was modified');
}
```

---

#### `isTouched(field)`

Check if field has been focused/interacted with.

```typescript
const isTouched: (field: keyof T) => boolean;
```

**Example:**

```tsx
const { isTouched, getErrors } = form();

<Controller
  field="email"
  render={({ value, error, onChange }) => (
    <div>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
      {/* Only show error if field was touched */}
      {isTouched('email') && error && (
        <span className="error">{error}</span>
      )}
    </div>
  )}
/>
```

---

#### `setTouched(field, touched)`

Manually set field touched state.

```typescript
const setTouched: (field: keyof T, touched: boolean) => void;
```

**Example:**

```tsx
const { setTouched } = form();

// Mark as touched to show errors
setTouched('email', true);

// Mark as not touched to hide errors
setTouched('email', false);
```

---

#### `getValues(field?)`

Get all form values or specific field value.

```typescript
const getValues: (field?: keyof T) => T | T[keyof T];
```

**Example:**

```tsx
const { getValues } = form();

// Get all values
const formData = getValues();
// { email: "user@example.com", password: "secret123" }

// Get specific value
const email = getValues('email');
// "user@example.com"
```

---

#### `reset()`

Reset form to initial values and clear all errors.

```typescript
const reset: () => void;
```

**Example:**

```tsx
const { reset, handleSubmit } = form();

const onSubmit = async (data: T) => {
  await api.submit(data);
  reset();  // Clear form after successful submit
};
```

---

## Validation Rules

### Built-In Rules

```typescript
interface Field<T> {
  value: T;
  error?: string;
  touched?: boolean;
  isDirty?: boolean;
  
  // Required validation
  required?: boolean | {
    value: boolean;
    message: string;
  };
  
  // Pattern validation (strings only)
  pattern?: {
    value: RegExp;
    message: string;
  };
  
  // Minimum value or length
  min?: number | {
    value: number;
    message: string;
  };
  
  // Maximum value or length
  max?: number | {
    value: number;
    message: string;
  };
}
```

**Example:**

```typescript
const form = createForm({
  defaultValues: {
    email: {
      value: '',
      required: { value: true, message: 'Email is required' },
      pattern: {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Invalid email format'
      }
    },
    age: {
      value: 0,
      min: { value: 18, message: 'Must be 18+' },
      max: { value: 120, message: 'Invalid age' }
    },
    password: {
      value: '',
      min: { value: 8, message: 'Min 8 characters' }
    }
  }
});
```

---

### Custom Resolvers (Zod/Yup)

#### `zodResolver(schema)`

Create validation resolver from Zod schema.

```typescript
import { z } from 'zod';
import { zodResolver } from 'zustic/hook-form';

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

#### `yupResolver(schema)`

Create validation resolver from Yup schema.

```typescript
import * as yup from 'yup';
import { yupResolver } from 'zustic/hook-form';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required(),
  password: yup.string().min(8, 'Min 8 characters').required(),
  age: yup.number().min(18, 'Must be 18+').required()
});

const form = createForm({
  defaultValues: {
    email: '',
    password: '',
    age: 0
  },
  resolver: yupResolver(schema)
});
```

---

## Type Definitions

### `HookFormParams<T>`

Configuration for form creation.

```typescript
interface HookFormParams<T extends Record<string, any>> {
  defaultValues: {
    [K in keyof T]: Field<T[K]> | T[K];
  };
  resolver?: Resolver<T>;
}
```

### `Field<T>`

Individual field state and configuration.

```typescript
type Field<T> = {
  value: T;
  error?: string;
  touched?: boolean;
  isDirty?: boolean;
  required?: RequiredRule;
  pattern?: { value: RegExp; message: string };
  min?: NumberRule;
  max?: NumberRule;
};
```

### `FormState<T>`

Complete form state with all methods.

```typescript
type FormState<T> = Record<keyof T, Field<T[keyof T]>> & {
  setFieldValue: (field: keyof T, value: any) => void;
  setValue: (field: keyof T, value: T[keyof T]) => void;
  getErrors: (field?: keyof T) => Record<keyof T, string> | string;
  setError: (field: keyof T, error: string) => void;
  clearFieldError: (field: keyof T) => void;
  clearAllErrors: () => void;
  isDirty: (field?: keyof T) => boolean;
  isTouched: (field: keyof T) => boolean;
  setTouched: (field: keyof T, touched: boolean) => void;
  getValues: (field?: keyof T) => T | T[keyof T];
  handleSubmit: (cb: (data: T) => void) => (e: React.FormEvent) => Promise<void>;
  reset: () => void;
};
```

---

## Common Patterns

### Simple Form

```typescript
const form = createForm<{ email: string }>({
  defaultValues: {
    email: { value: '', required: true }
  }
});

const { handleSubmit, Controller } = form();
```

### With Zod Schema

```typescript
const schema = z.object({ email: z.string().email() });

const form = createForm({
  defaultValues: { email: '' },
  resolver: zodResolver(schema)
});
```

### With Default Values

```typescript
const form = createForm({
  defaultValues: {
    email: 'user@example.com',
    password: ''
  }
});
```

### With Validation Rules

```typescript
const form = createForm({
  defaultValues: {
    email: {
      value: '',
      required: { value: true, message: 'Required' },
      pattern: {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Invalid email'
      }
    }
  }
});
```

---

## Next Steps

- **[Examples](/docs/tutorial-extras/hook-form-examples)** - Real-world implementations
- **[Advanced Guide](/docs/tutorial-extras/hook-form-advanced)** - Advanced patterns
- **[Getting Started](/docs/tutorial-extras/hook-form-getting-started)** - Quick start guide
