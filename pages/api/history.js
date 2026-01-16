// Historical price data API - Uses Yahoo Finance

import { getYahooData } from '../../lib/yahoo'

export default async function handler(req, res) {
  const { symbol, days = '90', interval = '1d' } = req.query

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' })
  }

  try {
    const numDays = parseInt(days)

    // Determine range based on days requested
    let range = '6mo'
    if (numDays <= 5) range = '5d'
    else if (numDays <= 7) range = '5d'
    else if (numDays <= 30) range = '1mo'
    else if (numDays <= 90) range = '3mo'
    else if (numDays <= 180) range = '6mo'
    else if (numDays <= 365) range = '1y'
    else if (numDays <= 730) range = '2y'
    else if (numDays <= 1825) range = '5y'
    else range = 'max'

    // Map interval parameter to Yahoo Finance interval
    let yahooInterval = '1d'
    if (interval === '1wk' || interval === 'weekly') yahooInterval = '1wk'
    else if (interval === '1mo' || interval === 'monthly') yahooInterval = '1mo'
    else yahooInterval = '1d'

    const data = await getYahooData(symbol.toUpperCase(), range, yahooInterval)

    if (data && data.bars && data.bars.length > 0) {
      // For weekly/monthly data, we take all available bars
      // For daily data, we limit to the requested number of days
      let bars = data.bars
      if (yahooInterval === '1d' && bars.length > numDays) {
        bars = bars.slice(-numDays)
      }

      const history = bars.map(bar => ({
        date: bar.t.split('T')[0],
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: bar.v,
      }))

      res.status(200).json({
        symbol: symbol.toUpperCase(),
        history,
        interval: yahooInterval,
        range
      })
    } else {
      res.status(404).json({ error: 'No historical data found' })
    }
  } catch (error) {
    console.error('History API Error:', error)
    res.status(500).json({ error: 'Failed to fetch historical data: ' + error.message })
  }
}
