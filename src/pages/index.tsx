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
          <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className={clsx('button', styles.buttonPrimary)}
              to="/docs/intro">
              Get Started - 5 min ⏱️
            </Link>
            <Link
              className={clsx('button', styles.buttonSecondary)}
              to="https://github.com/DeveloperRejaul/zustic">
              View on GitHub 🔗
            </Link>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statValue}>~500B</div>
              <div className={styles.statLabel}>Bundle Size</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>⚡ Zero</div>
              <div className={styles.statLabel}>Dependencies</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>🚀 Production</div>
              <div className={styles.statLabel}>Ready</div>
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
      title={`${siteConfig.title} - Lightweight State Management for React`}
      description="Zustic is a lightweight, minimal state management library for React. Only ~500B gzipped with zero dependencies.">
      <HomepageHeader />
      <main>
        <CounterDemo />
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
