---
sidebar_position: 4
title: Advanced Guide
description: Advanced patterns for Zustic Hook Form including custom resolvers, dependent fields, async validation, and performance optimization.
keywords: [hook-form advanced, custom validation, async validation, dependent fields, form performance, custom resolvers]
---

# Hook Form Advanced Guide

Advanced patterns, techniques, and best practices for Zustic Hook Form.

## Custom Validation Resolvers

Create domain-specific validation logic beyond Zod and Yup.

```tsx
'use client';

import { createForm } from 'zustic/hook-form';
import type { FieldValue } from 'zustic/hook-form';

// Custom resolver for specific business logic
const customResolver = async (values: Record<string, FieldValue>) => {
  const errors: Record<string, string> = {};

  // Validate username uniqueness (async)
  if (values.username) {
    try {
      const response = await fetch(`/api/check-username?username=${values.username}`);
      if (!response.ok) {
        errors.username = 'Username is already taken';
      }
    } catch {
      errors.username = 'Failed to validate username';
    }
  }

  // Validate password complexity
  if (values.password) {
    const password = String(values.password);
    if (!/[A-Z]/.test(password)) {
      errors.password = 'Must contain uppercase letter';
    } else if (!/[0-9]/.test(password)) {
      errors.password = 'Must contain number';
    } else if (!/[!@#$%^&*]/.test(password)) {
      errors.password = 'Must contain special character';
    }
  }

  // Validate email domain whitelist
  if (values.email) {
    const email = String(values.email);
    const domain = email.split('@')[1];
    const allowedDomains = ['company.com', 'trusted.org'];
    if (!allowedDomains.includes(domain)) {
      errors.email = `Email must be from ${allowedDomains.join(' or ')}`;
    }
  }

  return { errors, values };
};

interface AdvancedValidationData {
  username: string;
  email: string;
  password: string;
}

const advancedForm = createForm<AdvancedValidationData>({
  defaultValues: {
    username: '',
    email: '',
    password: ''
  },
  resolver: customResolver
});

export function CustomValidationExample() {
  const { handleSubmit, Controller, getErrors, isDirty } = advancedForm();
  const errors = getErrors();

  const onSubmit = (data: AdvancedValidationData) => {
    console.log('Form valid:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h3>Account Setup with Custom Validation</h3>

      <div className="form-group">
        <label>Username</label>
        <Controller
          field="username"
          render={({ value, onChange }) => (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        />
        {errors.username && <span className="error">{errors.username}</span>}
      </div>

      <div className="form-group">
        <label>Email</label>
        <Controller
          field="email"
          render={({ value, onChange }) => (
            <input
              type="email"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label>Password</label>
        <Controller
          field="password"
          render={({ value, onChange }) => (
            <input
              type="password"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        />
        {errors.password && <span className="error">{errors.password}</span>}
      </div>

      <button type="submit" disabled={!isDirty()}>
        Create Account
      </button>
    </form>
  );
}
```

---

## Dependent Field Validation

Validate fields based on other field values.

