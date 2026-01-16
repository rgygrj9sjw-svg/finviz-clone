// ICT Analysis API - Uses Alpaca for real OHLC data

import { getDailyBars, getWeeklyBars, getLatestTrade } from '../../lib/alpaca'
import { runFullICTAnalysis } from '../../lib/ict'

export default async function handler(req, res) {
  const { symbol } = req.query

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' })
  }

  try {
    // Fetch all required data from Alpaca
    const [dailyBars, weeklyBars, latestTrade] = await Promise.all([
      getDailyBars(symbol.toUpperCase(), 100),
      getWeeklyBars(symbol.toUpperCase(), 50),
      getLatestTrade(symbol.toUpperCase()),
    ])

    if (!dailyBars || dailyBars.length === 0) {
      return res.status(404).json({ error: 'No data found for symbol' })
    }

    // Format bars for ICT analysis
    const formatBars = (bars) => bars.map(bar => ({
      t: bar.t,
      o: bar.o,
      h: bar.h,
      l: bar.l,
      c: bar.c,
      v: bar.v,
    }))

    const formattedDaily = formatBars(dailyBars)
    const formattedWeekly = formatBars(weeklyBars)
    const currentPrice = latestTrade?.p || formattedDaily[formattedDaily.length - 1]?.c

    // Run full ICT analysis
    const analysis = runFullICTAnalysis(formattedDaily, formattedWeekly, currentPrice)
    analysis.ticker = symbol.toUpperCase()

    res.status(200).json(analysis)
  } catch (error) {
    console.error('ICT Analysis Error:', error)
    res.status(500).json({ error: 'Failed to run ICT analysis: ' + error.message })
  }
}
