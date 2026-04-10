import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  icon: string;
  description: ReactNode;
  library: string;
  link: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'State Management',
    icon: '⚛️',
    library: 'zustic',
    link: '/docs/intro',
    description: (
      <>
        Ultra-lightweight core state management (~500B gzipped). Master with three functions: 
        <code>create()</code>, <code>set()</code>, <code>get()</code>. No boilerplate, 
        full TypeScript support, and optimized with <code>useSyncExternalStore</code>.
      </>
    ),
  },
  {
    title: 'Server State & Caching',
    icon: '🔄',
    library: 'zustic/query',
    link: '/docs/tutorial-extras/query-getting-started',
    description: (
      <>
        Intelligent data fetching with automatic caching, deduplication, and smart invalidation. 
        Auto-generated hooks, middleware pipelines, and plugin system for complete control 
        over your API layer.
      </>
    ),
  },
  {
    title: 'Form Validation',
    icon: '📝',
    library: 'zustic/hook-form',
    link: '/docs/tutorial-extras/hook-form-getting-started',
    description: (
      <>
        Type-safe form management with built-in validation. Supports Zod, Yup, and custom rules. 
        Zero boilerplate field state management with automatic error tracking and recovery (~3KB gzipped).
      </>
    ),
  },
  {
    title: 'Internationalization',
    icon: '🌍',
    library: 'zustic/i18n',
    link: '/docs/tutorial-extras/i18n-getting-started',
    description: (
      <>
        Multi-language support with type-safe translations and automatic locale switching. 
        Dot-notation keys, async loading, efficient state management, and seamless language transitions (~2KB gzipped).
      </>
    ),
  },
  {
    title: 'Middleware & Extensions',
    icon: '🔌',
    library: 'all libraries',
    link: '/docs/tutorial-extras/best-practices',
    description: (
      <>
        Extend functionality with logging, persistence, validation, and custom logic across all libraries. 
        Framework-agnostic middleware system that works everywhere React runs.
      </>
    ),
  },
  {
    title: 'Production Ready',
    icon: '🚀',
    library: 'ecosystem',
    link: '/docs/intro',
    description: (
      <>
        Battle-tested ecosystem with zero external dependencies. Fully typed, well-documented, 
        actively maintained, and optimized for performance. Perfect for any React application.
      </>
    ),
  },
];

function Feature({title, icon, description, library, link}: FeatureItem) {
  return (
    <Link to={link}>
      <div className={styles.whyCard}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>{icon}</div>
          <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
          <span className={styles.libraryBadge}>{library}</span>
          <p className={styles.featureDescription}>{description}</p>
        </div>
      </div>
    </Link>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <Heading as="h2" className={styles.featuresTitle}>
          Complete React Ecosystem
        </Heading>
        <p className={styles.featuresSubtitle}>
          Four lightweight, production-ready libraries for state management, data fetching, forms, and internationalization.
        </p>
        <div className={styles.whyGrid}>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