```tsx
'use client';

import { createForm, zodResolver } from 'zustic/hook-form';
import { z } from 'zod';

interface PricingData {
  planType: 'basic' | 'pro' | 'enterprise';
  userCount: number;
  billingCycle: 'monthly' | 'annual';
  companySize: 'small' | 'medium' | 'large';
}

// Zod with refine for dependent validation
const schema = z.object({
  planType: z.enum(['basic', 'pro', 'enterprise']),
  userCount: z.number().min(1),
  billingCycle: z.enum(['monthly', 'annual']),
  companySize: z.enum(['small', 'medium', 'large'])
}).refine(
  (data) => {
    // Enterprise plan requires at least 50 users
    if (data.planType === 'enterprise' && data.userCount < 50) {
      return false;
    }
    return true;
  },
  {
    message: 'Enterprise plan requires minimum 50 users',
    path: ['userCount']
  }
).refine(
  (data) => {
    // Large companies shouldn't use basic plan
    if (data.companySize === 'large' && data.planType === 'basic') {
      return false;
    }
    return true;
  },
  {
    message: 'Large companies should use Pro or Enterprise plans',
    path: ['planType']
  }
).refine(
  (data) => {
    // Annual billing only for pro/enterprise
    if (data.billingCycle === 'annual' && data.planType === 'basic') {
      return false;
    }
    return true;
  },
  {
    message: 'Annual billing not available for Basic plan',
    path: ['billingCycle']
  }
);

type PricingFormData = z.infer<typeof schema>;

const pricingForm = createForm<PricingFormData>({
  defaultValues: {
    planType: 'basic',
    userCount: 5,
    billingCycle: 'monthly',
    companySize: 'small'
  },
  resolver: zodResolver(schema)
});

export function DependentFieldValidation() {
  const { handleSubmit, Controller, watch, getErrors } = pricingForm();
  const planType = watch('planType');
  const companySize = watch('companySize');
  const errors = getErrors();

  // Calculate price based on dependent fields
  const calculatePrice = () => {
    const basePrice = planType === 'basic' ? 50 : planType === 'pro' ? 150 : 500;
    const discount = planType === 'enterprise' ? 0.2 : 0.1;
    return Math.round(basePrice * (1 - discount) * 100) / 100;
  };

  const onSubmit = (data: PricingFormData) => {
    console.log('Pricing selected:', data, 'Price: $' + calculatePrice());
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pricing-form">
      <h3>Select Your Plan</h3>

      <div className="form-group">
        <label>Company Size</label>
        <Controller
          field="companySize"
          render={({ value, onChange }) => (
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
            >
              <option value="small">Small (1-10)</option>
              <option value="medium">Medium (11-50)</option>
              <option value="large">Large (50+)</option>
            </select>
          )}
        />
        {errors.companySize && <span className="error">{errors.companySize}</span>}
      </div>

      <div className="form-group">
        <label>Plan Type</label>
        <Controller
          field="planType"
          render={({ value, onChange }) => (
            <div className="plan-options">
              {(['basic', 'pro', 'enterprise'] as const).map((plan) => (
                <label key={plan}>
                  <input
                    type="radio"
                    checked={value === plan}
                    onChange={() => onChange(plan)}
                  />
                  {plan.charAt(0).toUpperCase() + plan.slice(1)} - ${plan === 'basic' ? 50 : plan === 'pro' ? 150 : 500}/mo
                </label>
              ))}
            </div>
          )}
        />
        {errors.planType && <span className="error">{errors.planType}</span>}
      </div>

      <div className="form-group">
        <label>Number of Users</label>
        <Controller
          field="userCount"
          render={({ value, onChange }) => (
            <input
              type="number"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              min="1"
            />
          )}
        />
        {errors.userCount && <span className="error">{errors.userCount}</span>}
        {planType === 'enterprise' && (
          <span className="info">Enterprise requires minimum 50 users</span>
        )}
      </div>

      {planType !== 'basic' && (
        <div className="form-group">
          <label>Billing Cycle</label>
          <Controller
            field="billingCycle"
            render={({ value, onChange }) => (
              <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
              >
                <option value="monthly">Monthly (10% discount)</option>
                <option value="annual">Annual (20% discount)</option>
              </select>
            )}
          />
          {errors.billingCycle && (
            <span className="error">{errors.billingCycle}</span>
          )}
        </div>
      )}

      <div className="price-summary">
        <strong>Total: ${calculatePrice()}/month</strong>
      </div>

      <button type="submit" className="button">
        Continue to Checkout
      </button>
    </form>
  );
}
```

---

## Async Validation with Debounce

Real-time validation with API calls.

