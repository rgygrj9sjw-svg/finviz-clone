import { useEffect, useRef, useState } from 'react'
import { createChart, CrosshairMode } from 'lightweight-charts'

export default function TradingChart({ data, symbol, height = 500, onAIAnalysis }) {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const candlestickSeriesRef = useRef(null)
  const volumeSeriesRef = useRef(null)
  const [drawings, setDrawings] = useState([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingMode, setDrawingMode] = useState(null) // 'line', 'horizontal', 'ray'
  const [startPoint, setStartPoint] = useState(null)
  const [currentLine, setCurrentLine] = useState(null)
  const linesRef = useRef([])

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

    volumeSeriesRef.current = volumeSeries

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
    redrawLines()

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [data, height])

  // Redraw lines when drawings change
  const redrawLines = () => {
    // Clear existing line series
    linesRef.current.forEach(line => {
      if (chartRef.current) {
        try {
          chartRef.current.removeSeries(line)
        } catch (e) {}
      }
    })
    linesRef.current = []

    // Redraw all saved drawings
    drawings.forEach(drawing => {
      if (chartRef.current) {
        const lineSeries = chartRef.current.addLineSeries({
          color: drawing.color || '#f59e0b',
          lineWidth: 2,
          lineStyle: 0,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        })

        lineSeries.setData([
          { time: drawing.start.time, value: drawing.start.price },
          { time: drawing.end.time, value: drawing.end.price },
        ])

        linesRef.current.push(lineSeries)
      }
    })
  }

  useEffect(() => {
    if (chartRef.current && drawings.length >= 0) {
      redrawLines()
    }
  }, [drawings])

  // Handle chart click for drawing
  const handleChartClick = (e) => {
    if (!drawingMode || !chartRef.current || !candlestickSeriesRef.current) return

    const rect = chartContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const timeScale = chartRef.current.timeScale()
    const priceScale = candlestickSeriesRef.current.priceScale()

    // Get logical coordinates
    const time = timeScale.coordinateToTime(x)
    const price = candlestickSeriesRef.current.coordinateToPrice(y)

    if (!time || !price) return

    if (!startPoint) {
      // First click - set start point
      setStartPoint({ time, price })
    } else {
      // Second click - complete the line
      const newDrawing = {
        id: Date.now(),
        type: drawingMode,
        start: startPoint,
        end: { time, price },
        color: '#f59e0b',
      }

      setDrawings(prev => [...prev, newDrawing])
      setStartPoint(null)
      setDrawingMode(null)
      setIsDrawing(false)
    }
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

  // Get latest candle info
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
              <span className="text-xl font-semibold text-white">${latestCandle.close?.toFixed(2)}</span>
              <span className={`text-sm font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)}%
              </span>
            </>
          )}
        </div>

        {/* Drawing Tools */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => { setDrawingMode('line'); setIsDrawing(true); setStartPoint(null); }}
              className={`px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1 ${
                drawingMode === 'line'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title="Trend Line"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20l16-16" />
              </svg>
              Line
            </button>
            <button
              onClick={() => { setDrawingMode('horizontal'); setIsDrawing(true); setStartPoint(null); }}
              className={`px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1 ${
                drawingMode === 'horizontal'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title="Horizontal Line"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />
              </svg>
              H-Line
            </button>
          </div>

          {drawings.length > 0 && (
            <button
              onClick={clearAllDrawings}
              className="px-3 py-1.5 rounded text-sm bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-all"
              title="Clear All Drawings"
            >
              Clear All
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

      {/* Drawing Mode Indicator */}
      {isDrawing && (
        <div className="bg-amber-600/20 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between">
          <span className="text-amber-400 text-sm">
            {startPoint ? 'Click to set end point' : 'Click to set start point'} for {drawingMode} drawing
          </span>
          <button
            onClick={() => { setIsDrawing(false); setDrawingMode(null); setStartPoint(null); }}
            className="text-amber-400 hover:text-amber-300 text-sm"
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
        className={`cursor-${isDrawing ? 'crosshair' : 'default'}`}
      />

      {/* Drawings List */}
      {drawings.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Saved Drawings ({drawings.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {drawings.map((drawing, i) => (
              <div
                key={drawing.id}
                className="flex items-center gap-2 bg-slate-800 rounded px-2 py-1 text-xs"
              >
                <span className="text-amber-400">Line {i + 1}</span>
                <span className="text-slate-500">${drawing.start.price?.toFixed(2)} → ${drawing.end.price?.toFixed(2)}</span>
                <button
                  onClick={() => deleteDrawing(drawing.id)}
                  className="text-red-400 hover:text-red-300 ml-1"
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
