// Historical price data API - Uses Yahoo Finance

import { getYahooData } from '../../lib/yahoo'

export default async function handler(req, res) {
  const { symbol, days = '90' } = req.query

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' })
  }

  try {
    const numDays = parseInt(days)

    // Determine range based on days requested
    let range = '6mo'
    if (numDays <= 7) range = '5d'
    else if (numDays <= 30) range = '1mo'
    else if (numDays <= 90) range = '3mo'
    else if (numDays <= 180) range = '6mo'
    else if (numDays <= 365) range = '1y'
    else range = '2y'

    const data = await getYahooData(symbol.toUpperCase(), range, '1d')

    if (data && data.bars && data.bars.length > 0) {
      const history = data.bars.slice(-numDays).map(bar => ({
        date: bar.t.split('T')[0],
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: bar.v,
      }))

      res.status(200).json({ symbol: symbol.toUpperCase(), history })
    } else {
      res.status(404).json({ error: 'No historical data found' })
    }
  } catch (error) {
    console.error('History API Error:', error)
    res.status(500).json({ error: 'Failed to fetch historical data: ' + error.message })
  }
}
