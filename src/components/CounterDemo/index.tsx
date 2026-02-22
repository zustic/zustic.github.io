import { useState } from 'react';
import styles from './styles.module.css';
import Heading from '@theme/Heading';
import {themes ,Highlight}from 'prism-react-renderer';
import { useColorMode } from '@docusaurus/theme-common';
import QueryDemo from '@site/src/components/QueryDemo';

export default function CounterDemo() {
  const [count, setCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(0);
  const colorMode = useColorMode()

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const code = `// store.ts
import { create } from 'zustic';

type CounterStore = {
  count: number;
  inc: () => void;
  dec: () => void;
  reset: () => void;
};

export const useCounter = create<CounterStore>((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
  dec: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));`;



  return (
    <section className={styles.demoSection}>
      <div className="container">
        {/* Two Cards Grid */}
        <div className={styles.cardsGrid}>
          {/* State Management Card */}
          <div className={styles.demoCard}>
            <div className={styles.cardHeader}>
              <div className={styles.countValue}>{count}</div>
              <div className={styles.buttonGroup}>
                <button className={`${styles.btn} ${styles.btnDecrement}`} onClick={decrement}>
                  ➖
                </button>
                <button className={`${styles.btn} ${styles.btnReset}`} onClick={reset}>
                  ⟲
                </button>
                <button className={`${styles.btn} ${styles.btnIncrement}`} onClick={increment}>
                  ➕
                </button>
              </div>
            </div>

            {/* Code Section */}
            <div className={styles.codeSection}>
              <div className={styles.codeSectionHeader}>
                <div className={styles.sectionLabel}>Code</div>
                <button
                  className={`${styles.copyButton} ${copied ? styles.copyButtonCopied : ''}`}
                  onClick={copyToClipboard}
                  title="Copy code"
                >
                  {copied ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <Highlight 
                theme={colorMode.colorMode === 'dark' ? themes.dracula : themes.github}
                code={code} 
                language="ts"
              >
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre className={`${className} ${styles.codeBlock}`} style={style}>
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line, key: i })}>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token, key })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            </div>
          </div>

          {/* Query Demo Card */}
          <QueryDemo />
        </div>

        {/* Why Zustic Section */}
        <div className={`${styles.whySection}`}>
          <Heading as="h3" className={styles.whyTitle}>
            Why Zustic is Simple
          </Heading>
          
          <div className={styles.whyGrid}>
            <div className={styles.whyCard}>
              <div className={styles.whyIcon}>🎯</div>
              <h4>One Function</h4>
              <p>Just use <code>create()</code> - that's all you need to start managing state</p>
            </div>

            <div className={styles.whyCard}>
              <div className={styles.whyIcon}>⚡</div>
              <h4>Minimal API</h4>
              <p><code>set()</code> to update, <code>get()</code> to read - no complex patterns</p>
            </div>

            <div className={styles.whyCard}>
              <div className={styles.whyIcon}>🪶</div>
              <h4>Tiny Bundle</h4>
              <p>Only ~500B (gzipped) - lighter than Redux, Zustand, and MobX combined</p>
            </div>

            <div className={styles.whyCard}>
              <div className={styles.whyIcon}>🚀</div>
              <h4>Production Ready</h4>
              <p>Used in real applications - fully tested and optimized for performance</p>
            </div>

            <div className={styles.whyCard}>
              <div className={styles.whyIcon}>🧩</div>
              <h4>Middleware Support</h4>
              <p>Extend with logging, persistence, validation without changing store code</p>
            </div>

            <div className={styles.whyCard}>
              <div className={styles.whyIcon}>💾</div>
              <h4>TypeScript First</h4>
              <p>Full type safety with automatic inference - no extra configuration needed</p>
            </div>
          </div>
        </div>

        {/* Comparison Section */}
        <div className={styles.comparisonSection}>
          <Heading as="h3" className={styles.comparisonTitle}>
            How Zustic Compares
          </Heading>
          <div className={styles.comparisonGrid}>
            {/* Header */}
            <div className={styles.comparisonHeader}>
                <div>Feature</div>
                <div className={styles.best}>Zustic</div>
                <div>Redux</div>
                <div>Zustand</div>
                <div>Context API</div>
            </div>

            {/* Row 1 */}
            <div className={styles.comparisonRow}>
                <div className={styles.feature} data-label="Feature">
                Bundle Size
                </div>
                <div className={styles.best} data-label="Zustic">
                ~500B
                </div>
                <div data-label="Redux">~6KB</div>
                <div data-label="Zustand">~2KB</div>
                <div data-label="Context API">Built-in</div>
            </div>

            {/* Row 2 */}
            <div className={styles.comparisonRow}>
                <div className={styles.feature} data-label="Feature">
                Learning Curve
                </div>
                <div className={styles.best} data-label="Zustic">
                ⭐ Easy
                </div>
                <div data-label="Redux">⭐⭐⭐⭐⭐ Hard</div>
                <div data-label="Zustand">⭐⭐ Easy</div>
                <div data-label="Context API">⭐⭐⭐ Medium</div>
            </div>

            {/* Row 3 */}
            <div className={styles.comparisonRow}>
                <div className={styles.feature} data-label="Feature">
                Boilerplate
                </div>
                <div className={styles.best} data-label="Zustic">
                Minimal
                </div>
                <div data-label="Redux">Massive</div>
                <div data-label="Zustand">Minimal</div>
                <div data-label="Context API">Some</div>
            </div>

            {/* Row 4 */}
            <div className={styles.comparisonRow}>
                <div className={styles.feature} data-label="Feature">
                Middleware
                </div>
                <div className={styles.best} data-label="Zustic">
                 Built-in
                </div>
                <div data-label="Redux"> Required</div>
                <div data-label="Zustand"> Optional</div>
                <div data-label="Context API"> No</div>
            </div>

            {/* Row 5 */}
            <div className={styles.comparisonRow}>
                <div className={styles.feature} data-label="Feature">
                TypeScript
                </div>
                <div className={styles.best} data-label="Zustic">
                 Excellent
                </div>
                <div data-label="Redux"> Good</div>
                <div data-label="Zustand"> Good</div>
                <div data-label="Context API"> Good</div>
            </div>
        </div>
        </div>
      </div>
    </section>
  );
}
