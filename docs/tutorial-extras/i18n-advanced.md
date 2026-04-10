---
sidebar_position: 4
title: Advanced
description: Advanced i18n patterns including state management, request de-duplication, Context Provider, performance optimization, SSR, and debugging techniques.
keywords: [i18n advanced, state management, performance, SSR, Context Provider, debugging, pluralization, localization]
---

# I18n Advanced Guide

Master advanced patterns and techniques for the Zustic i18n library.

## State Management

The i18n system uses Zustic core for state management. Understand the internal states:

### States Overview

```typescript
{
  // Current language
  lan: 'en' | 'es' | 'fr';

  // Translation data
  data: TranslationObject | null;

  // Loading states
  isInitialLoading: boolean;  // First load
  isUpdating: boolean;        // Language switch
}
```

### State Flow Diagram

```
┌─────────────────────────────────────────────┐
│         Initial App Load                    │
│  isInitialLoading = true                    │
│  data = null                                │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│    Load initialLan Translations             │
│    Fetch/Load resource(initialLan)          │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│      Data Loaded Successfully               │
│  isInitialLoading = false                   │
│  data = { ... translations ... }            │
└─────────────────────────────────────────────┘
               │
               │ updateTranslation('es')
               ▼
┌─────────────────────────────────────────────┐
│    Language Switch in Progress              │
│  isUpdating = true                          │
│  lan = 'es' (updated)                       │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│    New Language Translations Loaded         │
│  isUpdating = false                         │
│  data = { ... new translations ... }        │
└─────────────────────────────────────────────┘
```

---

## Request De-duplication

The library automatically handles concurrent requests using request IDs:

```typescript
// Multiple rapid language changes
updateTranslation('es');  // Request ID: 1
updateTranslation('fr');  // Request ID: 2
updateTranslation('de');  // Request ID: 3

// Only the last one (ID: 3) will update state
// Previous requests are ignored if they complete after
```

This prevents race conditions where slower requests overwrite faster ones:

```typescript
// Example: Slow 'es' fetch vs fast 'fr' fetch
updateTranslation('es');  // Takes 2 seconds
updateTranslation('fr');  // Takes 100ms

// Even if 'es' finishes after 'fr', 'fr' wins
// The result will be French translations
```

---

## Context Provider Pattern

Share translations across your app without prop drilling:

```tsx
// TranslationProvider.tsx
'use client';

import { ReactNode, createContext, useContext } from 'react';
import { useTranslation } from './i18n';

type TranslationContextType = ReturnType<typeof useTranslation>;

const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const translation = useTranslation();

  return (
    <TranslationContext.Provider value={translation}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslationContext() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslationContext must be used within TranslationProvider');
  }
  return context;
}

// Usage in app.tsx
'use client';

import { TranslationProvider } from './TranslationProvider';
import { Layout } from './Layout';

export default function App() {
  return (
    <TranslationProvider>
      <Layout />
    </TranslationProvider>
  );
}

// In any component
export function Header() {
  const { t } = useTranslationContext();
  return <h1>{t('common.welcome')}</h1>;
}
```

---

## Type-Safe Keys

Full TypeScript support ensures you never use wrong translation keys:

```typescript
// ✅ Correct - IDE shows autocomplete
t('common.welcome')

// ❌ Error - TypeScript catches this
t('invalid.key')  // Type error!

// ✅ Full nested key support
t('pages.home.title')
t('ui.forms.email.label')
```

### Generic Component with Type Safety

```tsx
interface LocalizedTextProps<T> {
  keyPath: TranslationKey<T>;
  className?: string;
}

export function LocalizedText<T>({ keyPath, className }: LocalizedTextProps<T>) {
  const { t } = useTranslation();
  
  return (
    <span className={className}>
      {t(keyPath)}
    </span>
  );
}

// Usage - fully type-safe
<LocalizedText keyPath="common.welcome" />
```

---

## Performance Optimization

### 1. Lazy Load Translations

