import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import CounterDemo from '@site/src/components/CounterDemo';
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
          <p className={styles.heroSubtitle}>
            Lightweight React ecosystem: State management, server state, forms, and internationalization
          </p>
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
              href="https://github.com/DeveloperRejaul/zustic">
              View on GitHub ⭐
            </Link>
          </div>
          <div className={styles.librariesSection}>
            <div className={styles.libraryItem}>
              <span className={styles.libraryIcon}>⚛️</span>
              <span className={styles.libraryName}>State</span>
              <span className={styles.librarySize}>~500B</span>
            </div>
            <div className={styles.libraryItem}>
              <span className={styles.libraryIcon}>🌐</span>
              <span className={styles.libraryName}>Query</span>
              <span className={styles.librarySize}>~2KB</span>
            </div>
            <div className={styles.libraryItem}>
              <span className={styles.libraryIcon}>📝</span>
              <span className={styles.libraryName}>Forms</span>
              <span className={styles.librarySize}>~3KB</span>
            </div>
            <div className={styles.libraryItem}>
              <span className={styles.libraryIcon}>🌍</span>
              <span className={styles.libraryName}>i18n</span>
              <span className={styles.librarySize}>~2KB</span>
            </div>
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
      title={`${siteConfig.title} - Complete React Ecosystem`}
      description="Zustic is a complete lightweight React ecosystem with state management (~500B), server state queries (~2KB), form validation (~3KB), and internationalization (~2KB). TypeScript-first, zero dependencies, production-ready.">
      <HomepageHeader />
      <main>
        <CounterDemo />
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
