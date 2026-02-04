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
    title: 'Lightning Fast',
    icon: '⚡',
    description: (
      <>
        Only ~500B gzipped with zero dependencies. Smaller than any other state 
        management library. Perfect for performance-critical applications.
      </>
    ),
  },
  {
    title: 'Simple to Learn',
    icon: '🎯',
    description: (
      <>
        Master the entire API in minutes. Just <code>create()</code>, <code>set()</code>, 
        and <code>get()</code>. No complex patterns, no boilerplate required.
      </>
    ),
  },
  {
    title: 'Type Safe',
    icon: '💾',
    description: (
      <>
        First-class TypeScript support with automatic type inference. Write type-safe 
        code with full IDE autocomplete and zero configuration.
      </>
    ),
  },
  {
    title: 'Multi-Platform',
    icon: '📱',
    description: (
      <>
        Works seamlessly across React, React Native, Next.js, and more. One API for 
        all your state management needs across platforms.
      </>
    ),
  },
  {
    title: 'Extensible',
    icon: '🧩',
    description: (
      <>
        Built-in middleware system for logging, persistence, validation, and custom 
        logic. Extend without modifying your store code.
      </>
    ),
  },
  {
    title: 'Production Ready',
    icon: '🚀',
    description: (
      <>
        Optimized for performance with <code>useSyncExternalStore</code>. Used in 
        real applications - fully tested and battle-hardened.
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
         <Heading as="h3" className={styles.featuresTitle}>
            What zustic provide
          </Heading>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
