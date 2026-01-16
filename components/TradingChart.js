import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, CrosshairMode } from 'lightweight-charts'

// Fibonacci levels
const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
const FIB_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ef4444']

export default function TradingChart({ data, symbol, height = 500, onAIAnalysis }) {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const candlestickSeriesRef = useRef(null)
  const [drawings, setDrawings] = useState([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingMode, setDrawingMode] = useState(null)
  const [startPoint, setStartPoint] = useState(null)
  const [textInput, setTextInput] = useState('')
  const [showTextModal, setShowTextModal] = useState(false)
  const [pendingTextPoint, setPendingTextPoint] = useState(null)
  const linesRef = useRef([])
  const markersRef = useRef([])

  // Drawing tools configuration
  const drawingTools = [
    { id: 'line', icon: '📏', label: 'Trend Line', description: 'Draw diagonal trend lines' },
    { id: 'horizontal', icon: '➖', label: 'H-Line', description: 'Horizontal price level' },
    { id: 'vertical', icon: '|', label: 'V-Line', description: 'Vertical time marker' },
    { id: 'ray', icon: '↗️', label: 'Ray', description: 'Line extending to infinity' },
    { id: 'fib', icon: '🔢', label: 'Fibonacci', description: 'Fibonacci retracement levels' },
    { id: 'rect', icon: '⬜', label: 'Rectangle', description: 'Price zone box' },
    { id: 'range', icon: '📊', label: 'Price Range', description: 'Measure price movement' },
    { id: 'text', icon: '💬', label: 'Text', description: 'Add text annotation' },
  ]

  // Load saved drawings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`drawings_${symbol}`)
    if (saved) {
      try {
        setDrawings(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load drawings:', e)
      }
    }
  }, [symbol])

  // Save drawings to localStorage
  useEffect(() => {
    if (drawings.length > 0 || localStorage.getItem(`drawings_${symbol}`)) {
      localStorage.setItem(`drawings_${symbol}`, JSON.stringify(drawings))
    }
  }, [drawings, symbol])

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return

    // Clear previous chart
    if (chartRef.current) {
      chartRef.current.remove()
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: 'solid', color: '#0f172a' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#3b82f6',
          width: 1,
          style: 2,
          labelBackgroundColor: '#3b82f6',
        },
        horzLine: {
          color: '#3b82f6',
          width: 1,
          style: 2,
          labelBackgroundColor: '#3b82f6',
        },
      },
      rightPriceScale: {
        borderColor: '#334155',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    chartRef.current = chart

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    })

    candlestickSeriesRef.current = candlestickSeries

    // Format data for lightweight-charts
    const formattedData = data.map(d => ({
      time: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }))

    candlestickSeries.setData(formattedData)

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#3b82f6',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })

    const volumeData = data.map(d => ({
      time: d.date,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
    }))

    volumeSeries.setData(volumeData)

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)

    // Fit content
    chart.timeScale().fitContent()

    // Redraw saved lines
    redrawAllDrawings()

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [data, height])

  // Redraw all drawings when they change
  const redrawAllDrawings = useCallback(() => {
    if (!chartRef.current) return

    // Clear existing line series
    linesRef.current.forEach(line => {
      try {
        chartRef.current.removeSeries(line)
      } catch (e) {}
    })
    linesRef.current = []

    // Redraw all saved drawings
    drawings.forEach(drawing => {
      switch (drawing.type) {
        case 'line':
        case 'ray':
          drawLine(drawing)
          break
        case 'horizontal':
          drawHorizontalLine(drawing)
          break
        case 'vertical':
          drawVerticalLine(drawing)
          break
        case 'fib':
          drawFibonacci(drawing)
          break
        case 'rect':
          drawRectangle(drawing)
          break
        case 'range':
          drawPriceRange(drawing)
          break
        case 'text':
          // Text is handled via markers
          break
      }
    })

    // Update markers for text annotations
    updateTextMarkers()
  }, [drawings])

  useEffect(() => {
    if (chartRef.current && drawings.length >= 0) {
      redrawAllDrawings()
    }
  }, [drawings, redrawAllDrawings])

  // Drawing functions
  const drawLine = (drawing) => {
    if (!chartRef.current) return

    const lineSeries = chartRef.current.addLineSeries({
      color: drawing.color || '#f59e0b',
      lineWidth: 2,
      lineStyle: 0,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    })

    // For ray, extend the line
    let endTime = drawing.end.time
    let endPrice = drawing.end.price

    if (drawing.type === 'ray' && data.length > 0) {
      const lastDate = data[data.length - 1].date
      const slope = (drawing.end.price - drawing.start.price) /
                   (new Date(drawing.end.time).getTime() - new Date(drawing.start.time).getTime())
      const timeDiff = new Date(lastDate).getTime() - new Date(drawing.start.time).getTime()
      endPrice = drawing.start.price + slope * timeDiff
      endTime = lastDate
    }

    lineSeries.setData([
      { time: drawing.start.time, value: drawing.start.price },
      { time: endTime, value: endPrice },
    ])

    linesRef.current.push(lineSeries)
  }

  const drawHorizontalLine = (drawing) => {
    if (!chartRef.current || !data.length) return

    const lineSeries = chartRef.current.addLineSeries({
      color: drawing.color || '#3b82f6',
      lineWidth: 1,
      lineStyle: 2,
      crosshairMarkerVisible: false,
      lastValueVisible: true,
      priceLineVisible: false,
    })

    lineSeries.setData([
      { time: data[0].date, value: drawing.price },
      { time: data[data.length - 1].date, value: drawing.price },
    ])

    linesRef.current.push(lineSeries)
  }

  const drawVerticalLine = (drawing) => {
    // Vertical lines are drawn as markers on the candlestick series
    if (!candlestickSeriesRef.current) return

    // We'll use a thin line series as a workaround
    const minPrice = Math.min(...data.map(d => d.low))
    const maxPrice = Math.max(...data.map(d => d.high))

    const lineSeries = chartRef.current.addLineSeries({
      color: drawing.color || '#8b5cf6',
      lineWidth: 1,
      lineStyle: 2,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    })

    // Create vertical effect with two points at same time
    lineSeries.setData([
      { time: drawing.time, value: minPrice },
      { time: drawing.time, value: maxPrice },
    ])

    linesRef.current.push(lineSeries)
  }

  const drawFibonacci = (drawing) => {
    if (!chartRef.current || !data.length) return

    const high = Math.max(drawing.start.price, drawing.end.price)
    const low = Math.min(drawing.start.price, drawing.end.price)
    const range = high - low

    FIB_LEVELS.forEach((level, index) => {
      const price = high - (range * level)

      const lineSeries = chartRef.current.addLineSeries({
        color: FIB_COLORS[index],
        lineWidth: 1,
        lineStyle: level === 0.5 ? 0 : 2,
        crosshairMarkerVisible: false,
        lastValueVisible: true,
        priceLineVisible: false,
        title: `${(level * 100).toFixed(1)}%`,
      })

      lineSeries.setData([
        { time: data[0].date, value: price },
        { time: data[data.length - 1].date, value: price },
      ])

      linesRef.current.push(lineSeries)
    })
  }

  const drawRectangle = (drawing) => {
    if (!chartRef.current) return

    // Draw rectangle as 4 lines
    const { start, end, color = '#22c55e' } = drawing

    // Top line
    const topLine = chartRef.current.addLineSeries({
      color,
      lineWidth: 2,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    })
    topLine.setData([
      { time: start.time, value: Math.max(start.price, end.price) },
      { time: end.time, value: Math.max(start.price, end.price) },
    ])
    linesRef.current.push(topLine)

    // Bottom line
    const bottomLine = chartRef.current.addLineSeries({
      color,
      lineWidth: 2,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    })
    bottomLine.setData([
      { time: start.time, value: Math.min(start.price, end.price) },
      { time: end.time, value: Math.min(start.price, end.price) },
    ])
    linesRef.current.push(bottomLine)

    // Left line (approximate with area)
    const leftLine = chartRef.current.addLineSeries({
      color,
      lineWidth: 2,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    })
    leftLine.setData([
      { time: start.time, value: start.price },
      { time: start.time, value: end.price },
    ])
    linesRef.current.push(leftLine)

    // Right line
    const rightLine = chartRef.current.addLineSeries({
      color,
      lineWidth: 2,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    })
    rightLine.setData([
      { time: end.time, value: start.price },
      { time: end.time, value: end.price },
    ])
    linesRef.current.push(rightLine)
  }

  const drawPriceRange = (drawing) => {
    if (!chartRef.current) return

    const { start, end } = drawing
    const priceDiff = end.price - start.price
    const percentChange = ((priceDiff / start.price) * 100).toFixed(2)

    // Draw the range lines
    const lineSeries = chartRef.current.addLineSeries({
      color: priceDiff >= 0 ? '#10b981' : '#ef4444',
      lineWidth: 2,
      lineStyle: 0,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    })

    lineSeries.setData([
      { time: start.time, value: start.price },
      { time: end.time, value: end.price },
    ])

    linesRef.current.push(lineSeries)

    // Horizontal lines at start and end prices
    const startLine = chartRef.current.addLineSeries({
      color: '#64748b',
      lineWidth: 1,
      lineStyle: 2,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    })
    startLine.setData([
      { time: start.time, value: start.price },
      { time: end.time, value: start.price },
    ])
    linesRef.current.push(startLine)

    const endLine = chartRef.current.addLineSeries({
      color: '#64748b',
      lineWidth: 1,
      lineStyle: 2,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    })
    endLine.setData([
      { time: start.time, value: end.price },
      { time: end.time, value: end.price },
    ])
    linesRef.current.push(endLine)
  }

  const updateTextMarkers = () => {
    if (!candlestickSeriesRef.current) return

    const textDrawings = drawings.filter(d => d.type === 'text')
    const markers = textDrawings.map(d => ({
      time: d.time,
      position: 'aboveBar',
      color: d.color || '#f59e0b',
      shape: 'text',
      text: d.text,
    }))

    candlestickSeriesRef.current.setMarkers(markers)
  }

  // Handle chart click for drawing
  const handleChartClick = (e) => {
    if (!drawingMode || !chartRef.current || !candlestickSeriesRef.current) return

    const rect = chartContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const timeScale = chartRef.current.timeScale()
    const time = timeScale.coordinateToTime(x)
    const price = candlestickSeriesRef.current.coordinateToPrice(y)

    if (!time || !price) return

    // Handle text annotation separately
    if (drawingMode === 'text') {
      setPendingTextPoint({ time, price })
      setShowTextModal(true)
      return
    }

    // Handle vertical line (only needs one click)
    if (drawingMode === 'vertical') {
      const newDrawing = {
        id: Date.now(),
        type: 'vertical',
        time,
        color: '#8b5cf6',
      }
      setDrawings(prev => [...prev, newDrawing])
      setDrawingMode(null)
      setIsDrawing(false)
      return
    }

    // Handle horizontal line (only needs one click)
    if (drawingMode === 'horizontal') {
      const newDrawing = {
        id: Date.now(),
        type: 'horizontal',
        price,
        color: '#3b82f6',
      }
      setDrawings(prev => [...prev, newDrawing])
      setDrawingMode(null)
      setIsDrawing(false)
      return
    }

    // Two-click drawings
    if (!startPoint) {
      setStartPoint({ time, price })
    } else {
      const newDrawing = {
        id: Date.now(),
        type: drawingMode,
        start: startPoint,
        end: { time, price },
        color: getDrawingColor(drawingMode),
      }

      setDrawings(prev => [...prev, newDrawing])
      setStartPoint(null)
      setDrawingMode(null)
      setIsDrawing(false)
    }
  }

  const getDrawingColor = (type) => {
    const colors = {
      line: '#f59e0b',
      ray: '#f97316',
      fib: '#8b5cf6',
      rect: '#22c55e',
      range: '#3b82f6',
    }
    return colors[type] || '#f59e0b'
  }

  // Handle text submission
  const handleTextSubmit = () => {
    if (!textInput.trim() || !pendingTextPoint) return

    const newDrawing = {
      id: Date.now(),
      type: 'text',
      time: pendingTextPoint.time,
      price: pendingTextPoint.price,
      text: textInput,
      color: '#f59e0b',
    }

    setDrawings(prev => [...prev, newDrawing])
    setTextInput('')
    setShowTextModal(false)
    setPendingTextPoint(null)
    setDrawingMode(null)
    setIsDrawing(false)
  }

  // Delete a specific drawing
  const deleteDrawing = (id) => {
    setDrawings(prev => prev.filter(d => d.id !== id))
  }

  // Clear all drawings
  const clearAllDrawings = () => {
    setDrawings([])
    localStorage.removeItem(`drawings_${symbol}`)
  }

  // Cancel drawing
  const cancelDrawing = () => {
    setIsDrawing(false)
    setDrawingMode(null)
    setStartPoint(null)
    setShowTextModal(false)
    setPendingTextPoint(null)
  }

  // Get drawing description
  const getDrawingDescription = (drawing) => {
    switch (drawing.type) {
      case 'line':
        return `Line: $${drawing.start.price?.toFixed(2)} → $${drawing.end.price?.toFixed(2)}`
      case 'horizontal':
        return `H-Line: $${drawing.price?.toFixed(2)}`
      case 'vertical':
        return `V-Line: ${drawing.time}`
      case 'ray':
        return `Ray: $${drawing.start.price?.toFixed(2)} → $${drawing.end.price?.toFixed(2)}`
      case 'fib':
        return `Fib: $${Math.min(drawing.start.price, drawing.end.price)?.toFixed(2)} - $${Math.max(drawing.start.price, drawing.end.price)?.toFixed(2)}`
      case 'rect':
        return `Box: $${drawing.start.price?.toFixed(2)} - $${drawing.end.price?.toFixed(2)}`
      case 'range':
        const diff = drawing.end.price - drawing.start.price
        const pct = ((diff / drawing.start.price) * 100).toFixed(2)
        return `Range: ${diff >= 0 ? '+' : ''}$${diff.toFixed(2)} (${pct}%)`
      case 'text':
        return `Text: "${drawing.text}"`
      default:
        return drawing.type
    }
  }

  // Get latest candle info
  const latestCandle = data?.[data.length - 1]
  const firstCandle = data?.[0]
  const change = latestCandle && firstCandle
    ? ((latestCandle.close - firstCandle.close) / firstCandle.close * 100)
    : 0

  return (
    <div className="chart-container relative">
      {/* Chart Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-white">{symbol}</span>
          {latestCandle && (
            <>
              <span className="text-xl font-semibold text-white">${latestCandle.close?.toFixed(2)}</span>
              <span className={`text-sm font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)}%
              </span>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {drawings.length > 0 && (
            <button
              onClick={clearAllDrawings}
              className="px-3 py-1.5 rounded text-sm bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-all"
              title="Clear All Drawings"
            >
              Clear All ({drawings.length})
            </button>
          )}

          {onAIAnalysis && (
            <button
              onClick={onAIAnalysis}
              className="px-3 py-1.5 rounded text-sm bg-purple-600 text-white hover:bg-purple-500 transition-all flex items-center gap-1"
            >
              <span>🤖</span>
              AI Analyze
            </button>
          )}
        </div>
      </div>

      {/* Drawing Tools Bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800 bg-slate-900/50 overflow-x-auto">
        <span className="text-xs text-slate-500 mr-2 whitespace-nowrap">Drawing Tools:</span>
        {drawingTools.map(tool => (
          <button
            key={tool.id}
            onClick={() => { setDrawingMode(tool.id); setIsDrawing(true); setStartPoint(null); }}
            className={`px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1 whitespace-nowrap ${
              drawingMode === tool.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title={tool.description}
          >
            <span>{tool.icon}</span>
            <span className="hidden sm:inline">{tool.label}</span>
          </button>
        ))}
      </div>

      {/* Drawing Mode Indicator */}
      {isDrawing && (
        <div className="bg-amber-600/20 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between">
          <span className="text-amber-400 text-sm">
            {drawingMode === 'horizontal' || drawingMode === 'vertical' || drawingMode === 'text'
              ? 'Click on chart to place'
              : startPoint
                ? 'Click to set end point'
                : 'Click to set start point'
            } for {drawingTools.find(t => t.id === drawingMode)?.label || drawingMode}
          </span>
          <button
            onClick={cancelDrawing}
            className="text-amber-400 hover:text-amber-300 text-sm px-2 py-1 bg-amber-600/20 rounded"
          >
            Cancel (ESC)
          </button>
        </div>
      )}

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

      {/* Chart Canvas */}
      <div
        ref={chartContainerRef}
        onClick={handleChartClick}
        className={isDrawing ? 'cursor-crosshair' : 'cursor-default'}
      />

      {/* Text Input Modal */}
      {showTextModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-4 w-80 shadow-xl border border-slate-700">
            <h3 className="text-white font-medium mb-3">Add Text Annotation</h3>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
              placeholder="Enter your text..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none mb-3"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleTextSubmit}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all"
              >
                Add
              </button>
              <button
                onClick={cancelDrawing}
                className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawings List */}
      {drawings.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/50 max-h-32 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Saved Drawings ({drawings.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {drawings.map((drawing) => (
              <div
                key={drawing.id}
                className="flex items-center gap-2 bg-slate-800 rounded px-2 py-1 text-xs group"
              >
                <span className="text-slate-400">{getDrawingDescription(drawing)}</span>
                <button
                  onClick={() => deleteDrawing(drawing.id)}
                  className="text-red-400 hover:text-red-300 opacity-50 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
