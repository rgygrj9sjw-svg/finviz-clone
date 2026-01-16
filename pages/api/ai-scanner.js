// AI Scanner API - Scans multiple stocks to find the best setups
import { getYahooData } from '../../lib/yahoo'

// Stocks to scan
const SCAN_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V', 'XOM',
  'UNH', 'JNJ', 'WMT', 'PG', 'MA', 'HD', 'CVX', 'MRK', 'ABBV', 'PEP',
  'KO', 'COST', 'AVGO', 'TMO', 'MCD', 'CSCO', 'ACN', 'ABT', 'DHR', 'NEE'
]

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { query } = req.body
  const searchQuery = query?.toLowerCase() || 'bullish fvg'

  try {
    // Parse query for limit
    const limitMatch = searchQuery.match(/(\d+)/)
    const limit = limitMatch ? parseInt(limitMatch[1]) : 10

    // Determine what patterns to search for
    const searchFVG = searchQuery.includes('fvg') || searchQuery.includes('fair value') || searchQuery.includes('gap')
    const searchOB = searchQuery.includes('order block') || searchQuery.includes('ob')
    const searchSweep = searchQuery.includes('liquidity') || searchQuery.includes('sweep')
    const searchAll = !searchFVG && !searchOB && !searchSweep

    // Determine direction filter
    const bullishOnly = searchQuery.includes('bullish')
    const bearishOnly = searchQuery.includes('bearish')

    // Fetch data for all stocks in parallel
    const stockDataPromises = SCAN_STOCKS.map(async (symbol) => {
      try {
        const data = await getYahooData(symbol, '3mo', '1d')
        if (data && data.bars && data.bars.length > 0) {
          const bars = data.bars.map(bar => ({
            date: bar.t.split('T')[0],
            open: bar.o,
            high: bar.h,
            low: bar.l,
            close: bar.c,
            volume: bar.v,
          }))
          return { symbol, bars }
        }
        return null
      } catch (e) {
        console.error(`Error fetching ${symbol}:`, e.message)
        return null
      }
    })

    const stocksData = (await Promise.all(stockDataPromises)).filter(Boolean)

    // Find patterns in all stocks
    const allPatterns = []

    for (const { symbol, bars } of stocksData) {
      const latestPrice = bars[bars.length - 1]?.close || 0

      // Find FVGs
      if (searchFVG || searchAll) {
        const fvgs = findFairValueGaps(bars)
        fvgs.forEach(fvg => {
          allPatterns.push({
            symbol,
            type: 'FVG',
            direction: fvg.type,
            date: fvg.date,
            price: fvg.ce,
            low: fvg.low,
            high: fvg.high,
            filled: fvg.filled,
            score: fvg.score,
            latestPrice,
            description: `${fvg.type.toUpperCase()} FVG at $${fvg.low.toFixed(2)} - $${fvg.high.toFixed(2)}`,
          })
        })
      }

      // Find Order Blocks
      if (searchOB || searchAll) {
        const obs = findOrderBlocks(bars)
        obs.forEach(ob => {
          allPatterns.push({
            symbol,
            type: 'Order Block',
            direction: ob.type,
            date: ob.date,
            price: (ob.low + ob.high) / 2,
            low: ob.low,
            high: ob.high,
            score: ob.score,
            latestPrice,
            description: `${ob.type.toUpperCase()} OB at $${ob.low.toFixed(2)} - $${ob.high.toFixed(2)}`,
          })
        })
      }

      // Find Liquidity Sweeps
      if (searchSweep || searchAll) {
        const sweeps = findLiquiditySweeps(bars)
        sweeps.forEach(sweep => {
          allPatterns.push({
            symbol,
            type: 'Liquidity Sweep',
            direction: sweep.type,
            date: sweep.date,
            price: sweep.level,
            score: sweep.score,
            latestPrice,
            description: `${sweep.type.toUpperCase()} sweep at $${sweep.level.toFixed(2)}`,
          })
        })
      }
    }

    // Filter by direction
    let filteredPatterns = allPatterns
    if (bullishOnly) {
      filteredPatterns = allPatterns.filter(p => p.direction === 'bullish')
    } else if (bearishOnly) {
      filteredPatterns = allPatterns.filter(p => p.direction === 'bearish')
    }

    // Sort by score
    filteredPatterns.sort((a, b) => (b.score || 0) - (a.score || 0))

    // Get best pattern per stock (unique stocks)
    const seenStocks = new Set()
    const uniqueStockPatterns = []
    for (const pattern of filteredPatterns) {
      if (!seenStocks.has(pattern.symbol)) {
        seenStocks.add(pattern.symbol)
        uniqueStockPatterns.push(pattern)
      }
    }

    // Return top N unique stocks
    const topPatterns = uniqueStockPatterns.slice(0, limit)

    // Generate summary
    const bullishCount = topPatterns.filter(p => p.direction === 'bullish').length
    const bearishCount = topPatterns.filter(p => p.direction === 'bearish').length
    const stocksScanned = stocksData.length
    const patternsFound = filteredPatterns.length

    res.status(200).json({
      query: searchQuery,
      stocksScanned,
      totalPatternsFound: patternsFound,
      results: topPatterns,
      summary: `Scanned ${stocksScanned} stocks. Found ${patternsFound} patterns matching "${query}". Showing top ${topPatterns.length} results (${bullishCount} bullish, ${bearishCount} bearish).`
    })

  } catch (error) {
    console.error('AI Scanner Error:', error)
    res.status(500).json({ error: 'Failed to scan stocks: ' + error.message })
  }
}

