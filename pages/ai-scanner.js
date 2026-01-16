import { useState } from 'react'
import Layout from '../components/Layout'
import Link from 'next/link'

const QUICK_QUERIES = [
  { label: 'Top 10 Bullish FVG', query: 'find 10 bullish fvg' },
  { label: 'Top 10 Bearish FVG', query: 'find 10 bearish fvg' },
  { label: 'Best Order Blocks', query: 'find 10 order blocks' },
  { label: 'Liquidity Sweeps', query: 'find 10 liquidity sweeps' },
  { label: 'All Bullish Setups', query: 'find 20 bullish' },
  { label: 'All Bearish Setups', query: 'find 20 bearish' },
]

export default function AIScanner() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runScan = async (searchQuery = null) => {
    const q = searchQuery || query || 'find 10 bullish fvg'
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai-scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        setResults(data)
      }
    } catch (e) {
      setError('Failed to scan stocks: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">AI Scanner</h1>
          <p className="text-slate-400 text-sm">Scan the market for trading setups using natural language</p>
        </div>

        {/* Query Input */}
        <div className="card p-6">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-3">Ask AI to find setups</div>
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runScan()}
              placeholder="e.g., find top 10 bullish stocks with FVG"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
            <button
              onClick={() => runScan()}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all"
            >
              {loading ? 'Scanning...' : 'Scan Market'}
            </button>
          </div>

          {/* Quick Queries */}
          <div className="mt-4">
            <div className="text-xs text-slate-500 mb-2">Quick scans:</div>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUERIES.map((q) => (
                <button
                  key={q.query}
                  onClick={() => { setQuery(q.query); runScan(q.query); }}
                  disabled={loading}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded text-sm text-slate-400 hover:text-white transition-all"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="card p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <div className="text-white font-medium">Scanning 30 stocks...</div>
                <div className="text-slate-400 text-sm">Analyzing patterns across the market</div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="card p-4 border-red-500/30 bg-red-900/10">
            <div className="text-red-400">{error}</div>
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="card p-4">
              <div className="text-slate-300">{results.summary}</div>
            </div>

            {/* Results Grid */}
            {results.results?.length > 0 ? (
              <div className="grid gap-3">
                {results.results.map((result, i) => (
                  <Link
                    key={`${result.symbol}-${result.date}-${i}`}
                    href={`/charts?symbol=${result.symbol}`}
                    className="card p-4 hover:border-blue-500/50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-sm font-bold text-slate-400">
                          {i + 1}
                        </div>

                        {/* Stock Info */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                              {result.symbol}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              result.direction === 'bullish'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {result.direction.toUpperCase()}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">
                              {result.type}
                            </span>
                          </div>
                          <div className="text-sm text-slate-400 mt-0.5">
                            {result.description}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Price Info */}
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Current Price</div>
                          <div className="text-white font-medium">${result.latestPrice?.toFixed(2)}</div>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Score</div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  result.direction === 'bullish' ? 'bg-emerald-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${result.score || 0}%` }}
                              />
                            </div>
                            <span className="text-sm text-slate-300 w-8">{result.score?.toFixed(0)}%</span>
                          </div>
                        </div>

                        {/* Date */}
                        <div className="text-right min-w-[80px]">
                          <div className="text-xs text-slate-500">Date</div>
                          <div className="text-slate-300 text-sm">{result.date}</div>
                        </div>

                        {/* Arrow */}
                        <div className="text-slate-600 group-hover:text-blue-400 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center">
                <div className="text-slate-400">No patterns found matching your query</div>
              </div>
            )}
          </div>
        )}

        {/* Initial State */}
        {!results && !loading && !error && (
          <div className="card p-12 text-center">
            <div className="text-slate-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-white font-medium mb-2">Ready to scan the market</div>
            <div className="text-slate-400 text-sm max-w-md mx-auto">
              Enter a query like "find top 10 bullish stocks with FVG" or click a quick scan button above to find trading setups across 30 stocks.
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
