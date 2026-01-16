// Alpaca Bars API - Real OHLC data

import { getDailyBars, getWeeklyBars, getMonthlyBars, getIntradayBars } from '../../lib/alpaca'

export default async function handler(req, res) {
  const { symbol, timeframe = 'daily', limit = 100 } = req.query

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' })
  }

  try {
    let bars

    switch (timeframe.toLowerCase()) {
      case 'daily':
      case '1d':
        bars = await getDailyBars(symbol.toUpperCase(), parseInt(limit))
        break
      case 'weekly':
      case '1w':
        bars = await getWeeklyBars(symbol.toUpperCase(), parseInt(limit))
        break
      case 'monthly':
      case '1m':
        bars = await getMonthlyBars(symbol.toUpperCase(), parseInt(limit))
        break
      case 'intraday':
      case '5min':
        bars = await getIntradayBars(symbol.toUpperCase(), '5Min')
        break
      default:
        bars = await getDailyBars(symbol.toUpperCase(), parseInt(limit))
    }

    if (!bars || bars.length === 0) {
      return res.status(404).json({ error: 'No data found' })
    }

    // Format for frontend
    const formatted = bars.map(bar => ({
      date: bar.t,
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    }))

    res.status(200).json({
      symbol: symbol.toUpperCase(),
      timeframe,
      bars: formatted,
    })
  } catch (error) {
    console.error('Alpaca Bars Error:', error)
    res.status(500).json({ error: 'Failed to fetch bars: ' + error.message })
  }
}
