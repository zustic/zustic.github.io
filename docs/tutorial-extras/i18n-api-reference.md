---
sidebar_position: 2
title: Api reference
description: Complete API reference for createI18n function, useTranslation hook, and type-safe TranslationKey with full TypeScript support.
keywords: [i18n API, createI18n, useTranslation, TranslationKey, API reference, TypeScript types]
---

# I18n API Reference

Complete API documentation for Zustic i18n library.

## `createI18n<T, L>(params)`

Creates an i18n hook for managing translations.

**Type Parameters:**
- `T` - Type of translation object (usually inferred from your translations)
- `L` - Language type (union of supported languages)

**Parameters:**

```typescript
interface I18nParams<T, L> {
  /**
   * Initial language to load
   * @example 'en'
   */
  initialLan: L;

  /**
   * Resource loader function
   * Can be async or sync, returns translation data
   * @example (lan) => fetch(`/translations/${lan}.json`)
   * @example (lan) => translations[lan]
   */
  resource: (lan: L) => Promise<T> | T;
}
```

**Returns:** A React hook `useTranslation()`

**Example:**

```typescript
import { createI18n } from 'zustic/i18n';

type Language = 'en' | 'es' | 'fr';

export const useTranslation = createI18n<TranslationType, Language>({
  initialLan: 'en',
  resource: async (lan) => {
    const response = await fetch(`/translations/${lan}.json`);
    return response.json();
  },
});
```

---

## `useTranslation()` Hook

The hook returned by `createI18n`. Use it in any React component.

### Return Type

```typescript
{
  /**
   * Translate function using dot notation keys
   * @example t('common.welcome')
   * @example t('pages.home.title')
   * @returns Translation string or fallback key
   */
  t: (key: TranslationKey<T>) => string;

  /**
   * Current active language
   * @example 'en'
   */
  lan: L;

  /**
   * Update active language and reload translations
   * @example updateTranslation('es')
   */
  updateTranslation: (lang: L) => void;

  /**
   * True while translations are loading for first time
   */
  isInitialLoading: boolean;

  /**
   * True while switching between languages
   */
  isUpdating: boolean;
}
```

### Examples

#### Basic Usage

```tsx
import { useTranslation } from './i18n';

export function App() {
  const { t, lan } = useTranslation();

  return <h1>{t('common.welcome')}</h1>;
}
```

#### With Loading States

```tsx
import { useTranslation } from './i18n';

export function App() {
  const { t, isInitialLoading, isUpdating } = useTranslation();

  if (isInitialLoading) {
    return <div>⏳ Loading translations...</div>;
  }

  return (
    <main>
      {isUpdating && <div className="loader">Switching language...</div>}
      <h1>{t('common.welcome')}</h1>
    </main>
  );
}
```

#### Language Switching

```tsx
import { useTranslation } from './i18n';

export function LanguageSwitcher() {
  const { lan, updateTranslation, isUpdating } = useTranslation();

  return (
    <select 
      value={lan} 
      onChange={(e) => updateTranslation(e.target.value as any)}
      disabled={isUpdating}
    >
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="fr">Français</option>
    </select>
  );
}
```

---

## `TranslationKey<T>`

Type-safe translation keys using dot notation.

### What It Does

Provides full TypeScript autocomplete for nested translation objects:

```typescript
// With this structure:
const translations = {
  common: { 
    welcome: 'Welcome',
    goodbye: 'Goodbye'
  },
  pages: { 
    home: { 
      title: 'Home',
      description: 'Welcome'
    } 
  },
};

// TranslationKey generates these valid keys:
type ValidKeys = TranslationKey<typeof translations>;

// Results in:
// 'common' 
// | 'common.welcome' 
// | 'common.goodbye'
// | 'pages' 
// | 'pages.home' 
// | 'pages.home.title'
// | 'pages.home.description'
```

### IDE Autocomplete

Your IDE will show intelligent suggestions:

```typescript
t('common.')      // Shows: welcome, goodbye
t('pages.')       // Shows: home
t('pages.home.')  // Shows: title, description
```

### Benefits

✅ **No typos** - TypeScript catches mistakes  
✅ **Auto-completion** - Your IDE helps you  
✅ **Refactoring safe** - Rename translations safely  
✅ **Documentation** - Keys are self-documenting  

---

## Type Definition Reference

### I18nParams

```typescript
interface I18nParams<T, L> {
  initialLan: L;
  resource: (lan: L) => Promise<T> | T;
}
```

### useTranslation Return

