---
sidebar_position: 1
title: Getting started
description: Learn how to set up and use Zustic i18n for multi-language React applications with type-safe translations and automatic language switching.
keywords: [i18n, internationalization, translations, localization, React, TypeScript, Zustic]
---

# I18n - Getting Started

Build multi-language applications with Zustic's lightweight i18n library. Perfect for supporting multiple languages with automatic locale switching and efficient state management.

## Overview

The Zustic i18n library provides a simple yet powerful solution for managing translations in your React applications:

- **Lightweight** - Only what you need, nothing extra (~2KB gzipped)
- **Type-Safe** - Full TypeScript support with dot-notation key validation
- **Async Support** - Load translations dynamically or statically
- **React Hooks** - Built on top of Zustic core for efficient state management
- **Auto-Switching** - Seamlessly switch languages with automatic re-renders
- **Loading States** - Handle initial load and language switching states

## Installation

```bash
npm install zustic
```

## Quick Start

### Step 1: Define Translation Structure

```typescript
// translations.ts
export const en = {
  common: {
    welcome: 'Welcome',
    goodbye: 'Goodbye',
    appName: 'My App',
  },
  pages: {
    home: {
      title: 'Home',
      description: 'Welcome to our home page',
    },
    about: {
      title: 'About Us',
      description: 'Learn more about our company',
    },
  },
};

export const es = {
  common: {
    welcome: 'Bienvenido',
    goodbye: 'Adiós',
    appName: 'Mi Aplicación',
  },
  pages: {
    home: {
      title: 'Inicio',
      description: 'Bienvenido a nuestra página de inicio',
    },
    about: {
      title: 'Acerca de',
      description: 'Conozca más sobre nuestra empresa',
    },
  },
};

export const fr = {
  common: {
    welcome: 'Bienvenue',
    goodbye: 'Au revoir',
    appName: 'Mon Application',
  },
  pages: {
    home: {
      title: 'Accueil',
      description: 'Bienvenue sur notre page d\'accueil',
    },
    about: {
      title: 'À propos',
      description: 'En savoir plus sur notre entreprise',
    },
  },
};
```

### Step 2: Create i18n Instance

```typescript
// i18n.ts
import { createI18n } from 'zustic/i18n';
import { en, es, fr } from './translations';

type Language = 'en' | 'es' | 'fr';

const translations = {
  en,
  es,
  fr,
};

export const useTranslation = createI18n<typeof en, Language>({
  initialLan: 'en',
  resource: (lan) => Promise.resolve(translations[lan]),
});
```

### Step 3: Use in Components

```tsx
'use client';

import { useTranslation } from './i18n';

export function Header() {
  const { t, lan, updateTranslation, isInitialLoading } = useTranslation();

  if (isInitialLoading) {
    return <div>Loading translations...</div>;
  }

  return (
    <header>
      <h1>{t('common.appName')}</h1>
      <p>{t('common.welcome')}</p>

      <select 
        value={lan} 
        onChange={(e) => updateTranslation(e.target.value as any)}
      >
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>
    </header>
  );
}
```

## What You Get

After setup, you'll have:

✅ **Type-safe translations** - Full TypeScript support  
✅ **Easy language switching** - One function call  
✅ **Loading states** - Handle initial load and transitions  
✅ **Nested keys** - Organized translation structure  
✅ **Minimal setup** - Get started in minutes  

## Next Steps

- **[API Reference](./i18n-api-reference.md)** - Learn the full API
- **[Examples](./i18n-examples.md)** - See practical use cases
- **[Advanced Guide](./i18n-advanced.md)** - Master advanced patterns
- **[Best Practices](./i18n-best-practices.md)** - Follow industry standards
