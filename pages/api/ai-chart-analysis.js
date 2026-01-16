// AI Chart Analysis API - Finds patterns in price data

export default async function handler(req, res) {
  const { symbol, query, data } = req.body

  if (!data || data.length === 0) {
    return res.status(400).json({ error: 'Price data is required' })
  }

  try {
    const bars = data

    // Default query is to find bullish setups with FVGs
    const searchQuery = query?.toLowerCase() || 'bullish fvg'

    const results = {
      symbol,
      query: searchQuery,
      patterns: [],
      summary: '',
    }

    // Find Fair Value Gaps
    if (searchQuery.includes('fvg') || searchQuery.includes('fair value')) {
      const fvgs = findFairValueGaps(bars)
      results.patterns.push(...fvgs.map(fvg => ({
        type: 'FVG',
        direction: fvg.type,
        date: fvg.date,
        low: fvg.low,
        high: fvg.high,
        ce: fvg.ce,
        filled: fvg.filled,
        score: fvg.score,
        description: `${fvg.type.toUpperCase()} FVG at $${fvg.low.toFixed(2)} - $${fvg.high.toFixed(2)} (CE: $${fvg.ce.toFixed(2)})${fvg.filled ? ' [FILLED]' : ' [UNFILLED]'}`,
      })))
    }

    // Find Order Blocks
    if (searchQuery.includes('order block') || searchQuery.includes('ob')) {
      const obs = findOrderBlocks(bars)
      results.patterns.push(...obs.map(ob => ({
        type: 'Order Block',
        direction: ob.type,
        date: ob.date,
        low: ob.low,
        high: ob.high,
        score: ob.score,
        description: `${ob.type.toUpperCase()} Order Block at $${ob.low.toFixed(2)} - $${ob.high.toFixed(2)}`,
      })))
    }

    // Find Liquidity Sweeps
    if (searchQuery.includes('liquidity') || searchQuery.includes('sweep')) {
      const sweeps = findLiquiditySweeps(bars)
      results.patterns.push(...sweeps.map(sweep => ({
        type: 'Liquidity Sweep',
        direction: sweep.type,
        date: sweep.date,
        level: sweep.level,
        score: sweep.score,
        description: `${sweep.type.toUpperCase()} sweep at $${sweep.level.toFixed(2)}`,
      })))
    }

    // Find Bullish/Bearish setups
    if (searchQuery.includes('bullish')) {
      results.patterns = results.patterns.filter(p => p.direction === 'bullish')
    } else if (searchQuery.includes('bearish')) {
      results.patterns = results.patterns.filter(p => p.direction === 'bearish')
    }

    // Sort by score and limit
    results.patterns.sort((a, b) => (b.score || 0) - (a.score || 0))

    // Limit to top 10
    const match = searchQuery.match(/(\d+)/)
    const limit = match ? parseInt(match[1]) : 10
    results.patterns = results.patterns.slice(0, limit)

    // Generate summary
    const bullishCount = results.patterns.filter(p => p.direction === 'bullish').length
    const bearishCount = results.patterns.filter(p => p.direction === 'bearish').length

    results.summary = `Found ${results.patterns.length} patterns for "${searchQuery}". ${bullishCount} bullish, ${bearishCount} bearish setups identified.`

    res.status(200).json(results)
  } catch (error) {
    console.error('AI Analysis Error:', error)
    res.status(500).json({ error: 'Failed to analyze chart: ' + error.message })
  }
}

// Find Fair Value Gaps in the data
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

      // Check if filled by subsequent price action
      let filled = false
      for (let j = i; j < bars.length; j++) {
        if (bars[j].low <= ce) {
          filled = true
          break
        }
      }

      // Score based on gap size relative to average
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

    // Bearish FVG: gap between bar3 high and bar1 low
    if (next.high < prev.low) {
      const gapLow = next.high
      const gapHigh = prev.low
      const ce = (gapLow + gapHigh) / 2

      // Check if filled
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

// Find Order Blocks
function findOrderBlocks(bars) {
  const orderBlocks = []

  for (let i = 1; i < bars.length - 1; i++) {
    const prev = bars[i - 1]
    const current = bars[i]
    const next = bars[i + 1]

    // Bullish OB: bearish candle followed by strong bullish move
    if (current.close < current.open) { // Current is bearish
      // Check for displacement (next candle closes above current high)
      if (next.close > current.high) {
        const displacement = ((next.close - current.high) / current.high) * 100
        if (displacement > 0.5) { // At least 0.5% displacement
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

    // Bearish OB: bullish candle followed by strong bearish move
    if (current.close > current.open) { // Current is bullish
      // Check for displacement (next candle closes below current low)
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

// Find Liquidity Sweeps
function findLiquiditySweeps(bars) {
  const sweeps = []

  // Look for swing highs/lows that get swept
  for (let i = 10; i < bars.length - 1; i++) {
    const lookback = bars.slice(i - 10, i)
    const current = bars[i]
    const next = bars[i + 1]

    // Find recent swing high
    const swingHigh = Math.max(...lookback.map(b => b.high))
    const swingLow = Math.min(...lookback.map(b => b.low))

    // Bullish sweep: takes out low then reverses up
    if (current.low < swingLow && next.close > current.close && next.close > swingLow) {
      sweeps.push({
        type: 'bullish',
        date: current.date,
        level: swingLow,
        score: 80,
      })
    }

    // Bearish sweep: takes out high then reverses down
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
