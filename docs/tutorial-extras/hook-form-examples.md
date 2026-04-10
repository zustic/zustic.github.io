---
sidebar_position: 3
title: Examples
description: Real-world Hook Form examples including login forms, registration, multi-step forms, and validation patterns with Zod and Yup.
keywords: [hook-form examples, form validation, Zod validation, Yup validation, React forms, form patterns]
---

# Hook Form Examples

Real-world form implementation examples using Zustic Hook Form.

## Example 1: Simple Login Form

Basic form with built-in validation.

```tsx
'use client';

import { createForm } from 'zustic/hook-form';
import { useState } from 'react';

interface LoginData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const loginForm = createForm<LoginData>({
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
    rememberMe: { value: false }
  }
});

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { handleSubmit, Controller, getErrors } = loginForm();
  const errors = getErrors();

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        console.log('Login successful');
        // Redirect to dashboard
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="login-form">
      <h2>Login</h2>

      <div className="form-group">
        <label>Email</label>
        <Controller
          field="email"
          render={({ value, onChange }) => (
            <input
              type="email"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="your@email.com"
              className="input"
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
              placeholder="••••••••"
              className="input"
            />
          )}
        />
        {errors.password && <span className="error">{errors.password}</span>}
      </div>

      <div className="form-group checkbox">
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

      <button type="submit" disabled={isLoading} className="button">
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

---

## Example 2: Registration with Zod Validation

Complex form with Zod schema validation.

```tsx
'use client';

import { createForm, zodResolver } from 'zustic/hook-form';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters').max(50, 'Max 50 characters'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Min 2 characters'),
  age: z.number().min(18, 'Must be 18+').max(120, 'Invalid age'),
  terms: z.boolean().refine(val => val === true, 'You must agree to terms')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

type RegistrationData = z.infer<typeof schema>;

const registrationForm = createForm<RegistrationData>({
  defaultValues: {
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    age: 0,
    terms: false
  },
  resolver: zodResolver(schema)
});

export function RegistrationForm() {
  const { handleSubmit, Controller, getErrors, isDirty } = registrationForm();
  const errors = getErrors();

  const onSubmit = async (data: RegistrationData) => {
    console.log('Register:', data);
    // Call API
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="registration-form">
      <h2>Create Account</h2>

      <div className="form-group">
        <label>Full Name *</label>
        <Controller
          field="fullName"
          render={({ value, onChange }) => (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="John Doe"
            />
          )}
        />
        {errors.fullName && <span className="error">{errors.fullName}</span>}
      </div>

      <div className="form-group">
        <label>Email *</label>
        <Controller
          field="email"
          render={({ value, onChange }) => (
            <input
              type="email"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="your@email.com"
            />
          )}
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label>Age *</label>
        <Controller
          field="age"
          render={({ value, onChange }) => (
            <input
              type="number"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="25"
            />
          )}
        />
        {errors.age && <span className="error">{errors.age}</span>}
      </div>

      <div className="form-group">
        <label>Password *</label>
        <Controller
          field="password"
          render={({ value, onChange }) => (
            <input
              type="password"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="••••••••"
            />
          )}
        />
        {errors.password && <span className="error">{errors.password}</span>}
      </div>

      <div className="form-group">
        <label>Confirm Password *</label>
        <Controller
          field="confirmPassword"
          render={({ value, onChange }) => (
            <input
              type="password"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="••••••••"
            />
          )}
        />
        {errors.confirmPassword && (
          <span className="error">{errors.confirmPassword}</span>
        )}
      </div>

      <div className="form-group checkbox">
        <Controller
          field="terms"
          render={({ value, onChange }) => (
            <label>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
              />
              I agree to terms and conditions
            </label>
          )}
        />
        {errors.terms && <span className="error">{errors.terms}</span>}
      </div>

      <button 
        type="submit" 
        disabled={!isDirty()}
        className="button"
      >
        Create Account
      </button>
    </form>
  );
}
```

---

## Example 3: Multi-Step Form

Break complex forms into steps.

```tsx
'use client';

