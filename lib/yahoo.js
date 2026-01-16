// Yahoo Finance API - Free stock data

const BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart'

export async function getYahooData(symbol, range = '6mo', interval = '1d') {
  try {
    const url = `${BASE_URL}/${symbol}?range=${range}&interval=${interval}&includePrePost=false`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!res.ok) {
      throw new Error(`Yahoo API error: ${res.status}`)
    }

    const data = await res.json()
    const result = data.chart?.result?.[0]

    if (!result) {
      throw new Error('No data returned')
    }

    const timestamps = result.timestamp || []
    const quotes = result.indicators?.quote?.[0] || {}
    const { open, high, low, close, volume } = quotes

    const bars = timestamps.map((t, i) => ({
      t: new Date(t * 1000).toISOString(),
      o: open?.[i],
      h: high?.[i],
      l: low?.[i],
      c: close?.[i],
      v: volume?.[i],
    })).filter(bar => bar.o && bar.h && bar.l && bar.c) // Filter out null values

    return {
      symbol: result.meta?.symbol,
      currency: result.meta?.currency,
      currentPrice: result.meta?.regularMarketPrice,
      previousClose: result.meta?.previousClose,
      bars,
    }
  } catch (error) {
    console.error('Yahoo Finance error:', error)
    throw error
  }
}

// Get daily bars (last 6 months = ~100 trading days)
export async function getDailyBars(symbol, days = 100) {
  const range = days > 100 ? '1y' : '6mo'
  const data = await getYahooData(symbol, range, '1d')
  return data.bars.slice(-days)
}

// Get weekly bars
export async function getWeeklyBars(symbol, weeks = 50) {
  const data = await getYahooData(symbol, '2y', '1wk')
  return data.bars.slice(-weeks)
}

// Get monthly bars
export async function getMonthlyBars(symbol, months = 60) {
  const data = await getYahooData(symbol, '10y', '1mo')
  return data.bars.slice(-months)
}

// Get current quote
export async function getCurrentQuote(symbol) {
  const data = await getYahooData(symbol, '1d', '1d')
  return {
    price: data.currentPrice,
    previousClose: data.previousClose,
    change: data.currentPrice - data.previousClose,
    changePercent: ((data.currentPrice - data.previousClose) / data.previousClose) * 100,
  }
}

// Get multiple symbols
export async function getMultipleQuotes(symbols) {
  const results = {}

  for (const symbol of symbols) {
    try {
      const quote = await getCurrentQuote(symbol)
      results[symbol] = quote
    } catch (e) {
      console.error(`Failed to get ${symbol}:`, e.message)
    }
  }

  return results
}