```typescript
export const useTranslation = createI18n({
  initialLan: 'en',
  resource: async (lan) => {
    // Only load when needed
    const module = await import(`./translations/${lan}.js`);
    return module.default;
  },
});
```

### 2. Cache Fetched Translations

```typescript
const cache = new Map<string, any>();

export const useTranslation = createI18n({
  initialLan: 'en',
  resource: async (lan) => {
    // Return cached if available
    if (cache.has(lan)) {
      return cache.get(lan);
    }
    
    // Fetch and cache
    const response = await fetch(`/api/translations/${lan}`);
    const data = await response.json();
    cache.set(lan, data);
    return data;
  },
});
```

### 3. Preload Common Languages

```typescript
// In your app initialization
async function preloadTranslations() {
  // Preload top 3 languages
  await Promise.all([
    fetch('/api/translations/en'),
    fetch('/api/translations/es'),
    fetch('/api/translations/fr'),
  ]);
}

// Call in app startup
preloadTranslations().catch(console.error);
```

### 4. Memoize Components

```tsx
import { memo } from 'react';

const LanguageSwitcher = memo(function LanguageSwitcher() {
  const { lan, updateTranslation, isUpdating } = useTranslation();
  
  return (
    <select 
      value={lan} 
      onChange={(e) => updateTranslation(e.target.value)}
      disabled={isUpdating}
    >
      {/* Options */}
    </select>
  );
});

export default LanguageSwitcher;
```

---

## SEO-Friendly URL Routes

Implement language in URL path:

```tsx
// app/[lang]/page.tsx
'use client';

import { useTranslation } from '@/i18n';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: {
    lang: string;
  };
}

export default function Page({ params }: PageProps) {
  const { lan, updateTranslation, t } = useTranslation();
  const router = useRouter();

  const handleLanguageChange = (newLan: string) => {
    updateTranslation(newLan as any);
    // Update URL
    router.push(`/${newLan}`);
    // Update meta
    document.documentElement.lang = newLan;
  };

  return (
    <main>
      <h1>{t('pages.home.title')}</h1>
      
      <select value={lan} onChange={(e) => handleLanguageChange(e.target.value)}>
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>
    </main>
  );
}
```

---

## Error Handling & Fallbacks

### Graceful Error Handling

```tsx
'use client';

import { useTranslation } from './i18n';
import { useState, useEffect } from 'react';

export function App() {
  const { t, isInitialLoading, lan } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Monitor loading state
    if (isInitialLoading) {
      // Set timeout for failed loads
      const timer = setTimeout(() => {
        setError('Failed to load translations');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isInitialLoading]);

  if (error) {
    return (
      <div className="error-screen">
        <h1>⚠️ Error</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (isInitialLoading) {
    return <div className="loading">⏳ Loading...</div>;
  }

  return <main>{/* Your app */}</main>;
}
```

### Fallback Translations

```typescript
const fallbackTranslations = {
  en: { 
    common: { welcome: 'Welcome' },
  },
};

export const useTranslation = createI18n({
  initialLan: 'en',
  resource: async (lan) => {
    try {
      const response = await fetch(`/api/translations/${lan}`);
      if (!response.ok) throw new Error('Failed to load');
      return response.json();
    } catch (error) {
      console.error(`Failed to load ${lan}, using fallback`);
      // Return fallback
      return fallbackTranslations[lan] || fallbackTranslations.en;
    }
  },
});
```

---

## Debugging Translations

### Log Missing Translations

```typescript
// i18n.ts
function createDebugI18n<T, L>(params: I18nParams<T, L>) {
  const hook = createI18n(params);
  
  return () => {
    const result = hook();
    const originalT = result.t;
    
    // Wrap translation function
    result.t = (key: any) => {
      const translation = originalT(key);
      
      // If key equals translation, it's missing
      if (translation === key) {
        console.warn(`Missing translation: ${key}`);
      }
      
      return translation;
    };
    
    return result;
  };
}

// Usage
export const useTranslation = createDebugI18n({
  initialLan: 'en',
  resource: (lan) => translations[lan],
});
```