import { createForm, zodResolver } from 'zustic/hook-form';
import { z } from 'zod';
import { useState } from 'react';

const schema = z.object({
  // Step 1
  fullName: z.string().min(2),
  email: z.string().email(),
  // Step 2
  address: z.string().min(5),
  city: z.string().min(2),
  zipCode: z.string().min(5),
  // Step 3
  cardNumber: z.string().regex(/^\d{16}$/),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/),
  cvc: z.string().regex(/^\d{3,4}$/)
});

type CheckoutData = z.infer<typeof schema>;

const checkoutForm = createForm<CheckoutData>({
  defaultValues: {
    fullName: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    cardNumber: '',
    expiry: '',
    cvc: ''
  },
  resolver: zodResolver(schema)
});

export function MultiStepCheckout() {
  const [step, setStep] = useState(1);
  const { handleSubmit, Controller, watch, getErrors } = checkoutForm();
  const errors = getErrors();

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const onSubmit = (data: CheckoutData) => {
    console.log('Checkout complete:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="multi-step-form">
      <div className="step-indicator">
        Step {step} of 3
      </div>

      {step === 1 && (
        <div className="step">
          <h3>Personal Information</h3>
          
          <div className="form-group">
            <label>Full Name</label>
            <Controller
              field="fullName"
              render={({ value, onChange }) => (
                <input
                  type="text"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                />
              )}
            />
            {errors.fullName && <span className="error">{errors.fullName}</span>}
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
        </div>
      )}

      {step === 2 && (
        <div className="step">
          <h3>Shipping Address</h3>
          
          <div className="form-group">
            <label>Address</label>
            <Controller
              field="address"
              render={({ value, onChange }) => (
                <input
                  type="text"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                />
              )}
            />
            {errors.address && <span className="error">{errors.address}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <Controller
                field="city"
                render={({ value, onChange }) => (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                  />
                )}
              />
              {errors.city && <span className="error">{errors.city}</span>}
            </div>

            <div className="form-group">
              <label>Zip Code</label>
              <Controller
                field="zipCode"
                render={({ value, onChange }) => (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                  />
                )}
              />
              {errors.zipCode && <span className="error">{errors.zipCode}</span>}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="step">
          <h3>Payment Information</h3>
          
          <div className="form-group">
            <label>Card Number</label>
            <Controller
              field="cardNumber"
              render={({ value, onChange }) => (
                <input
                  type="text"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="1234567890123456"
                />
              )}
            />
            {errors.cardNumber && <span className="error">{errors.cardNumber}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Expiry (MM/YY)</label>
              <Controller
                field="expiry"
                render={({ value, onChange }) => (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="12/25"
                  />
                )}
              />
              {errors.expiry && <span className="error">{errors.expiry}</span>}
            </div>

            <div className="form-group">
              <label>CVC</label>
              <Controller
                field="cvc"
                render={({ value, onChange }) => (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="123"
                  />
                )}
              />
              {errors.cvc && <span className="error">{errors.cvc}</span>}
            </div>
          </div>
        </div>
      )}

      <div className="button-group">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 1}
          className="button secondary"
        >
          Back
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="button primary"
          >
            Next
          </button>
        ) : (
          <button type="submit" className="button primary">
            Complete Order
          </button>
        )}
      </div>
    </form>
  );
}
```

---

## Example 4: Dynamic Field Validation

Show/hide fields based on conditions.

```tsx
'use client';

import { createForm } from 'zustic/hook-form';
import { useState } from 'react';

interface SurveyData {
  name: string;
  satisfied: boolean;
  feedbackMessage?: string;
  improvementArea?: string;
}

