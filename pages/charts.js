import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import dynamic from 'next/dynamic'

// Import TradingChart without SSR (requires window object)
const TradingChart = dynamic(() => import('../components/TradingChart'), { ssr: false })

const STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V', 'XOM']

// Timeframes with candlestick intervals
const TIMEFRAMES = [
  { label: '1D', days: 1, interval: '1d', description: '1 Day (Daily Candle)' },
  { label: '1W', days: 7, interval: '1d', description: '1 Week (Daily Candles)' },
  { label: '1M', days: 30, interval: '1d', description: '1 Month (Daily Candles)' },
  { label: '3M', days: 90, interval: '1d', description: '3 Months (Daily Candles)' },
  { label: '6M', days: 180, interval: '1d', description: '6 Months (Daily Candles)' },
  { label: '1Y', days: 365, interval: '1wk', description: '1 Year (Weekly Candles)' },
  { label: '5Y', days: 1825, interval: '1mo', description: '5 Years (Monthly Candles)' },
]

export default function Charts() {
  const [selectedStock, setSelectedStock] = useState('AAPL')
  const [timeframe, setTimeframe] = useState('3M')
  const [priceData, setPriceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [aiQuery, setAiQuery] = useState('')
  const [aiResults, setAiResults] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const tf = TIMEFRAMES.find(t => t.label === timeframe)
      const res = await fetch(`/api/history?symbol=${selectedStock}&days=${tf?.days || 90}&interval=${tf?.interval || '1d'}`)
      const data = await res.json()

      if (data.history) {
        setPriceData(data.history.map(d => ({
          date: d.date,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume
        })))
      }
    } catch (error) {
      console.error('Failed to fetch chart data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedStock, timeframe])

  // AI Pattern Analysis
  const runAIAnalysis = async (customQuery = null) => {
    const query = customQuery || aiQuery || 'find 10 bullish FVG setups'
    setAiLoading(true)
    setShowAiPanel(true)

    try {
      const res = await fetch('/api/ai-chart-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedStock,
          query,
          data: priceData,
        }),
      })

      const results = await res.json()
      setAiResults(results)
    } catch (error) {
      console.error('AI Analysis failed:', error)
      setAiResults({ error: 'Failed to analyze chart' })
    } finally {
      setAiLoading(false)
    }
  }

  // Calculate stats
  const firstPrice = priceData[0]?.close || 0
  const lastPrice = priceData[priceData.length - 1]?.close || 0
  const change = lastPrice - firstPrice
  const changePercent = firstPrice ? (change / firstPrice) * 100 : 0
  const highPrice = priceData.length ? Math.max(...priceData.map(d => d.high || 0)) : 0
  const lowPrice = priceData.length ? Math.min(...priceData.filter(d => d.low).map(d => d.low)) : 0
  const avgVolume = priceData.length
    ? priceData.reduce((sum, d) => sum + (d.volume || 0), 0) / priceData.length
    : 0

  const currentTf = TIMEFRAMES.find(t => t.label === timeframe)

  // Quick AI queries
  const quickQueries = [
    'find 10 bullish FVG',
    'find 5 bearish FVG',
    'find order blocks',
    'find liquidity sweeps',
  ]

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Charts</h1>
            <p className="text-slate-400 text-sm">Professional candlestick charts with drawing tools & AI analysis</p>
          </div>
        </div>

        {/* Stock Selector */}
        <div className="card p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Select Stock</div>
          <div className="flex flex-wrap gap-2">
            {STOCKS.map(symbol => (
              <button
                key={symbol}
                onClick={() => setSelectedStock(symbol)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedStock === symbol
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Main Chart */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="h-[550px] flex items-center justify-center bg-slate-900">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-slate-400">Loading chart data...</span>
              </div>
            </div>
          ) : priceData.length > 0 ? (
            <TradingChart
              data={priceData}
              symbol={selectedStock}
              height={500}
              onAIAnalysis={() => setShowAiPanel(true)}
            />
          ) : (
            <div className="h-[550px] flex items-center justify-center bg-slate-900">
              <span className="text-slate-400">No data available</span>
            </div>
          )}
        </div>

        {/* AI Analysis Panel */}
        {showAiPanel && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                AI Chart Analysis
              </h3>
              <button
                onClick={() => setShowAiPanel(false)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            {/* AI Query Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runAIAnalysis()}
                placeholder="Ask AI: e.g., 'find 10 bullish FVG setups'"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
              />
              <button
                onClick={() => runAIAnalysis()}
                disabled={aiLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 rounded-lg text-white font-medium transition-all"
              >
                {aiLoading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>

            {/* Quick Queries */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs text-slate-500 self-center">Quick:</span>
              {quickQueries.map(q => (
                <button
                  key={q}
                  onClick={() => { setAiQuery(q); runAIAnalysis(q); }}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-400 hover:text-white transition-all"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* AI Results */}
            {aiLoading && (
              <div className="flex items-center gap-3 text-slate-400">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                Analyzing chart patterns...
              </div>
            )}

            {aiResults && !aiLoading && (
              <div className="space-y-4">
                {aiResults.error ? (
                  <div className="text-red-400">{aiResults.error}</div>
                ) : (
                  <>
                    <div className="text-slate-300 text-sm bg-slate-800/50 rounded-lg p-3">
                      {aiResults.summary}
                    </div>

                    {aiResults.patterns?.length > 0 && (
                      <div className="space-y-2">
                        {aiResults.patterns.map((pattern, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-lg border ${
                              pattern.direction === 'bullish'
                                ? 'bg-emerald-900/20 border-emerald-500/30'
                                : 'bg-red-900/20 border-red-500/30'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`badge ${
                                pattern.direction === 'bullish' ? 'badge-success' : 'badge-danger'
                              }`}>
                                {pattern.type}
                              </span>
                              <span className="text-xs text-slate-500">{pattern.date}</span>
                            </div>
                            <p className="text-sm text-slate-300">{pattern.description}</p>
                            {pattern.score && (
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs text-slate-500">Score:</span>
                                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      pattern.direction === 'bullish' ? 'bg-emerald-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${pattern.score}%` }}
                                  />
                                </div>
                                <span className="text-xs text-slate-400">{pattern.score?.toFixed(0)}%</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {aiResults.patterns?.length === 0 && (
                      <div className="text-slate-400 text-center py-4">
                        No patterns found matching your query
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Timeframe Selector */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Timeframe</div>
            {currentTf && (
              <div className="text-xs text-slate-400">{currentTf.description}</div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.label}
                onClick={() => setTimeframe(tf.label)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeframe === tf.label
                    ? 'bg-slate-700 text-white border border-blue-500/50'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        {priceData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className={`stat-card ${changePercent >= 0 ? 'stat-up' : 'stat-down'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Change ({timeframe})</div>
                  <div className={`text-2xl font-bold ${changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                  </div>
                  <div className="text-sm text-slate-500">
                    {change >= 0 ? '+' : ''}${change.toFixed(2)}
                  </div>
                </div>
                <div className={`w-10 h-10 ${changePercent >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'} rounded-lg flex items-center justify-center`}>
                  <svg className={`w-5 h-5 ${changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={changePercent >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                  </svg>
                </div>
              </div>
            </div>

            <div className="stat-card stat-neutral">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Period High</div>
                  <div className="text-2xl font-bold text-emerald-400">${highPrice.toFixed(2)}</div>
                  <div className="text-sm text-slate-500">Highest point</div>
                </div>
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="stat-card stat-neutral">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Period Low</div>
                  <div className="text-2xl font-bold text-red-400">${lowPrice.toFixed(2)}</div>
                  <div className="text-sm text-slate-500">Lowest point</div>
                </div>
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="stat-card stat-neutral">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Range</div>
                  <div className="text-2xl font-bold text-white">${(highPrice - lowPrice).toFixed(2)}</div>
                  <div className="text-sm text-slate-500">High - Low</div>
                </div>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="stat-card stat-neutral">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Avg Volume</div>
                  <div className="text-2xl font-bold text-white">{(avgVolume / 1000000).toFixed(2)}M</div>
                  <div className="text-sm text-slate-500">Per candle</div>
                </div>
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Candle Info */}
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              <span className="text-white font-medium">{priceData.length}</span> candles loaded
              {currentTf && (
                <span className="ml-2">
                  | {currentTf.interval === '1d' ? 'Daily' : currentTf.interval === '1wk' ? 'Weekly' : 'Monthly'} interval
                </span>
              )}
            </div>
            <button
              onClick={fetchData}
              className="btn-primary text-sm"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
