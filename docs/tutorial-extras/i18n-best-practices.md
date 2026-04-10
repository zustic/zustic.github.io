---
sidebar_position: 5
title: Best practices
description: Follow i18n best practices including proper key organization, loading state handling, language persistence, and production-ready patterns.
keywords: [i18n best practices, translations, TypeScript, React patterns, troubleshooting, testing, production checklist]
---

# I18n Best Practices

Follow these best practices to build scalable, maintainable multi-language applications.

## Do's ✅

### 1. Use Dot Notation Keys

```typescript
// ✅ Good - organized and nested
t('common.welcome')
t('pages.home.title')
t('ui.forms.email.label')

// ❌ Avoid - flat structure gets messy
t('welcome')
t('homeTitle')
t('emailLabel')
```

### 2. Type Your Language Enum

```typescript
// ✅ Good - explicit type prevents typos
type Language = 'en' | 'es' | 'fr' | 'de';

// ❌ Avoid - string types allow any value
export const useTranslation = createI18n<any, string>({
  // ...
});
```

### 3. Handle Loading States

```typescript
// ✅ Good - check before rendering
const { t, isInitialLoading } = useTranslation();

if (isInitialLoading) {
  return <LoadingSpinner />;
}

return <h1>{t('common.welcome')}</h1>;

// ❌ Avoid - showing raw keys on load
<h1>{t('common.welcome')}</h1>  // May show "common.welcome"
```

### 4. Persist Language Preference

```typescript
// ✅ Good - remember user choice
const handleLanguageChange = (newLan: Language) => {
  updateTranslation(newLan);
  localStorage.setItem('preferred-language', newLan);
};

// ❌ Avoid - reset on every page load
updateTranslation(browserLanguage);  // User choice lost
```

### 5. Organize by Feature

```typescript
// ✅ Good - grouped by feature
{
  pages: {
    home: { title: '...', description: '...' },
    about: { title: '...', description: '...' },
  },
  ui: {
    buttons: { save: '...', cancel: '...' },
    forms: { email: { label: '...', error: '...' } },
  },
}

// ❌ Avoid - flat unorganized structure
{
  homePage: '...',
  aboutPage: '...',
  homeDescription: '...',
  saveButton: '...',
  cancelButton: '...',
}
```

### 6. Keep Translations in Sync

```typescript
// ✅ Good - all languages have same keys
export const en = { common: { welcome: 'Welcome' } };
export const es = { common: { welcome: 'Bienvenido' } };
export const fr = { common: { welcome: 'Bienvenue' } };

// ❌ Avoid - missing keys in some languages
export const en = { common: { welcome: 'Welcome', bye: 'Goodbye' } };
export const es = { common: { welcome: 'Bienvenido' } };  // bye is missing!
```

### 7. Use Loading State in UI

```typescript
// ✅ Good - disable during language switch
const { isUpdating } = useTranslation();

<select disabled={isUpdating}>
  {/* Options */}
</select>

// ❌ Avoid - allow interaction during load
<select>
  {/* Options */}
</select>
```

### 8. Catch Resource Errors

```typescript
// ✅ Good - handle fetch errors
resource: async (lan) => {
  try {
    const res = await fetch(`/translations/${lan}.json`);
    if (!res.ok) throw new Error('Failed to load');
    return res.json();
  } catch (error) {
    console.error(`Failed to load ${lan}:`, error);
    return defaultTranslations[lan];
  }
}

// ❌ Avoid - let errors propagate
resource: async (lan) => {
  const res = await fetch(`/translations/${lan}.json`);
  return res.json();  // Will crash on error
}
```

---

## Don'ts ❌

### 1. Don't Use Dynamic Keys

```typescript
// ❌ Bad - loses type safety
const key = 'common.' + userInput;
t(key);  // No autocomplete!

// ✅ Good - static keys with type checking
t('common.welcome');
```

### 2. Don't Forget Initial Loading State

```typescript
// ❌ Bad - data might be null
const { data } = useTranslation();
console.log(data.common.welcome);  // May crash!

// ✅ Good - check loading state first
const { t, isInitialLoading } = useTranslation();
if (isInitialLoading) return null;
console.log(t('common.welcome'));  // Safe
```

### 3. Don't Ignore `isUpdating` State

```typescript
// ❌ Bad - user can click during load
<button onClick={switchLanguage}>
  Switch Language
</button>

// ✅ Good - disable during update
const { isUpdating } = useTranslation();
<button disabled={isUpdating} onClick={switchLanguage}>
  Switch Language
</button>
```

### 4. Don't Store Translations in Component State

```typescript
// ❌ Bad - duplicates state
const { t } = useTranslation();
const [cachedTranslations, setCached] = useState(t);

// ✅ Good - use hook directly
const { t } = useTranslation();
// Use t directly, no caching needed
```

### 5. Don't Mix Multiple i18n Instances

```typescript
// ❌ Bad - confusing and wasteful
const useTranslation1 = createI18n({...});
const useTranslation2 = createI18n({...});

// ✅ Good - single instance per app
export const useTranslation = createI18n({...});
// Use everywhere
```

### 6. Don't Leave Keys Untranslated

```typescript
// ❌ Bad - missing Spanish translations
export const es = {
  common: {
    welcome: 'Bienvenido',
    // goodbye is missing!
  },
};

// ✅ Good - complete translations
export const es = {
  common: {
    welcome: 'Bienvenido',
    goodbye: 'Adiós',
  },
};
```

### 7. Don't Hardcode Language Selection