const surveyForm = createForm<SurveyData>({
  defaultValues: {
    name: { value: '', required: true },
    satisfied: { value: true },
    feedbackMessage: { value: '' },
    improvementArea: { value: '' }
  }
});

export function SurveyForm() {
  const { Controller, watch, setError, getErrors } = surveyForm();
  const satisfied = watch('satisfied');
  const errors = getErrors();

  return (
    <form className="survey-form">
      <h3>Customer Satisfaction Survey</h3>

      <div className="form-group">
        <label>Name *</label>
        <Controller
          field="name"
          render={({ value, onChange }) => (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label>Are you satisfied? *</label>
        <Controller
          field="satisfied"
          render={({ value, onChange }) => (
            <div>
              <label>
                <input
                  type="radio"
                  checked={value === true}
                  onChange={() => onChange('true')}
                />
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  checked={value === false}
                  onChange={() => onChange('false')}
                />
                No
              </label>
            </div>
          )}
        />
      </div>

      {!satisfied && (
        <>
          <div className="form-group">
            <label>What could we improve? *</label>
            <Controller
              field="improvementArea"
              render={({ value, onChange }) => (
                <select
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="quality">Product Quality</option>
                  <option value="price">Price</option>
                  <option value="service">Customer Service</option>
                  <option value="delivery">Delivery Speed</option>
                </select>
              )}
            />
            {errors.improvementArea && (
              <span className="error">{errors.improvementArea}</span>
            )}
          </div>

          <div className="form-group">
            <label>Additional Comments</label>
            <Controller
              field="feedbackMessage"
              render={({ value, onChange }) => (
                <textarea
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="Tell us more..."
                  rows={4}
                />
              )}
            />
          </div>
        </>
      )}

      <button type="submit" className="button">
        Submit Survey
      </button>
    </form>
  );
}
```

---

## Example 5: Server-Side Error Handling

Handle API validation errors.

```tsx
'use client';

import { createForm } from 'zustic/hook-form';
import { useState } from 'react';

interface UpdateProfileData {
  username: string;
  email: string;
  bio: string;
}

const profileForm = createForm<UpdateProfileData>({
  defaultValues: {
    username: { value: '', required: true },
    email: { value: '', required: true },
    bio: { value: '' }
  }
});

export function UpdateProfileForm({ currentUser }: { currentUser: UpdateProfileData }) {
  const [isLoading, setIsLoading] = useState(false);
  const { 
    handleSubmit, 
    Controller, 
    getErrors, 
    setError, 
    setValue,
    reset 
  } = profileForm();
  const errors = getErrors();

  const onSubmit = async (data: UpdateProfileData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Set individual field errors from server
        if (errorData.errors) {
          Object.entries(errorData.errors).forEach(([field, message]) => {
            setError(field as keyof UpdateProfileData, message as string);
          });
        } else {
          setError('username', 'Failed to update profile');
        }
        return;
      }

      const updatedUser = await response.json();
      console.log('Profile updated:', updatedUser);
      // Show success message
    } catch (error) {
      setError('username', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="profile-form">
      <h3>Update Profile</h3>

      <div className="form-group">
        <label>Username *</label>
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
        <label>Email *</label>
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
        <label>Bio</label>
        <Controller
          field="bio"
          render={({ value, onChange }) => (
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Tell us about yourself"
              rows={4}
            />
          )}
        />
      </div>

      <div className="button-group">
        <button
          type="button"
          onClick={() => reset()}
          className="button secondary"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="button primary"
        >
          {isLoading ? 'Updating...' : 'Update Profile'}
        </button>
      </div>
    </form>
  );
}
```

---

## Next Steps

- **[Advanced Guide](/docs/tutorial-extras/hook-form-advanced)** - Advanced patterns and techniques
- **[API Reference](/docs/tutorial-extras/hook-form-api-reference)** - Complete API documentation
- **[Getting Started](/docs/tutorial-extras/hook-form-getting-started)** - Quick start guide
