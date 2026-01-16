// Fetches historical price data for charts

async function fetchAlphaVantageHistory(symbol, outputsize = 'compact') {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  if (!apiKey || apiKey === 'your_alpha_vantage_key_here') return null

  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputsize}&apikey=${apiKey}`
    )
    const data = await res.json()
    const timeSeries = data['Time Series (Daily)']

    if (timeSeries) {
      return Object.entries(timeSeries).map(([date, values]) => ({
        date,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume'])
      })).reverse()
    }
  } catch (e) {
    console.error('Alpha Vantage history error:', e)
  }
  return null
}

async function fetchPolygonHistory(symbol, days = 90) {
  const apiKey = process.env.POLYGON_API_KEY
  if (!apiKey || apiKey === 'your_polygon_key_here') return null

  try {
    const to = new Date().toISOString().split('T')[0]
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const res = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${from}/${to}?apiKey=${apiKey}`
    )
    const data = await res.json()

    if (data.results) {
      return data.results.map(r => ({
        date: new Date(r.t).toISOString().split('T')[0],
        open: r.o,
        high: r.h,
        low: r.l,
        close: r.c,
        volume: r.v
      }))
    }
  } catch (e) {
    console.error('Polygon history error:', e)
  }
  return null
}

async function fetchFinnhubCandles(symbol, days = 90) {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey || apiKey === 'your_finnhub_key_here') return null

  try {
    const to = Math.floor(Date.now() / 1000)
    const from = to - (days * 24 * 60 * 60)

    const res = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${apiKey}`
    )
    const data = await res.json()

    if (data.s === 'ok' && data.c) {
      return data.t.map((timestamp, i) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        open: data.o[i],
        high: data.h[i],
        low: data.l[i],
        close: data.c[i],
        volume: data.v[i]
      }))
    }
  } catch (e) {
    console.error('Finnhub candles error:', e)
  }
  return null
}

export default async function handler(req, res) {
  const { symbol, days = '90' } = req.query

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' })
  }

  try {
    const numDays = parseInt(days)

    // Try each API in order
    let history = await fetchFinnhubCandles(symbol.toUpperCase(), numDays)

    if (!history) {
      history = await fetchPolygonHistory(symbol.toUpperCase(), numDays)
    }

    if (!history) {
      const outputsize = numDays > 100 ? 'full' : 'compact'
      history = await fetchAlphaVantageHistory(symbol.toUpperCase(), outputsize)
      if (history) {
        history = history.slice(-numDays)
      }
    }

    if (history && history.length > 0) {
      res.status(200).json({ symbol: symbol.toUpperCase(), history })
    } else {
      res.status(404).json({ error: 'No historical data found' })
    }
  } catch (error) {
    console.error('History API Error:', error)
    res.status(500).json({ error: 'Failed to fetch historical data' })
  }
}