```typescript
// ❌ Bad - user preference ignored
<select value="en" disabled>
  <option>English</option>
</select>

// ✅ Good - allow user to switch
const { lan, updateTranslation } = useTranslation();
<select value={lan} onChange={(e) => updateTranslation(e.target.value)}>
  <option value="en">English</option>
  <option value="es">Español</option>
</select>
```

### 8. Don't Trust Untranslated Content

```typescript
// ❌ Bad - translation might be missing
<h1>{t('pages.unknownPage.title') || 'Default Title'}</h1>

// ✅ Good - ensure key exists at build time
<h1>{t('pages.home.title')}</h1>  // TypeScript validates
```

---

## Common Patterns

### Pattern 1: Context-Based Translations

Use Context to avoid prop drilling:

```tsx
import { createContext, useContext } from 'react';
import { useTranslation } from './i18n';

const I18nContext = createContext<ReturnType<typeof useTranslation> | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const translation = useTranslation();
  return (
    <I18nContext.Provider value={translation}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
```

### Pattern 2: SEO-Friendly Routes

```tsx
// Implement language in URL path for better SEO
// /en/about, /es/about, /fr/about

export default function Layout({ params }: { params: { lang: string } }) {
  return (
    <html lang={params.lang}>
      <body>{/* content */}</body>
    </html>
  );
}
```

### Pattern 3: Memoized Switcher

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

### Pattern 4: Cached Loading

```typescript
const translationCache = new Map<string, any>();

export const useTranslation = createI18n({
  initialLan: 'en',
  resource: async (lan) => {
    if (translationCache.has(lan)) {
      return translationCache.get(lan);
    }
    
    const data = await fetch(`/api/i18n/${lan}`).then(r => r.json());
    translationCache.set(lan, data);
    return data;
  },
});
```

---

## Testing

### Unit Test Example

```typescript
import { createI18n } from 'zustic/i18n';

describe('i18n', () => {
  const mockTranslations = {
    en: { greeting: 'Hello' },
    es: { greeting: 'Hola' },
  };

  const useTestTranslation = createI18n({
    initialLan: 'en',
    resource: (lan) => mockTranslations[lan],
  });

  test('returns correct translation', async () => {
    const { t } = useTestTranslation();
    expect(t('greeting')).toBe('Hello');
  });

  test('switches language', async () => {
    const { t, updateTranslation } = useTestTranslation();
    
    updateTranslation('es');
    // Wait for update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(t('greeting')).toBe('Hola');
  });
});
```

### React Component Test

```typescript
import { render, screen } from '@testing-library/react';
import { TranslationProvider } from './TranslationProvider';
import { Header } from './Header';

test('renders translated header', () => {
  render(
    <TranslationProvider>
      <Header />
    </TranslationProvider>
  );

  expect(screen.getByText('Welcome')).toBeInTheDocument();
});
```

---

## Comparison: i18n vs Alternatives

| Feature | Zustic i18n | i18next | react-i18next |
|---------|-----------|---------|---------------|
| **Size** | ~2KB | ~30KB | ~8KB |
| **Type Safety** | ✅ Full | ⚠️ Partial | ⚠️ Partial |
| **Setup** | ⭐ Very Simple | ⭐⭐⭐⭐ Complex | ⭐⭐⭐ Medium |
| **Learning** | ⭐ Easy | ⭐⭐⭐⭐ Steep | ⭐⭐⭐ Medium |
| **Bundle** | ⭐⭐⭐⭐⭐ Tiny | ⭐⭐ Large | ⭐⭐⭐ Medium |
| **Async** | ✅ Yes | ✅ Yes | ✅ Yes |
| **React** | ✅ Native | ⚠️ Via Plugin | ✅ Native |

---

## Troubleshooting

### Issue: Keys showing raw instead of translations

**Problem:** Seeing "common.welcome" instead of the actual translation

**Solution:** Wait for `isInitialLoading` to be false:

```tsx
const { t, isInitialLoading } = useTranslation();

if (isInitialLoading) return <Spinner />;

return <h1>{t('common.welcome')}</h1>;  // Now safe
```

---

### Issue: Language not switching

**Problem:** `updateTranslation` doesn't change language

**Solution:** Ensure language type matches:

```tsx
type Language = 'en' | 'es' | 'fr';

// ✅ Correct casting
updateTranslation(e.target.value as Language);

// ❌ Wrong - type mismatch
updateTranslation(e.target.value);
```

---

### Issue: Slow translation loading

**Problem:** First language load takes too long

**Solution:** Implement caching:

```typescript
const cache = new Map();

resource: async (lan) => {
  if (cache.has(lan)) return cache.get(lan);
  
  const data = await fetch(`/api/translations/${lan}`).then(r => r.json());
  cache.set(lan, data);
  return data;
}
```

---

### Issue: Race condition on language switch

**Problem:** Switching languages rapidly causes stale translations

**Solution:** The library handles this with request IDs:

```typescript
// This is automatic - last request wins
updateTranslation('es');
updateTranslation('fr');
updateTranslation('de');

// Result will be German, even if Spanish finishes last
```

---

## Checklist Before Production

- ✅ All translation keys are type-safe
- ✅ Loading states are handled
- ✅ Language preferences are persisted
- ✅ All languages have complete translations
- ✅ Error handling is in place
- ✅ Performance is optimized (caching, lazy loading)
- ✅ Component tests pass
- ✅ i18n works in SSR if applicable
- ✅ Metadata/SEO is translated
- ✅ RTL languages are supported (if needed)

---

## Next Steps

- **[Examples](./i18n-examples.md)** - See practical use cases
- **[Advanced Guide](./i18n-advanced.md)** - Master advanced patterns
- **[API Reference](./i18n-api-reference.md)** - Detailed documentation