### Translation Coverage Report

```typescript
export function reportTranslationCoverage(translations: any, language: string) {
  const flatKeys: string[] = [];
  
  function flatten(obj: any, prefix = '') {
    for (const key in obj) {
      const value = obj[key];
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        flatten(value, fullKey);
      } else {
        flatKeys.push(fullKey);
      }
    }
  }
  
  flatten(translations);
  
  console.log(`${language}: ${flatKeys.length} translations`);
  return flatKeys;
}

// Usage
const enKeys = reportTranslationCoverage(translations.en, 'English');
const esKeys = reportTranslationCoverage(translations.es, 'Spanish');
const missing = enKeys.filter(key => !esKeys.includes(key));

if (missing.length > 0) {
  console.warn('Missing Spanish translations:', missing);
}
```

---

## Advanced Patterns

### Dynamic Language Based on Locale

```typescript
// Get user's preferred language from browser
function getBrowserLanguage(): Language {
  const lang = navigator.language.split('-')[0];
  const supported: Language[] = ['en', 'es', 'fr'];
  
  if (supported.includes(lang as Language)) {
    return lang as Language;
  }
  
  return 'en';  // Default fallback
}

export const useTranslation = createI18n({
  initialLan: getBrowserLanguage(),
  resource: (lan) => translations[lan],
});
```

### Pluralization Support

```typescript
// translations.ts
export const en = {
  items: {
    singular: '{count} item',
    plural: '{count} items',
  },
};

// Helper function
function pluralize(key: string, count: number): string {
  const { t } = useTranslation();
  const isPlural = count !== 1;
  const translationKey = isPlural ? `${key}.plural` : `${key}.singular`;
  
  return t(translationKey as any).replace('{count}', String(count));
}

// Usage
<p>{pluralize('items', 5)}</p>  // "5 items"
<p>{pluralize('items', 1)}</p>  // "1 item"
```

### Number & Date Localization

```typescript
export function useLocalization() {
  const { lan } = useTranslation();
  
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(lan).format(num);
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(lan).format(date);
  };
  
  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat(lan, {
      style: 'currency',
      currency,
    }).format(amount);
  };
  
  return { formatNumber, formatDate, formatCurrency };
}

// Usage
function Product({ price }: { price: number }) {
  const { formatCurrency } = useLocalization();
  return <span>{formatCurrency(price)}</span>;
}
```

---

## Server-Side Rendering (SSR)

### Next.js SSR Example

```typescript
// i18n.ts
import { createI18n } from 'zustic/i18n';

type Language = 'en' | 'es' | 'fr';

export const useTranslation = createI18n<any, Language>({
  initialLan: 'en',
  resource: async (lan) => {
    // On server: import directly
    if (typeof window === 'undefined') {
      const translations = await import(`./translations/${lan}.json`);
      return translations.default;
    }
    
    // On client: fetch
    const response = await fetch(`/api/translations/${lan}`);
    return response.json();
  },
});

// page.tsx - Server Component
import { useTranslation } from '@/i18n';

export async function generateMetadata() {
  const { t } = useTranslation();
  
  return {
    title: t('pages.home.title'),
    description: t('pages.home.description'),
  };
}

export default function Page() {
  const { t } = useTranslation();
  
  return (
    <>
      <h1>{t('pages.home.title')}</h1>
      <p>{t('pages.home.description')}</p>
    </>
  );
}
```

---

## Performance Metrics

### Bundle Size
- **Minified**: ~1.8KB
- **Gzipped**: ~0.8KB

### Runtime Performance
- **Initial Load**: Depends on resource function (typically 50-500ms)
- **Language Switch**: `<50ms`
- **Translation Lookup**: O(1) - instant
- **Memory**: ~100 bytes per translation set

---

## Next Steps

- **[Best Practices](./i18n-best-practices.md)** - Learn dos and don'ts
- **[Examples](./i18n-examples.md)** - See more real-world use cases
- **[API Reference](./i18n-api-reference.md)** - Detailed API documentation
