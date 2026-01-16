// ICT Analysis API - Uses Yahoo Finance for free OHLC data

import { getDailyBars, getWeeklyBars, getCurrentQuote } from '../../lib/yahoo'
import { runFullICTAnalysis } from '../../lib/ict'

export default async function handler(req, res) {
  const { symbol } = req.query

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' })
  }

  try {
    // Fetch all required data from Yahoo Finance
    const [dailyBars, weeklyBars, quote] = await Promise.all([
      getDailyBars(symbol.toUpperCase(), 100),
      getWeeklyBars(symbol.toUpperCase(), 50),
      getCurrentQuote(symbol.toUpperCase()),
    ])

    if (!dailyBars || dailyBars.length === 0) {
      return res.status(404).json({ error: 'No data found for symbol' })
    }

    const currentPrice = quote?.price || dailyBars[dailyBars.length - 1]?.c

    // Run full ICT analysis
    const analysis = runFullICTAnalysis(dailyBars, weeklyBars, currentPrice)
    analysis.ticker = symbol.toUpperCase()
    analysis.quote = quote

    res.status(200).json(analysis)
  } catch (error) {
    console.error('ICT Analysis Error:', error)
    res.status(500).json({ error: 'Failed to run ICT analysis: ' + error.message })
  }
}
