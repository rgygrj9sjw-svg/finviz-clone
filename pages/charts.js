import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'

const STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V', 'XOM']

export default function Charts() {
  const [selectedStock, setSelectedStock] = useState('AAPL')
  const [timeframe, setTimeframe] = useState('3M')
  const [priceData, setPriceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [quote, setQuote] = useState(null)
  const canvasRef = useRef(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const days = timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : timeframe === '3M' ? 90 : 365

      // Fetch historical data
      const histRes = await fetch(`/api/history?symbol=${selectedStock}&days=${days}`)
      const histData = await histRes.json()

      if (histData.history) {
        setPriceData(histData.history)
      }

      // Fetch current quote
      const quoteRes = await fetch('/api/stocks')
      const quoteData = await quoteRes.json()
      const stockQuote = quoteData.stocks?.find(s => s.symbol === selectedStock)
      if (stockQuote) {
        setQuote(stockQuote)
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

  useEffect(() => {
    if (!canvasRef.current || priceData.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, width, height)

    const prices = priceData.map(d => d.close)
    const minPrice = Math.min(...prices) * 0.98
    const maxPrice = Math.max(...prices) * 1.02
    const priceRange = maxPrice - minPrice

    // Draw grid
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = (height * i) / 4
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()

      // Price labels
      const price = maxPrice - (priceRange * i) / 4
      ctx.fillStyle = '#666'
      ctx.font = '11px sans-serif'
      ctx.fillText('$' + price.toFixed(2), 5, y + 12)
    }

    // Draw price line
    const isUp = prices[prices.length - 1] >= prices[0]
    ctx.strokeStyle = isUp ? '#22c55e' : '#ef4444'
    ctx.lineWidth = 2
    ctx.beginPath()

    priceData.forEach((point, i) => {
      const x = (i / (priceData.length - 1)) * width
      const y = height - ((point.close - minPrice) / priceRange) * height
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Fill area under line
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    const color = isUp ? '34, 197, 94' : '239, 68, 68'
    gradient.addColorStop(0, `rgba(${color}, 0.3)`)
    gradient.addColorStop(1, `rgba(${color}, 0)`)

    ctx.fillStyle = gradient
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fill()

  }, [priceData])

  const startPrice = priceData[0]?.close || 0
  const endPrice = priceData[priceData.length - 1]?.close || 0
  const periodChange = endPrice - startPrice
  const periodChangePercent = startPrice ? ((periodChange / startPrice) * 100) : 0

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Stock Charts</h1>

        {/* Stock Selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {STOCKS.map(symbol => (
            <button
              key={symbol}
              onClick={() => setSelectedStock(symbol)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                selectedStock === symbol
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {symbol}
            </button>
          ))}
        </div>

        {/* Chart Container */}
        <div className="bg-gray-900 rounded-lg p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{selectedStock}</h2>
              <p className="text-gray-400 text-sm">{quote?.name || 'Loading...'}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                ${quote?.price?.toFixed(2) || endPrice.toFixed(2)}
              </p>
              <p className={`text-sm font-medium ${periodChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {periodChange >= 0 ? '+' : ''}{periodChange.toFixed(2)} ({periodChangePercent >= 0 ? '+' : ''}{periodChangePercent.toFixed(2)}%)
                <span className="text-gray-500 ml-1">({timeframe})</span>
              </p>
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="flex gap-2 mb-4">
            {['1W', '1M', '3M', '1Y'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  timeframe === tf
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Canvas */}
          {loading ? (
            <div className="w-full h-64 md:h-80 flex items-center justify-center bg-gray-800 rounded">
              <div className="animate-pulse text-gray-400">Loading chart data...</div>
            </div>
          ) : priceData.length > 0 ? (
            <canvas
              ref={canvasRef}
              width={800}
              height={400}
              className="w-full h-64 md:h-80 rounded"
            />
          ) : (
            <div className="w-full h-64 md:h-80 flex items-center justify-center bg-gray-800 rounded">
              <div className="text-gray-400">No data available. Add API keys to .env.local</div>
            </div>
          )}

          {/* Volume bars */}
          {priceData.length > 0 && (
            <>
              <div className="flex items-end h-16 gap-px mt-2">
                {priceData.slice(-50).map((point, i) => {
                  const maxVol = Math.max(...priceData.slice(-50).map(p => p.volume || 0))
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-gray-700 rounded-t"
                      style={{ height: `${maxVol ? (point.volume / maxVol) * 100 : 0}%` }}
                      title={`Volume: ${((point.volume || 0) / 1000000).toFixed(1)}M`}
                    />
                  )
                })}
              </div>
              <p className="text-xs text-gray-500 mt-1">Volume</p>
            </>
          )}
        </div>

        {/* Stats */}
        {priceData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 text-xs">Open</p>
              <p className="text-lg font-medium">${priceData[0]?.open?.toFixed(2) || '-'}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 text-xs">High ({timeframe})</p>
              <p className="text-lg font-medium text-green-400">
                ${Math.max(...priceData.map(d => d.high || 0)).toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 text-xs">Low ({timeframe})</p>
              <p className="text-lg font-medium text-red-400">
                ${Math.min(...priceData.map(d => d.low || Infinity)).toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 text-xs">Avg Volume</p>
              <p className="text-lg font-medium">
                {(priceData.reduce((a, b) => a + (b.volume || 0), 0) / priceData.length / 1000000).toFixed(1)}M
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
