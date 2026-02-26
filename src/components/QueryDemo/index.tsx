import { useState, useEffect, useRef } from 'react';
import styles from './styles.module.css';
import { themes, Highlight } from 'prism-react-renderer';
import { useColorMode } from '@docusaurus/theme-common';

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

function QueryDemoContent() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [cacheHit, setCacheHit] = useState(false);
  const [copied, setCopied] = useState(false);
  const colorMode = useColorMode();

  const cacheRef = useRef({ data: null as Post[] | null, timestamp: 0, timeout: 10000 });

  const fetchPosts = async () => {
    const now = Date.now();
    
    if (cacheRef.current.data && now - cacheRef.current.timestamp < cacheRef.current.timeout) {
      setCacheHit(true);
      setPosts(cacheRef.current.data);
      setTimeout(() => setCacheHit(false), 1500);
      return;
    }

    setLoading(true);
    setCacheHit(false);

    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      cacheRef.current.data = data;
      cacheRef.current.timestamp = now;
      
      setPosts(data);
    } catch (err) {
      console.log(err);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const code = `import { createApi } from 'zustic/query'

const api = createApi({
  baseQuery: async (params) => {
    const res = await fetch(\`\${BASE_URL}/\${params.url}\`, {
      method: params.method || 'GET',
      body: params.body ? JSON.stringify(params.body) : undefined
    })
    return { data: await res.json() }
  },
  cacheTimeout: 5 * 60 * 1000,
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => ({ url: '/users' })
    }),
    createUser: builder.mutation({
      query: (user) => ({ url: '/users', method: 'POST', body: user })
    })
  })
})

export const { useGetUsersQuery, useCreateUserMutation } = api`;

  return (
    <div className={styles.demoCard}>
      {/* Header with Demo */}
      <div className={styles.cardHeader}>
        <div className={styles.headerDemo}>
          {cacheHit && (
            <div className={styles.cacheBadge}>
              <span>⚡</span>
            </div>
          )}
          {loading && (
            <div className={styles.loadingBadge}>
              <span>⏳</span>
            </div>
          )}
          {!loading && !cacheHit && (
            <div className={styles.readyBadge}>
              <span>{posts.length}</span>
            </div>
          )}
        </div>
        <button
          className={`${styles.headerButton} ${loading ? styles.headerButtonLoading : ''}`}
          onClick={fetchPosts}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch Posts'}
        </button>
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
  );
}

export default function QueryDemo() {
  return <QueryDemoContent />
}
