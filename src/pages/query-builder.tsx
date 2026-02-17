import React, { useState } from 'react'
import { themes, Highlight } from 'prism-react-renderer'
import styles from './query-builder.module.css'
import Head from '@docusaurus/Head'

interface QueryEndpoint {
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
  body?: string
  params?: Record<string, string>
  headers?: Record<string, string>
}

interface QueryParam {
  key: string
  value: string
  type: 'string' | 'number' | 'boolean'
}

export default function QueryBuilder(): React.ReactNode {
  const [endpoints, setEndpoints] = useState<QueryEndpoint[]>([{ name: 'Get Users', method: 'GET', url: '/users' }])

  const [selectedEndpoint, setSelectedEndpoint] = useState<QueryEndpoint | null>(endpoints[0])
  const [showNewForm, setShowNewForm] = useState(false)
  const [newEndpoint, setNewEndpoint] = useState<QueryEndpoint>({
    name: '',
    method: 'GET',
    url: '',
    params: {},
    headers: {},
  })
  const [queryParams, setQueryParams] = useState<QueryParam[]>([])
  const [requestBody, setRequestBody] = useState<string>('')
  const [copySuccess, setCopySuccess] = useState(false)


  const addEndpoint = () => {
    if (newEndpoint.name && newEndpoint.url) {
      setEndpoints([...endpoints, newEndpoint])
      setSelectedEndpoint(newEndpoint)
      setNewEndpoint({ name: '', method: 'GET', url: '' })
      setShowNewForm(false)
    }
  }

  const deleteEndpoint = (index: number) => {
    const updated = endpoints.filter((_, i) => i !== index)
    setEndpoints(updated)
    if (selectedEndpoint === endpoints[index] && updated.length > 0) {
      setSelectedEndpoint(updated[0])
    }
  }

  const generateQueryCode = (): string => {
    if (!selectedEndpoint) return ''

    const hasBody = requestBody.trim()
    const paramEntries = queryParams.filter(p => p.value)
    const isQuery = ['GET'].includes(selectedEndpoint.method)
    const endpointName = selectedEndpoint.name.replace(/\s+/g, '_').toLowerCase()

    // Build query string for URL
    let queryString = ''
    if (paramEntries.length > 0 && isQuery) {
      queryString = paramEntries
        .map(p => `${p.key}=\${${p.key}}`)
        .join('&')
    }

    let queryUrl = selectedEndpoint.url
    if (queryString) {
      queryUrl += `?${queryString}`
    }

    // Generate RTK Query code
    let code = `const api = createApi({\n`
    code += `  baseQuery: async (params) => {\n`
    code += `    // Your base query logic here\n`
    code += `  },\n`
    code += `  endpoints(builder) {\n`
    code += `    return {\n`
    if (isQuery) {
      code += `      ${endpointName}: builder.query<any, any>({\n`
      code += `        query: (arg) => ({\n`
      code += `          method: '${selectedEndpoint.method}',\n`
      code += `          url: \`${queryUrl}\`,\n`
      code += `        }),\n`
      code += `        onSuccess(data) {\n`
      code += `          console.log(data);\n`
      code += `        },\n`
      code += `        onError(err) {\n`
      code += `          console.error(err);\n`
      code += `        },\n`
      code += `      }),\n`
    } else {
      code += `      ${endpointName}: builder.mutation<any, any>({\n`
      code += `        query: (arg) => ({\n`
      code += `          url: '${selectedEndpoint.url}',\n`
      code += `          method: '${selectedEndpoint.method}',\n`
      if (hasBody) {
        code += `          body: {...arg},\n`
        code += `          headers: {\n`
        code += `            'Content-type': 'application/json; charset=UTF-8',\n`
        code += `          },\n`
      }
      code += `        }),\n`
      code += `        onSuccess(data) {\n`
      code += `          console.log(data);\n`
      code += `        },\n`
      code += `        onError(err) {\n`
      code += `          console.error(err);\n`
      code += `        },\n`
      code += `      }),\n`
    }

    code += `    }\n`
    code += `  },\n`
    code += `})\n\n`

    // Generate hook exports
    code += `const {\n`
    if (isQuery) {
      code += `  use${endpointName.charAt(0).toUpperCase() + endpointName.slice(1)}Query,\n`
    } else {
      code += `  use${endpointName.charAt(0).toUpperCase() + endpointName.slice(1)}Mutation,\n`
    }
    code += `} = api`

    return code
  }

  const copyToClipboard = () => {
    const code = generateQueryCode()
    navigator.clipboard.writeText(code).then(() => {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    })
  }

  const addQueryParam = () => {
    setQueryParams([...queryParams, { key: '', value: '', type: 'string' }])
  }

  const removeQueryParam = (index: number) => {
    setQueryParams(queryParams.filter((_, i) => i !== index))
  }

  const updateQueryParam = (index: number, field: keyof QueryParam, value: string) => {
    const updated = [...queryParams]
    updated[index] = { ...updated[index], [field]: value }
    setQueryParams(updated)
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Zustic Query Builder</title>
        <meta name="description" content="Build and generate RTK Query endpoints live using Zustic Query Builder" />
      </Head>
      {/* Builder Container */}
      <div className={styles.builderContainer}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.logo}>Zustic Query</h1>
          <p className={styles.logoSubtitle}>Builder</p>
        </div>

        <div className={styles.endpointsList}>
          <div className={styles.listHeader}>
            <h3>Endpoints</h3>
            <button
              className={styles.addButton}
              onClick={() => setShowNewForm(!showNewForm)}
              title="Add new endpoint"
            >
              +
            </button>
          </div>

          {showNewForm && (
            <div className={styles.newEndpointForm}>
              <input
                type="text"
                placeholder="Endpoint name"
                value={newEndpoint.name}
                onChange={(e) =>
                  setNewEndpoint({ ...newEndpoint, name: e.target.value })
                }
                className={styles.formInput}
              />
              <select
                value={newEndpoint.method}
                onChange={(e) =>
                  setNewEndpoint({
                    ...newEndpoint,
                    method: e.target.value as any,
                  })
                }
                className={styles.formSelect}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
              <input
                type="text"
                placeholder="URL (e.g., /users)"
                value={newEndpoint.url}
                onChange={(e) =>
                  setNewEndpoint({ ...newEndpoint, url: e.target.value })
                }
                className={styles.formInput}
              />
              <div className={styles.formButtons}>
                <button
                  className={styles.saveButton}
                  onClick={addEndpoint}
                >
                  Save
                </button>
                <button
                  className={styles.cancelButton}
                  onClick={() => setShowNewForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className={styles.endpointsContainer}>
            {endpoints.map((endpoint, index) => (
              <div
                key={index}
                className={`${styles.endpoint} ${
                  selectedEndpoint === endpoint ? styles.active : ''
                }`}
                onClick={() => setSelectedEndpoint(endpoint)}
              >
                <div className={styles.endpointContent}>
                  <span className={`${styles.methodBadge} ${styles[`methodBadge${endpoint.method}`]}`}>
                    {endpoint.method}
                  </span>
                  <div className={styles.endpointInfo}>
                    <div className={styles.endpointName}>{endpoint.name}</div>
                    <div className={styles.endpointUrl}>{endpoint.url}</div>
                  </div>
                </div>
                <button
                  className={styles.deleteButton}
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteEndpoint(index)
                  }}
                  title="Delete endpoint"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.content}>
        {selectedEndpoint ? (
          <>
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerTitle}>
                <h2>{selectedEndpoint.name}</h2>
                <code>
                  <span className={styles.methodKeyword}>{selectedEndpoint.method}</span>{' '}
                  <span className={styles.methodString}>{selectedEndpoint.url}</span>
                </code>
              </div>
              {/* <select
                value={colorMode}
                onChange={(e) => setColorMode(e.target.value as 'dark' | 'light')}
                className={styles.themeToggle}
                title="Switch theme"
              >
                <option value="dark">🌙 Dark</option>
                <option value="light">☀️ Light</option>
              </select> */}
            </div>

            {/* Editor Area */}
            <div className={styles.editor}>
              {/* Parameters Input */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Parameters</h3>
                <div className={styles.parametersPanel}>
                  <div className={styles.paramGroup}>
                    <label className={styles.paramLabel}>Method: <span className={styles.methodBadgeSmall}>{selectedEndpoint.method}</span></label>
                  </div>

                  <div className={styles.paramGroup}>
                    <label className={styles.paramLabel}>Endpoint URL:</label>
                    <div className={styles.urlDisplay}>{selectedEndpoint.url}</div>
                  </div>

                  <div className={styles.divider}></div>

                  <div className={styles.paramGroup}>
                    <div className={styles.paramHeader}>
                      <label className={styles.paramLabel}>Query Parameters:</label>
                      <button
                        className={styles.addParamButton}
                        onClick={addQueryParam}
                        title="Add parameter"
                      >
                        + Add
                      </button>
                    </div>

                    <div className={styles.paramsContainer}>
                      {queryParams.map((param, index) => (
                        <div key={index} className={styles.paramRow}>
                          <input
                            type="text"
                            placeholder="Key"
                            value={param.key}
                            onChange={(e) => updateQueryParam(index, 'key', e.target.value)}
                            className={styles.paramInput}
                          />
                          <input
                            type="text"
                            placeholder="Value"
                            value={param.value}
                            onChange={(e) => updateQueryParam(index, 'value', e.target.value)}
                            className={styles.paramInput}
                          />
                          <select
                            value={param.type}
                            onChange={(e) => updateQueryParam(index, 'type', e.target.value)}
                            className={styles.paramSelect}
                          >
                            <option value="string">string</option>
                            <option value="number">number</option>
                            <option value="boolean">boolean</option>
                          </select>
                          <button
                            className={styles.removeParamButton}
                            onClick={() => removeQueryParam(index)}
                            title="Remove parameter"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.divider}></div>

                  {!['GET'].includes(selectedEndpoint.method) && (
                    <div className={styles.paramGroup}>
                      <label className={styles.paramLabel}>Request Body (JSON):</label>
                      <textarea
                        className={styles.bodyInput}
                        placeholder='{"id": 1, "name": "John"}'
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Generated Code */}
              <div className={styles.section}>
                <div className={styles.codeHeader}>
                  <h3 className={styles.sectionTitle}>Generated Code</h3>
                  <button
                    className={`${styles.copyButton} ${copySuccess ? styles.copied : ''}`}
                    onClick={copyToClipboard}
                    title="Copy to clipboard"
                  >
                    {copySuccess ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <Highlight
                  theme={themes.dracula}
                  code={generateQueryCode() || '// Configure parameters to generate code'}
                  language="typescript"
                >
                  {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre className={`${className} ${styles.codeBlock}`} style={style}>
                      {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line, key: i })}>
                          <span className={styles.lineNumber}>{i + 1}</span>
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
          </>
        ) : (
          <div className={styles.empty}>
            <p>Select an endpoint or create a new one to get started</p>
          </div>
        )}
      </main>
      </div>
    </div>
  )
}
