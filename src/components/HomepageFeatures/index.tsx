import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  icon: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Ultra Lightweight',
    icon: '⚡',
    description: (
      <>
        Only ~500B gzipped - 10x smaller than Redux. Smaller than a single HTTP request. 
        Zero dependencies means no bloat, faster downloads, and minimal impact on your bundle size.
      </>
    ),
  },
  {
    title: 'Simple API',
    icon: '🎯',
    description: (
      <>
        Three functions to master: <code>create()</code>, <code>set()</code>, <code>get()</code>. 
        No complex patterns, no boilerplate. Learn in minutes, not days.
      </>
    ),
  },
  {
    title: 'TypeScript Native',
    icon: '💾',
    description: (
      <>
        Full TypeScript support with automatic type inference. Perfect autocomplete, 
        zero configuration. Works perfectly with React's hooks.
      </>
    ),
  },
  {
    title: 'Data Fetching Built-in',
    icon: '�',
    description: (
      <>
        Query system with automatic caching, mutation support, and smart cache invalidation. 
        Handle both state and data fetching with one library.
      </>
    ),
  },
  {
    title: 'Extensible & Flexible',
    icon: '🧩',
    description: (
      <>
        Middleware support for logging, persistence, validation, and custom logic. 
        Extend without modifying store code. Works everywhere React runs.
      </>
    ),
  },
  {
    title: 'Battle-Tested',
    icon: '🚀',
    description: (
      <>
        Used in production applications. Optimized with <code>useSyncExternalStore</code>. 
        Fully tested, documented, and actively maintained.
      </>
    ),
  },
];

function Feature({title, icon, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4', styles.featureCol)}>
      <div className={styles.featureCard}>
        <div className={styles.featureIcon}>{icon}</div>
        <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
        <p className={styles.featureDescription}>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <Heading as="h2" className={styles.featuresTitle}>
          Why Choose Zustic?
        </Heading>
        <p className={styles.featuresSubtitle}>
          The best choice for React developers who want simplicity, performance, and elegance.
        </p>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
