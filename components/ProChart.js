import { useEffect, useRef, useState } from 'react'

// Professional candlestick chart (TradingView-style, no branding)
export default function ProChart({ data, symbol, height = 400 }) {
  const canvasRef = useRef(null)
  const [hoveredCandle, setHoveredCandle] = useState(null)
  const [chartType, setChartType] = useState('candle') // candle, line, area

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()

    // Set canvas size for retina
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const width = rect.width
    const chartHeight = rect.height

    // Margins
    const margin = { top: 20, right: 60, bottom: 30, left: 10 }
    const plotWidth = width - margin.left - margin.right
    const plotHeight = chartHeight - margin.top - margin.bottom

    // Clear canvas
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, width, chartHeight)

    // Calculate price range
    const prices = data.flatMap(d => [d.high, d.low])
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice
    const paddedMin = minPrice - priceRange * 0.05
    const paddedMax = maxPrice + priceRange * 0.05
    const paddedRange = paddedMax - paddedMin

    // Helper functions
    const xScale = (i) => margin.left + (i / (data.length - 1)) * plotWidth
    const yScale = (price) => margin.top + plotHeight - ((price - paddedMin) / paddedRange) * plotHeight

    // Draw grid
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 1

    // Horizontal grid lines
    const priceStep = paddedRange / 5
    for (let i = 0; i <= 5; i++) {
      const price = paddedMin + priceStep * i
      const y = yScale(price)

      ctx.beginPath()
      ctx.moveTo(margin.left, y)
      ctx.lineTo(width - margin.right, y)
      ctx.stroke()

      // Price labels
      ctx.fillStyle = '#64748b'
      ctx.font = '11px Inter, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('$' + price.toFixed(2), width - margin.right + 5, y + 4)
    }

    // Vertical grid lines (time)
    const timeStep = Math.ceil(data.length / 6)
    for (let i = 0; i < data.length; i += timeStep) {
      const x = xScale(i)
      ctx.beginPath()
      ctx.moveTo(x, margin.top)
      ctx.lineTo(x, chartHeight - margin.bottom)
      ctx.stroke()
    }

    // Draw based on chart type
    if (chartType === 'candle') {
      drawCandlesticks(ctx, data, xScale, yScale, plotWidth)
    } else if (chartType === 'line') {
      drawLine(ctx, data, xScale, yScale)
    } else {
      drawArea(ctx, data, xScale, yScale, chartHeight, margin)
    }

    // Draw volume bars at bottom
    const maxVolume = Math.max(...data.map(d => d.volume || 0))
    const volumeHeight = 40

    data.forEach((candle, i) => {
      if (!candle.volume) return
      const x = xScale(i)
      const barWidth = Math.max(1, plotWidth / data.length - 2)
      const volHeight = (candle.volume / maxVolume) * volumeHeight
      const isUp = candle.close >= candle.open

      ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
      ctx.fillRect(
        x - barWidth / 2,
        chartHeight - margin.bottom - volHeight,
        barWidth,
        volHeight
      )
    })

  }, [data, chartType])

  function drawCandlesticks(ctx, data, xScale, yScale, plotWidth) {
    const candleWidth = Math.max(3, (plotWidth / data.length) * 0.7)

    data.forEach((candle, i) => {
      const x = xScale(i)
      const isUp = candle.close >= candle.open

      // Colors
      const bodyColor = isUp ? '#10b981' : '#ef4444'
      const wickColor = isUp ? '#10b981' : '#ef4444'

      // Draw wick
      ctx.strokeStyle = wickColor
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, yScale(candle.high))
      ctx.lineTo(x, yScale(candle.low))
      ctx.stroke()

      // Draw body
      const bodyTop = yScale(Math.max(candle.open, candle.close))
      const bodyBottom = yScale(Math.min(candle.open, candle.close))
      const bodyHeight = Math.max(1, bodyBottom - bodyTop)

      ctx.fillStyle = bodyColor
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight)

      // Body border for hollow candles
      if (isUp) {
        ctx.strokeStyle = '#10b981'
        ctx.lineWidth = 1
        ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight)
      }
    })
  }

  function drawLine(ctx, data, xScale, yScale) {
    const isUp = data[data.length - 1].close >= data[0].close
    ctx.strokeStyle = isUp ? '#10b981' : '#ef4444'
    ctx.lineWidth = 2
    ctx.beginPath()

    data.forEach((candle, i) => {
      const x = xScale(i)
      const y = yScale(candle.close)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  }

  function drawArea(ctx, data, xScale, yScale, chartHeight, margin) {
    const isUp = data[data.length - 1].close >= data[0].close
    const color = isUp ? '16, 185, 129' : '239, 68, 68'

    // Draw fill
    ctx.beginPath()
    data.forEach((candle, i) => {
      const x = xScale(i)
      const y = yScale(candle.close)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.lineTo(xScale(data.length - 1), chartHeight - margin.bottom)
    ctx.lineTo(xScale(0), chartHeight - margin.bottom)
    ctx.closePath()

    const gradient = ctx.createLinearGradient(0, margin.top, 0, chartHeight - margin.bottom)
    gradient.addColorStop(0, `rgba(${color}, 0.4)`)
    gradient.addColorStop(1, `rgba(${color}, 0)`)
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw line on top
    ctx.strokeStyle = `rgb(${color})`
    ctx.lineWidth = 2
    ctx.beginPath()
    data.forEach((candle, i) => {
      const x = xScale(i)
      const y = yScale(candle.close)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  }

  const latestCandle = data?.[data.length - 1]
  const firstCandle = data?.[0]
  const change = latestCandle && firstCandle
    ? ((latestCandle.close - firstCandle.close) / firstCandle.close * 100)
    : 0

  return (
    <div className="chart-container">
      {/* Chart Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-white">{symbol}</span>
          {latestCandle && (
            <>
              <span className="text-xl font-semibold">${latestCandle.close?.toFixed(2)}</span>
              <span className={`text-sm font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)}%
              </span>
            </>
          )}
        </div>

        {/* Chart Type Selector */}
        <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
          {[
            { type: 'candle', icon: '📊' },
            { type: 'line', icon: '📈' },
            { type: 'area', icon: '📉' },
          ].map(({ type, icon }) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`px-3 py-1 rounded text-sm transition-all ${
                chartType === type
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* OHLC Info Bar */}
      {latestCandle && (
        <div className="flex gap-6 px-4 py-2 text-xs border-b border-slate-800 bg-slate-900/50">
          <span><span className="text-slate-500">O</span> <span className="text-slate-300">{latestCandle.open?.toFixed(2)}</span></span>
          <span><span className="text-slate-500">H</span> <span className="text-emerald-400">{latestCandle.high?.toFixed(2)}</span></span>
          <span><span className="text-slate-500">L</span> <span className="text-red-400">{latestCandle.low?.toFixed(2)}</span></span>
          <span><span className="text-slate-500">C</span> <span className="text-slate-300">{latestCandle.close?.toFixed(2)}</span></span>
          <span><span className="text-slate-500">Vol</span> <span className="text-slate-300">{((latestCandle.volume || 0) / 1000000).toFixed(2)}M</span></span>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: `${height}px` }}
        className="cursor-crosshair"
      />
    </div>
  )
}
