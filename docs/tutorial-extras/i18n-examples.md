---
sidebar_position: 3
title: Examples
description: Real-world i18n examples including static translations, API-based translations, language switcher, forms, and multi-step components.
keywords: [i18n examples, language switcher, translations, form localization, React examples, code samples]
---

# I18n Examples

Real-world examples showing how to use the Zustic i18n library effectively.

## Example 1: Static Translations

Load translations from local objects:

```tsx
// translations.ts
export const translations = {
  en: { 
    greeting: 'Hello', 
    bye: 'Goodbye',
    appName: 'My App'
  },
  es: { 
    greeting: 'Hola', 
    bye: 'Adiós',
    appName: 'Mi App'
  },
  fr: { 
    greeting: 'Bonjour', 
    bye: 'Au revoir',
    appName: 'Mon App'
  },
};

// i18n.ts
import { createI18n } from 'zustic/i18n';

export const useTranslation = createI18n({
  initialLan: 'en',
  // Static translations - no async needed
  resource: (lan) => translations[lan],
});

// App.tsx
'use client';

import { useTranslation } from './i18n';

export function App() {
  const { t, lan, updateTranslation } = useTranslation();

  return (
    <div>
      <h1>{t('greeting')}</h1>
      <select value={lan} onChange={(e) => updateTranslation(e.target.value)}>
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>
    </div>
  );
}
```

---

## Example 2: Dynamic Translations from API

Load translations from a server:

```tsx
// i18n.ts
import { createI18n } from 'zustic/i18n';

type Language = 'en' | 'es' | 'fr';

export const useTranslation = createI18n<any, Language>({
  initialLan: 'en',
  // Fetch from API
  resource: async (lan) => {
    const response = await fetch(`/api/translations/${lan}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${lan} translations`);
    }
    return response.json();
  },
});

// pages/home.tsx
'use client';

import { useTranslation } from './i18n';

export function HomePage() {
  const { t, isInitialLoading, isUpdating } = useTranslation();

  if (isInitialLoading) {
    return <div className="spinner">Loading...</div>;
  }

  return (
    <main>
      {isUpdating && <div className="updating">Updating language...</div>}
      <h1>{t('pages.home.title')}</h1>
      <p>{t('pages.home.description')}</p>
    </main>
  );
}
```

---

## Example 3: Language Switcher Component

```tsx
'use client';

import { useTranslation } from './i18n';

interface LanguageOption {
  code: 'en' | 'es' | 'fr' | 'de';
  name: string;
  flag: string;
}

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

export function LanguageSwitcher() {
  const { lan, updateTranslation, isUpdating } = useTranslation();

  const handleLanguageChange = (newLan: any) => {
    updateTranslation(newLan);
    // Optionally save to localStorage
    localStorage.setItem('preferred-language', newLan);
  };

  return (
    <div className="language-switcher">
      <label>Select Language:</label>
      <div className="button-group">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={isUpdating}
            className={`language-btn ${lan === lang.code ? 'active' : ''}`}
            aria-label={`Switch to ${lang.name}`}
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
          </button>
        ))}
      </div>
      {isUpdating && <span className="updating-indicator">⏳</span>}
    </div>
  );
}
```

---

## Example 4: Nested Translations with Forms

```tsx
// translations.ts
export const en = {
  ui: {
    buttons: {
      submit: 'Submit',
      cancel: 'Cancel',
      delete: 'Delete',
    },
    forms: {
      email: {
        label: 'Email Address',
        placeholder: 'Enter your email',
        error: 'Invalid email',
      },
      password: {
        label: 'Password',
        placeholder: 'Enter password',
        error: 'Password too short',
      },
    },
  },
};

// LoginForm.tsx
'use client';

import { useTranslation } from './i18n';
import { useState } from 'react';

export function LoginForm() {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation logic
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="email">
          {t('ui.forms.email.label')}
        </label>
        <input 
          id="email"
          type="email" 
          placeholder={t('ui.forms.email.placeholder')}
        />
        {errors.email && (
          <span className="error">{t('ui.forms.email.error')}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password">
          {t('ui.forms.password.label')}
        </label>
        <input 
          id="password"
          type="password" 
          placeholder={t('ui.forms.password.placeholder')}
        />
        {errors.password && (
          <span className="error">{t('ui.forms.password.error')}</span>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" className="primary">
          {t('ui.buttons.submit')}
        </button>
        <button type="reset" className="secondary">
          {t('ui.buttons.cancel')}
        </button>
        <button type="button" className="danger">
          {t('ui.buttons.delete')}
        </button>
      </div>
    </form>
  );
}
```

---

## Example 5: Persist Language Preference

```tsx
// i18n.ts
import { createI18n } from 'zustic/i18n';

type Language = 'en' | 'es' | 'fr';

// Get saved language from localStorage
const getSavedLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem('app-language');
  return (saved as Language) || 'en';
};

export const useTranslation = createI18n<any, Language>({
  initialLan: getSavedLanguage(),
  resource: async (lan) => {
    const response = await fetch(`/translations/${lan}.json`);
    return response.json();
  },
});

// App.tsx
'use client';

import { useTranslation } from './i18n';

export function App() {
  const { lan, updateTranslation } = useTranslation();

  const handleLanguageChange = (newLan: Language) => {
    updateTranslation(newLan);
    // Persist to localStorage
    localStorage.setItem('app-language', newLan);
    // Optional: Update document language
    document.documentElement.lang = newLan;
  };

  return (
    <select 
      value={lan} 
      onChange={(e) => handleLanguageChange(e.target.value as Language)}
    >
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="fr">Français</option>
    </select>
  );
}
```