```typescript
interface TranslationHook<T, L> {
  t: (key: TranslationKey<T>) => string;
  lan: L;
  updateTranslation: (lang: L) => void;
  isInitialLoading: boolean;
  isUpdating: boolean;
}
```

### StoreState (Internal)

```typescript
interface StoreState<T, L> {
  lan: L;
  data: T | null;
  isInitialLoading: boolean;
  isUpdating: boolean;
}
```

---

## Function Signatures

### t() - Translate Function

```typescript
/**
 * Get translation for a key
 * @param key - Dot notation key (type-safe)
 * @returns Translated string or fallback key if not found
 */
t(key: TranslationKey<T>): string
```

### updateTranslation() - Language Switch

```typescript
/**
 * Switch to a different language
 * @param lang - Target language
 * @returns void (updates are reactive)
 */
updateTranslation(lang: L): void
```

---

## Common Patterns

### Static Translations

```typescript
export const useTranslation = createI18n({
  initialLan: 'en',
  resource: (lan) => translations[lan],  // Sync
});
```

### API-Based Translations

```typescript
export const useTranslation = createI18n({
  initialLan: 'en',
  resource: async (lan) => {
    const res = await fetch(`/api/translations/${lan}`);
    return res.json();  // Async
  },
});
```

### JSON File Import

```typescript
export const useTranslation = createI18n({
  initialLan: 'en',
  resource: async (lan) => {
    const module = await import(`./translations/${lan}.json`);
    return module.default;
  },
});
```

---

## Error Handling

### Missing Translation Keys

If a key doesn't exist, the function returns the key itself:

```typescript
const { t } = useTranslation();

// If 'invalid.key' doesn't exist:
console.log(t('invalid.key'));  // Output: 'invalid.key'
```

### Failed Resource Loading

Catch errors in the resource function:

```typescript
export const useTranslation = createI18n({
  initialLan: 'en',
  resource: async (lan) => {
    try {
      const res = await fetch(`/api/translations/${lan}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (error) {
      console.error(`Failed to load ${lan}:`, error);
      return {};  // Return empty translations
    }
  },
});
```

---

## Performance Characteristics

### Bundle Size
- **Minified**: ~1.8KB
- **Gzipped**: ~0.8KB

### Runtime Performance
- **Initial Load**: Depends on resource function
- **Language Switch**: `<50ms` (typically)
- **Translation Lookup**: O(1) - instant
- **Memory**: Minimal (~100 bytes per translation set)

### Optimization Tips

1. **Lazy load translations**
   ```typescript
   resource: async (lan) => {
     const module = await import(`./translations/${lan}.js`);
     return module.default;
   }
   ```

2. **Cache fetched translations**
   ```typescript
   const cache = new Map();
   resource: async (lan) => {
     if (cache.has(lan)) return cache.get(lan);
     const data = await fetch(`/api/i18n/${lan}`).then(r => r.json());
     cache.set(lan, data);
     return data;
   }
   ```

3. **Preload common languages**
   ```typescript
   // In your app initialization
   await fetch('/api/translations/en');
   await fetch('/api/translations/es');
   ```

---

## TypeScript Tips

### Infer Translation Type

```typescript
// Let TypeScript infer the type
const translations = {
  en: { hello: 'Hello', bye: 'Goodbye' },
  es: { hello: 'Hola', bye: 'Adiós' },
};

export const useTranslation = createI18n({
  initialLan: 'en',
  resource: (lan) => translations[lan],
  // Type is automatically: typeof translations.en
});
```

### Explicit Type Annotation

```typescript
interface Translations {
  common: {
    welcome: string;
    goodbye: string;
  };
  pages: {
    home: {
      title: string;
      description: string;
    };
  };
}

type Language = 'en' | 'es' | 'fr';

export const useTranslation = createI18n<Translations, Language>({
  initialLan: 'en',
  resource: async (lan) => {
    // Explicitly typed
    const response = await fetch(`/translations/${lan}.json`);
    return response.json() as Translations;
  },
});
```

### Generic Component

```typescript
interface LocalizedProps<T> {
  translationKey: TranslationKey<T>;
}

export function LocalizedText<T>({ translationKey }: LocalizedProps<T>) {
  const { t } = useTranslation();
  return <span>{t(translationKey)}</span>;
}
```

---

## Next Steps

- **[Examples](./i18n-examples.md)** - See practical implementations
- **[Advanced Guide](./i18n-advanced.md)** - Learn advanced patterns
- **[Best Practices](./i18n-best-practices.md)** - Follow best practices