```tsx
'use client';

import { createForm } from 'zustic/hook-form';
import { useEffect, useRef, useState } from 'react';

interface AvailabilityData {
  domain: string;
  handle: string;
}

const availabilityForm = createForm<AvailabilityData>({
  defaultValues: {
    domain: '',
    handle: ''
  }
});

// Debounce helper
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function AsyncValidationExample() {
  const { Controller, watch, setError, clearErrors } = availabilityForm();
  const domain = watch('domain');
  const handle = watch('handle');
  
  const [isCheckingDomain, setIsCheckingDomain] = useState(false);
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const [availableDomain, setAvailableDomain] = useState<boolean | null>(null);
  const [availableHandle, setAvailableHandle] = useState<boolean | null>(null);

  // Check domain availability
  const checkDomainAvailability = useRef(
    debounce(async (domain: string) => {
      if (!domain || domain.length < 3) return;
      
      setIsCheckingDomain(true);
      try {
        const response = await fetch(`/api/check-domain?name=${domain}`);
        const data = await response.json();
        
        if (data.available) {
          setAvailableDomain(true);
          clearErrors('domain');
        } else {
          setAvailableDomain(false);
          setError('domain', `${domain} is already taken`);
        }
      } catch {
        setError('domain', 'Failed to check availability');
      } finally {
        setIsCheckingDomain(false);
      }
    }, 500)
  ).current;

  // Check handle availability
  const checkHandleAvailability = useRef(
    debounce(async (handle: string) => {
      if (!handle || handle.length < 2) return;
      
      setIsCheckingHandle(true);
      try {
        const response = await fetch(`/api/check-handle?handle=${handle}`);
        const data = await response.json();
        
        if (data.available) {
          setAvailableHandle(true);
          clearErrors('handle');
        } else {
          setAvailableHandle(false);
          setError('handle', `@${handle} is already taken`);
        }
      } catch {
        setError('handle', 'Failed to check availability');
      } finally {
        setIsCheckingHandle(false);
      }
    }, 500)
  ).current;

  useEffect(() => {
    checkDomainAvailability(domain);
  }, [domain]);

  useEffect(() => {
    checkHandleAvailability(handle);
  }, [handle]);

  return (
    <form className="async-validation-form">
      <h3>Check Availability</h3>

      <div className="form-group">
        <label>Domain Name</label>
        <div className="input-wrapper">
          <Controller
            field="domain"
            render={({ value, onChange }) => (
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="example"
              />
            )}
          />
          <span className="domain-extension">.com</span>
          {isCheckingDomain && <span className="loader">Checking...</span>}
          {availableDomain === true && (
            <span className="success">✓ Available</span>
          )}
          {availableDomain === false && (
            <span className="error">✗ Taken</span>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Social Handle</label>
        <div className="input-wrapper">
          <span className="prefix">@</span>
          <Controller
            field="handle"
            render={({ value, onChange }) => (
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="yourhandle"
              />
            )}
          />
          {isCheckingHandle && <span className="loader">Checking...</span>}
          {availableHandle === true && (
            <span className="success">✓ Available</span>
          )}
          {availableHandle === false && (
            <span className="error">✗ Taken</span>
          )}
        </div>
      </div>
    </form>
  );
}
```

---

## Form State Management

Advanced state management patterns.

```tsx
'use client';

import { createForm } from 'zustic/hook-form';
import { useState, useCallback } from 'react';

interface DocumentData {
  title: string;
  content: string;
  tags: string[];
  published: boolean;
}

const documentForm = createForm<DocumentData>({
  defaultValues: {
    title: '',
    content: '',
    tags: [],
    published: false
  }
});

export function FormStateManagement() {
  const { 
    handleSubmit, 
    Controller, 
    watch, 
    reset, 
    setValue,
    getValues,
    isDirty,
    isTouched,
    getErrors 
  } = documentForm();
  
  const [versions, setVersions] = useState<DocumentData[]>([]);
  const [currentVersion, setCurrentVersion] = useState(0);

  const allValues = getValues();
  const errors = getErrors();

  // Save version
  const handleSaveVersion = useCallback(() => {
    const values = getValues();
    setVersions(prev => [...prev, values]);
    setCurrentVersion(prev => prev + 1);
  }, []);

  // Restore version
  const handleRestoreVersion = (index: number) => {
    const version = versions[index];
    Object.keys(version).forEach(key => {
      setValue(key as keyof DocumentData, version[key as keyof DocumentData]);
    });
    setCurrentVersion(index);
  };

  // Compare with last version
  const hasChanges = isDirty();
  const changedFields = isTouched();

  // Autosave effect
  const handleAutosave = useCallback(() => {
    if (isDirty()) {
      console.log('Autosaving...', getValues());
      // Implement autosave logic
    }
  }, [isDirty()]);

  const onSubmit = (data: DocumentData) => {
    console.log('Publishing document:', data);
  };

  return (
    <div className="form-state-management">
      <form onSubmit={handleSubmit(onSubmit)}>
        <h3>Document Editor</h3>

        <div className="state-indicator">
          {hasChanges && <span className="unsaved">• Unsaved changes</span>}
          {!hasChanges && <span className="saved">✓ Saved</span>}
        </div>

        <div className="form-group">
          <label>Title</label>
          <Controller
            field="title"
            render={({ value, onChange }) => (
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
              />
            )}
          />
        </div>

        <div className="form-group">
          <label>Content</label>
          <Controller
            field="content"
            render={({ value, onChange }) => (
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={8}
              />
            )}
          />
        </div>

        <div className="form-group">
          <label>Tags (comma-separated)</label>
          <Controller
            field="tags"
            render={({ value, onChange }) => (
              <input
                type="text"
                value={Array.isArray(value) ? value.join(', ') : ''}
                onChange={(e) => onChange(e.target.value.split(',').map(t => t.trim()))}
              />
            )}
          />
        </div>

        <div className="form-group checkbox">
          <Controller
            field="published"
            render={({ value, onChange }) => (
              <label>
                <input
                  type="checkbox"
                  checked={value === 'true' || value === true}
                  onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
                />
                Published
              </label>
            )}
          />
        </div>

        <div className="button-group">
          <button
            type="button"
            onClick={() => reset()}
            className="button secondary"
          >
            Discard Changes
          </button>
          <button
            type="button"
            onClick={handleSaveVersion}
            className="button secondary"
          >
            Save Version
          </button>
          <button
            type="submit"
            disabled={!hasChanges}
            className="button primary"
          >
            Publish
          </button>
        </div>
      </form>

      {versions.length > 0 && (
        <div className="version-history">
          <h4>Version History</h4>
          {versions.map((version, index) => (
            <div key={index} className="version-item">
              <span>Version {index + 1}</span>
              <span>{version.title || '(untitled)'}</span>
              <button
                type="button"
                onClick={() => handleRestoreVersion(index)}
                className="button-small"
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Performance Optimization

Prevent unnecessary re-renders and optimize large forms.

```tsx
'use client';

