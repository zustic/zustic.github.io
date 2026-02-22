import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import CounterDemo from '@site/src/components/CounterDemo';
import QueryDemo from '@site/src/components/QueryDemo';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <div className={styles.heroContent}>
          <Heading as="h1" className={styles.heroTitle}>
            {siteConfig.title}
          </Heading>
          <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className={clsx('button', styles.buttonPrimary)}
              to="/docs/intro">
              Get Started
            </Link>
            <Link
              target="_blank"
              rel="noopener noreferrer"
              className={clsx('button', styles.buttonSecondary)}
              to="/query-builder">
              Build Queries Live →
            </Link>
          </div>
          <div className={styles.trustSection}>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>✓</span>
              <span>Production Ready</span>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>✓</span>
              <span>TypeScript First</span>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>✓</span>
              <span>Zero Dependencies</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - Lightweight State Management & Query Library for React`}
      description="Zustic is a lightweight state management & query library for React. Only ~500B gzipped, zero dependencies, TypeScript-first, and production-ready. Perfect for building modern React applications with minimal overhead.">
      <HomepageHeader />
      <main>
        <CounterDemo />
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
