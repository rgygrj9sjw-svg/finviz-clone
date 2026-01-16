import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import ProChart from '../components/ProChart'

const STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V', 'XOM']
const TIMEFRAMES = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
]

export default function Charts() {
  const [selectedStock, setSelectedStock] = useState('AAPL')
  const [timeframe, setTimeframe] = useState('3M')
  const [priceData, setPriceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [quote, setQuote] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const tf = TIMEFRAMES.find(t => t.label === timeframe)
      const res = await fetch(`/api/history?symbol=${selectedStock}&days=${tf?.days || 90}`)
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

  // Calculate stats
  const firstPrice = priceData[0]?.close || 0
  const lastPrice = priceData[priceData.length - 1]?.close || 0
  const change = lastPrice - firstPrice
  const changePercent = firstPrice ? (change / firstPrice) * 100 : 0
  const highPrice = Math.max(...priceData.map(d => d.high || 0))
  const lowPrice = Math.min(...priceData.filter(d => d.low).map(d => d.low))
  const avgVolume = priceData.length
    ? priceData.reduce((sum, d) => sum + (d.volume || 0), 0) / priceData.length
    : 0

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Charts</h1>
            <p className="text-slate-400 text-sm">Professional candlestick charts with real-time data</p>
          </div>
        </div>

        {/* Stock Selector */}
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

        {/* Main Chart */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="h-[500px] flex items-center justify-center bg-slate-900">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-slate-400">Loading chart data...</span>
              </div>
            </div>
          ) : priceData.length > 0 ? (
            <ProChart data={priceData} symbol={selectedStock} height={450} />
          ) : (
            <div className="h-[500px] flex items-center justify-center bg-slate-900">
              <span className="text-slate-400">No data available</span>
            </div>
          )}
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 mr-2">Timeframe:</span>
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.label}
              onClick={() => setTimeframe(tf.label)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeframe === tf.label
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        {priceData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className={`stat-card ${changePercent >= 0 ? 'stat-up' : 'stat-down'}`}>
              <div className="text-xs text-slate-400 uppercase tracking-wide">Change ({timeframe})</div>
              <div className={`text-2xl font-bold ${changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
              </div>
              <div className="text-sm text-slate-500">
                {change >= 0 ? '+' : ''}${change.toFixed(2)}
              </div>
            </div>

            <div className="stat-card stat-neutral">
              <div className="text-xs text-slate-400 uppercase tracking-wide">Period High</div>
              <div className="text-2xl font-bold text-emerald-400">${highPrice.toFixed(2)}</div>
              <div className="text-sm text-slate-500">Highest point</div>
            </div>

            <div className="stat-card stat-neutral">
              <div className="text-xs text-slate-400 uppercase tracking-wide">Period Low</div>
              <div className="text-2xl font-bold text-red-400">${lowPrice.toFixed(2)}</div>
              <div className="text-sm text-slate-500">Lowest point</div>
            </div>

            <div className="stat-card stat-neutral">
              <div className="text-xs text-slate-400 uppercase tracking-wide">Range</div>
              <div className="text-2xl font-bold text-white">${(highPrice - lowPrice).toFixed(2)}</div>
              <div className="text-sm text-slate-500">High - Low</div>
            </div>

            <div className="stat-card stat-neutral">
              <div className="text-xs text-slate-400 uppercase tracking-wide">Avg Volume</div>
              <div className="text-2xl font-bold text-white">{(avgVolume / 1000000).toFixed(2)}M</div>
              <div className="text-sm text-slate-500">Daily average</div>
            </div>
          </div>
        )}

        {/* Achievement Toast */}
        <div className="fixed bottom-4 right-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-lg shadow-2xl animate-slideUp flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <div className="font-bold">Chart Explorer!</div>
            <div className="text-sm text-purple-200">Viewed 5 different stocks</div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