---

## Example 6: E-Commerce Product List

```tsx
// translations.ts
export const translations = {
  en: {
    products: {
      title: 'Products',
      noResults: 'No products found',
      price: 'Price',
      addToCart: 'Add to Cart',
      outOfStock: 'Out of Stock',
    },
    currency: '$',
  },
  es: {
    products: {
      title: 'Productos',
      noResults: 'No se encontraron productos',
      price: 'Precio',
      addToCart: 'Agregar al carrito',
      outOfStock: 'Agotado',
    },
    currency: '€',
  },
};

// ProductList.tsx
'use client';

import { useTranslation } from './i18n';

interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  const { t } = useTranslation();

  if (products.length === 0) {
    return <div>{t('products.noResults')}</div>;
  }

  return (
    <div>
      <h1>{t('products.title')}</h1>
      <div className="product-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <h3>{product.name}</h3>
            <p className="price">
              {t('currency')} {product.price.toFixed(2)}
            </p>
            <button 
              disabled={!product.inStock}
              className={!product.inStock ? 'disabled' : ''}
            >
              {product.inStock 
                ? t('products.addToCart')
                : t('products.outOfStock')
              }
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Example 7: Multi-Step Form with Translations

```tsx
// translations.ts
export const translations = {
  en: {
    steps: {
      personal: 'Personal Information',
      address: 'Address',
      confirmation: 'Confirmation',
    },
    buttons: {
      next: 'Next',
      back: 'Back',
      submit: 'Submit',
    },
  },
  es: {
    steps: {
      personal: 'Información Personal',
      address: 'Dirección',
      confirmation: 'Confirmación',
    },
    buttons: {
      next: 'Siguiente',
      back: 'Atrás',
      submit: 'Enviar',
    },
  },
};

// MultiStepForm.tsx
'use client';

import { useState } from 'react';
import { useTranslation } from './i18n';

export function MultiStepForm() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const getStepKey = (stepNum: number) => {
    const keys = ['personal', 'address', 'confirmation'];
    return `steps.${keys[stepNum - 1]}` as const;
  };

  return (
    <div className="multi-step-form">
      <h2>{t(getStepKey(step))}</h2>
      
      {step === 1 && <PersonalInfoStep t={t} />}
      {step === 2 && <AddressStep t={t} />}
      {step === 3 && <ConfirmationStep t={t} />}

      <div className="button-group">
        {step > 1 && (
          <button onClick={handleBack}>{t('buttons.back')}</button>
        )}
        {step < totalSteps && (
          <button onClick={handleNext}>{t('buttons.next')}</button>
        )}
        {step === totalSteps && (
          <button onClick={() => alert('Submitted!')}>{t('buttons.submit')}</button>
        )}
      </div>

      <div className="progress">
        Step {step} of {totalSteps}
      </div>
    </div>
  );
}

// Sub-components (simplified)
function PersonalInfoStep({ t }: any) {
  return <div>Personal Info Form</div>;
}

function AddressStep({ t }: any) {
  return <div>Address Form</div>;
}

function ConfirmationStep({ t }: any) {
  return <div>Confirmation</div>;
}
```

---

## Example 8: Header with Language Support

```tsx
'use client';

import { useTranslation } from './i18n';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Header() {
  const { t } = useTranslation();

  return (
    <header className="header">
      <div className="container">
        <div className="logo-section">
          <h1>{t('common.appName')}</h1>
        </div>

        <nav className="navbar">
          <ul>
            <li><a href="/">{t('nav.home')}</a></li>
            <li><a href="/about">{t('nav.about')}</a></li>
            <li><a href="/services">{t('nav.services')}</a></li>
            <li><a href="/contact">{t('nav.contact')}</a></li>
          </ul>
        </nav>

        <div className="header-actions">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
```

---

## Example 9: Error Messages with Translations

```tsx
'use client';

import { useTranslation } from './i18n';

interface ErrorMessageProps {
  code: 'validation' | 'network' | 'notfound' | 'unauthorized';
}

export function ErrorMessage({ code }: ErrorMessageProps) {
  const { t } = useTranslation();

  const messages = {
    validation: t('errors.validation'),
    network: t('errors.network'),
    notfound: t('errors.notfound'),
    unauthorized: t('errors.unauthorized'),
  };

  return (
    <div className="error-banner">
      <span className="icon">⚠️</span>
      <span className="message">{messages[code]}</span>
    </div>
  );
}
```

---

## Example 10: Data Table with Localization

```tsx
'use client';

import { useTranslation } from './i18n';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface UserTableProps {
  users: User[];
}

export function UserTable({ users }: UserTableProps) {
  const { t } = useTranslation();

  return (
    <table className="user-table">
      <thead>
        <tr>
          <th>{t('table.columns.id')}</th>
          <th>{t('table.columns.name')}</th>
          <th>{t('table.columns.email')}</th>
          <th>{t('table.columns.role')}</th>
          <th>{t('table.columns.actions')}</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>
              <button>{t('table.actions.edit')}</button>
              <button>{t('table.actions.delete')}</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## Next Steps

- **[Advanced Guide](./i18n-advanced.md)** - Learn advanced patterns
- **[Best Practices](./i18n-best-practices.md)** - Follow industry standards
- **[API Reference](./i18n-api-reference.md)** - Detailed API docs