// Pattern detection functions (same as ai-chart-analysis.js)

function findFairValueGaps(bars) {
  const fvgs = []

  for (let i = 2; i < bars.length; i++) {
    const prev = bars[i - 2]
    const current = bars[i - 1]
    const next = bars[i]

    // Bullish FVG: gap between bar1 high and bar3 low
    if (prev.high < next.low) {
      const gapLow = prev.high
      const gapHigh = next.low
      const ce = (gapLow + gapHigh) / 2

      let filled = false
      for (let j = i; j < bars.length; j++) {
        if (bars[j].low <= ce) {
          filled = true
          break
        }
      }

      const avgRange = bars.slice(Math.max(0, i - 20), i).reduce((sum, b) => sum + (b.high - b.low), 0) / 20
      const gapSize = gapHigh - gapLow
      const score = Math.min(100, (gapSize / avgRange) * 50 + (filled ? 0 : 30))

      fvgs.push({
        type: 'bullish',
        date: current.date,
        low: gapLow,
        high: gapHigh,
        ce,
        filled,
        score,
      })
    }

    // Bearish FVG
    if (next.high < prev.low) {
      const gapLow = next.high
      const gapHigh = prev.low
      const ce = (gapLow + gapHigh) / 2

      let filled = false
      for (let j = i; j < bars.length; j++) {
        if (bars[j].high >= ce) {
          filled = true
          break
        }
      }

      const avgRange = bars.slice(Math.max(0, i - 20), i).reduce((sum, b) => sum + (b.high - b.low), 0) / 20
      const gapSize = gapHigh - gapLow
      const score = Math.min(100, (gapSize / avgRange) * 50 + (filled ? 0 : 30))

      fvgs.push({
        type: 'bearish',
        date: current.date,
        low: gapLow,
        high: gapHigh,
        ce,
        filled,
        score,
      })
    }
  }

  return fvgs
}

function findOrderBlocks(bars) {
  const orderBlocks = []

  for (let i = 1; i < bars.length - 1; i++) {
    const current = bars[i]
    const next = bars[i + 1]

    // Bullish OB
    if (current.close < current.open) {
      if (next.close > current.high) {
        const displacement = ((next.close - current.high) / current.high) * 100
        if (displacement > 0.5) {
          orderBlocks.push({
            type: 'bullish',
            date: current.date,
            low: current.low,
            high: current.high,
            score: Math.min(100, displacement * 20),
          })
        }
      }
    }

    // Bearish OB
    if (current.close > current.open) {
      if (next.close < current.low) {
        const displacement = ((current.low - next.close) / current.low) * 100
        if (displacement > 0.5) {
          orderBlocks.push({
            type: 'bearish',
            date: current.date,
            low: current.low,
            high: current.high,
            score: Math.min(100, displacement * 20),
          })
        }
      }
    }
  }

  return orderBlocks
}

function findLiquiditySweeps(bars) {
  const sweeps = []

  for (let i = 10; i < bars.length - 1; i++) {
    const lookback = bars.slice(i - 10, i)
    const current = bars[i]
    const next = bars[i + 1]

    const swingHigh = Math.max(...lookback.map(b => b.high))
    const swingLow = Math.min(...lookback.map(b => b.low))

    // Bullish sweep
    if (current.low < swingLow && next.close > current.close && next.close > swingLow) {
      sweeps.push({
        type: 'bullish',
        date: current.date,
        level: swingLow,
        score: 80,
      })
    }

    // Bearish sweep
    if (current.high > swingHigh && next.close < current.close && next.close < swingHigh) {
      sweeps.push({
        type: 'bearish',
        date: current.date,
        level: swingHigh,
        score: 80,
      })
    }
  }

  return sweeps
}
