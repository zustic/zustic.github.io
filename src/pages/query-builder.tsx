import React, { useState } from 'react'
import { themes, Highlight } from 'prism-react-renderer'
import styles from './query-builder.module.css'
import Head from '@docusaurus/Head'
import {create, Middleware} from 'zustic'
import BrowserOnly from '@docusaurus/BrowserOnly';


interface QueryEndpoint {
  id: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
}

interface QueryParam {
  key: string
  value: string
  type: 'string' | 'number' | 'boolean'
}

interface EndpointData {
  params: QueryParam[]
  body: string
}

type State = {
  endpoints: QueryEndpoint[]
  endpointDataMap: Record<string, EndpointData>
}
type Action = {
  setEndpoints: (endpoints: QueryEndpoint[]) => void
  setEndpointData: (endpointId: string, data: EndpointData) => void
}

const persistMiddleware = <T extends object>(): Middleware<T> => (set, get) => (next) => async (partial) => {
  next(partial)
  try {
    const state = get()
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('query-builder', JSON.stringify(state))
    }
  } catch (error) {
    console.error('Failed to persist:', error)
  }
}

const useQueryBuilderStore = create<State & Action>((set) => {
    let saved = null
    let parsed = null

    if (typeof window !== 'undefined') {
      saved = window.localStorage.getItem('query-builder')
      parsed = saved ? JSON.parse(saved) : null
    }

    return {
      endpoints: parsed?.endpoints || [
        {
          id: 'default-1',
          name: 'Get Users',
          method: 'GET',
          url: '/users'
        }
      ],
      endpointDataMap: parsed?.endpointDataMap || {
        'default-1': { params: [], body: '' }
      },
      setEndpoints: (endpoints) => set({ endpoints }),
      setEndpointData: (endpointId, data) =>
        set((state) => ({
          endpointDataMap: {
            ...state.endpointDataMap,
            [endpointId]: data
          }
        }))
    }
  },
  [persistMiddleware()]
)



export default function QueryBuilder(): React.ReactNode {
return (
    <BrowserOnly>
      {() => <QueryBuilderCom />}
    </BrowserOnly>
  );
}
function QueryBuilderCom(): React.ReactNode {
  const { setEndpoints, endpoints, endpointDataMap, setEndpointData } =
    useQueryBuilderStore()
  const [selectedEndpoint, setSelectedEndpoint] = useState<QueryEndpoint | null>(
    endpoints[0] || null
  )

  const [showNewForm, setShowNewForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [newEndpoint, setNewEndpoint] = useState<QueryEndpoint>({
    id: '',
    name: '',
    method: 'GET',
    url: ''
  })
  const [copySuccess, setCopySuccess] = useState(false)
  const [validationError, setValidationError] = useState<string>('')

  // Filter endpoints by name or URL
  const filteredEndpoints = endpoints.filter((endpoint) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      endpoint.name.toLowerCase().includes(searchLower) ||
      endpoint.url.toLowerCase().includes(searchLower)
    )
  })

  // Get current endpoint's data
  const getCurrentEndpointData = (): EndpointData => {
    if (!selectedEndpoint) return { params: [], body: '' }
    return (
      endpointDataMap[selectedEndpoint.id] || { params: [], body: '' }
    )
  }

  const currentData = getCurrentEndpointData()
  const queryParams = currentData.params
  const requestBody = currentData.body

  // Update params for current endpoint
  const updateQueryParams = (newParams: QueryParam[]) => {
    if (!selectedEndpoint) return
    setEndpointData(selectedEndpoint.id, {
      ...currentData,
      params: newParams
    })
  }

  // Update body for current endpoint
  const updateRequestBody = (newBody: string) => {
    if (!selectedEndpoint) return
    setEndpointData(selectedEndpoint.id, {
      ...currentData,
      body: newBody
    })
  }

  const addEndpoint = () => {
    // Reset error
    setValidationError('')

    // Validate name is not empty
    if (!newEndpoint.name.trim()) {
      setValidationError('Endpoint name is required')
      return
    }

    // Validate URL is not empty
    if (!newEndpoint.url.trim()) {
      setValidationError('Endpoint URL is required')
      return
    }

    // Check for duplicate name (case-insensitive)
    const duplicateName = endpoints.some(
      ep => ep.name.toLowerCase() === newEndpoint.name.toLowerCase()
    )
    if (duplicateName) {
      setValidationError(`Endpoint "${newEndpoint.name}" already exists`)
      return
    }

    // All validation passed, add endpoint
    const id = `endpoint-${Date.now()}`
    const endpoint: QueryEndpoint = {
      ...newEndpoint,
      id
    }
    setEndpoints([...endpoints, endpoint])
    setEndpointData(id, { params: [], body: '' })
    setSelectedEndpoint(endpoint)
    setNewEndpoint({ id: '', name: '', method: 'GET', url: '' })
    setShowNewForm(false)
  }

  const deleteEndpoint = (index: number) => {
    const endpoint = endpoints[index]
    const updated = endpoints.filter((_, i) => i !== index)
    setEndpoints(updated)
    if (selectedEndpoint?.id === endpoint.id && updated.length > 0) {
      setSelectedEndpoint(updated[0])
    }
  }

  const generateQueryCode = (): string => {
    if (!selectedEndpoint) return ''

    const hasBody = requestBody.trim()
    const paramEntries = queryParams.filter(p => p.value)
    const isQuery = ['GET'].includes(selectedEndpoint.method)
    const endpointName = selectedEndpoint.name.replace(/\s+/g, '_')

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
    const newParams = [...queryParams, { key: '', value: '', type: 'string' as const }]
    updateQueryParams(newParams)
  }

  const removeQueryParam = (index: number) => {
    const newParams = queryParams.filter((_, i) => i !== index)
    updateQueryParams(newParams)
  }

  const updateQueryParam = (index: number, field: keyof QueryParam, value: string) => {
    const updated = [...queryParams]
    updated[index] = { ...updated[index], [field]: value as any }
    updateQueryParams(updated)
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

          {/* Search Input */}
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search by name or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                className={styles.clearSearchButton}
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {showNewForm && (
            <div className={styles.newEndpointForm}>
              {validationError && (
                <div className={styles.errorMessage}>
                  <span>⚠️ {validationError}</span>
                </div>
              )}
              <input
                type="text"
                placeholder="Endpoint name"
                value={newEndpoint.name}
                onChange={(e) => {
                  setNewEndpoint({ ...newEndpoint, name: e.target.value })
                  setValidationError('')
                }}
                className={`${styles.formInput} ${validationError ? styles.inputError : ''}`}
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
                onChange={(e) => {
                  setNewEndpoint({ ...newEndpoint, url: e.target.value })
                  setValidationError('')
                }}
                className={`${styles.formInput} ${validationError ? styles.inputError : ''}`}
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
            {filteredEndpoints.length > 0 ? (
              filteredEndpoints.map((endpoint, index) => (
                <div
                  key={index}
                  className={`${styles.endpoint} ${
                    selectedEndpoint?.id === endpoint.id ? styles.active : ''
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
                      const actualIndex = endpoints.findIndex(ep => ep.id === endpoint.id)
                      deleteEndpoint(actualIndex)
                    }}
                    title="Delete endpoint"
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <div className={styles.noResults}>
                <p>No endpoints found</p>
              </div>
            )}
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
                        onChange={(e) => updateRequestBody(e.target.value)}
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
