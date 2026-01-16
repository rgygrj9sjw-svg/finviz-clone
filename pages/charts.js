import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'

// Sample price data for different stocks
const STOCK_DATA = {
  AAPL: { name: 'Apple Inc.', price: 178.52, change: 2.34 },
  MSFT: { name: 'Microsoft Corp', price: 378.91, change: -1.23 },
  GOOGL: { name: 'Alphabet Inc', price: 141.80, change: 3.45 },
  AMZN: { name: 'Amazon.com Inc', price: 178.25, change: 4.12 },
  NVDA: { name: 'NVIDIA Corp', price: 495.22, change: 12.34 },
  TSLA: { name: 'Tesla Inc', price: 248.48, change: -5.67 },
}

// Generate fake historical data
const generatePriceData = (basePrice, days = 90) => {
  const data = []
  let price = basePrice * 0.85
  const now = Date.now()

  for (let i = days; i >= 0; i--) {
    const change = (Math.random() - 0.48) * (basePrice * 0.03)
    price = Math.max(price + change, basePrice * 0.5)
    data.push({
      date: new Date(now - i * 24 * 60 * 60 * 1000).toLocaleDateString(),
      price: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 50000000) + 10000000
    })
  }
  return data
}

export default function Charts() {
  const [selectedStock, setSelectedStock] = useState('AAPL')
  const [timeframe, setTimeframe] = useState('3M')
  const [priceData, setPriceData] = useState([])
  const canvasRef = useRef(null)

  useEffect(() => {
    const days = timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : timeframe === '3M' ? 90 : 365
    setPriceData(generatePriceData(STOCK_DATA[selectedStock].price, days))
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

    const prices = priceData.map(d => d.price)
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
    ctx.strokeStyle = prices[prices.length - 1] >= prices[0] ? '#22c55e' : '#ef4444'
    ctx.lineWidth = 2
    ctx.beginPath()

    priceData.forEach((point, i) => {
      const x = (i / (priceData.length - 1)) * width
      const y = height - ((point.price - minPrice) / priceRange) * height
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Fill area under line
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    const color = prices[prices.length - 1] >= prices[0] ? '34, 197, 94' : '239, 68, 68'
    gradient.addColorStop(0, `rgba(${color}, 0.3)`)
    gradient.addColorStop(1, `rgba(${color}, 0)`)

    ctx.fillStyle = gradient
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fill()

  }, [priceData])

  const stock = STOCK_DATA[selectedStock]
  const startPrice = priceData[0]?.price || 0
  const endPrice = priceData[priceData.length - 1]?.price || 0
  const periodChange = endPrice - startPrice
  const periodChangePercent = startPrice ? ((periodChange / startPrice) * 100) : 0

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Stock Charts</h1>

        {/* Stock Selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(STOCK_DATA).map(([symbol, data]) => (
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
              <p className="text-gray-400 text-sm">{stock.name}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${endPrice.toFixed(2)}</p>
              <p className={`text-sm font-medium ${periodChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {periodChange >= 0 ? '+' : ''}{periodChange.toFixed(2)} ({periodChangePercent >= 0 ? '+' : ''}{periodChangePercent.toFixed(2)}%)
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
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="w-full h-64 md:h-80 rounded"
          />

          {/* Volume bars */}
          <div className="flex items-end h-16 gap-px mt-2">
            {priceData.slice(-50).map((point, i) => (
              <div
                key={i}
                className="flex-1 bg-gray-700 rounded-t"
                style={{ height: `${(point.volume / 50000000) * 100}%` }}
                title={`Volume: ${(point.volume / 1000000).toFixed(1)}M`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">Volume</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-gray-400 text-xs">Open</p>
            <p className="text-lg font-medium">${startPrice.toFixed(2)}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-gray-400 text-xs">High</p>
            <p className="text-lg font-medium">${Math.max(...priceData.map(d => d.price)).toFixed(2)}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-gray-400 text-xs">Low</p>
            <p className="text-lg font-medium">${Math.min(...priceData.map(d => d.price)).toFixed(2)}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-gray-400 text-xs">Avg Volume</p>
            <p className="text-lg font-medium">
              {(priceData.reduce((a, b) => a + b.volume, 0) / priceData.length / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