import { createForm } from 'zustic/hook-form';
import { memo, useCallback } from 'react';

interface UserListData {
  users: Array<{ id: string; name: string; email: string }>;
}

const userListForm = createForm<UserListData>({
  defaultValues: {
    users: []
  }
});

// Memoized field component
const UserFieldRow = memo(
  ({ index, onRemove }: { index: number; onRemove: () => void }) => {
    const { Controller, watch } = userListForm();
    const user = watch(`users[${index}]`);

    return (
      <div className="user-row">
        <Controller
          field={`users[${index}].name`}
          render={({ value, onChange }) => (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Name"
            />
          )}
        />
        <Controller
          field={`users[${index}].email`}
          render={({ value, onChange }) => (
            <input
              type="email"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Email"
            />
          )}
        />
        <button
          type="button"
          onClick={onRemove}
          className="button-remove"
        >
          Remove
        </button>
      </div>
    );
  }
);

UserFieldRow.displayName = 'UserFieldRow';

export function PerformanceOptimizedForm() {
  const { 
    Controller, 
    watch, 
    setValue, 
    getValues,
    handleSubmit
  } = userListForm();

  const users = watch('users');

  const handleAddUser = useCallback(() => {
    const current = getValues().users;
    setValue('users', [
      ...current,
      { id: crypto.randomUUID(), name: '', email: '' }
    ]);
  }, []);

  const handleRemoveUser = useCallback((index: number) => {
    const current = getValues().users;
    setValue('users', current.filter((_, i) => i !== index));
  }, []);

  const onSubmit = (data: UserListData) => {
    console.log('Users:', data.users);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="performance-form">
      <h3>User Management</h3>

      <div className="user-list">
        {users.map((user, index) => (
          <UserFieldRow
            key={user.id}
            index={index}
            onRemove={() => handleRemoveUser(index)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddUser}
        className="button secondary"
      >
        + Add User
      </button>

      <button type="submit" className="button primary">
        Save Users
      </button>
    </form>
  );
}
```

---

## Best Practices

### 1. **Type Safety**

Always use TypeScript types for form data:

```tsx
type FormData = z.infer<typeof schema>;
// or
interface FormData {
  // fields
}
```

### 2. **Resolver Choice**

- Use **Zod** for complex schemas with conditional logic
- Use **Yup** for cross-browser compatibility
- Use **custom resolvers** for business-specific validation

### 3. **Performance**

- Memoize field components to prevent unnecessary re-renders
- Use `watch` sparingly - it triggers re-renders
- Consider field-level validation over form-level for large forms

### 4. **Error Handling**

- Always handle async validation errors gracefully
- Provide helpful error messages to users
- Log errors for debugging

### 5. **State Management**

- Use form reset to clear state
- Track `isDirty` for unsaved changes warnings
- Save version history for undo functionality

### 6. **Accessibility**

- Link labels to inputs with `htmlFor`
- Display error messages near fields
- Use proper ARIA attributes for screen readers

---

## Next Steps

- **[Examples](/docs/tutorial-extras/hook-form-examples)** - Real-world use cases
- **[API Reference](/docs/tutorial-extras/hook-form-api-reference)** - Complete API documentation
- **[Getting Started](/docs/tutorial-extras/hook-form-getting-started)** - Quick start guide
