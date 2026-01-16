// Alpaca API Integration for real OHLC data

const ALPACA_BASE_URL = 'https://data.alpaca.markets/v2'

async function alpacaFetch(endpoint) {
  const apiKey = process.env.ALPACA_API_KEY
  const secretKey = process.env.ALPACA_SECRET_KEY

  if (!apiKey || !secretKey) {
    throw new Error('Alpaca API credentials not configured')
  }

  const res = await fetch(`${ALPACA_BASE_URL}${endpoint}`, {
    headers: {
      'APCA-API-KEY-ID': apiKey,
      'APCA-API-SECRET-KEY': secretKey,
    },
  })

  if (!res.ok) {
    throw new Error(`Alpaca API error: ${res.status}`)
  }

  return res.json()
}

// Get daily bars
export async function getDailyBars(symbol, limit = 100) {
  const end = new Date().toISOString()
  const start = new Date(Date.now() - limit * 2 * 24 * 60 * 60 * 1000).toISOString()

  const data = await alpacaFetch(
    `/stocks/${symbol}/bars?timeframe=1Day&start=${start}&end=${end}&limit=${limit}`
  )

  return data.bars || []
}

// Get weekly bars
export async function getWeeklyBars(symbol, limit = 50) {
  const end = new Date().toISOString()
  const start = new Date(Date.now() - limit * 10 * 24 * 60 * 60 * 1000).toISOString()

  const data = await alpacaFetch(
    `/stocks/${symbol}/bars?timeframe=1Week&start=${start}&end=${end}&limit=${limit}`
  )

  return data.bars || []
}

// Get monthly bars (for aggregating into quarterly/yearly)
export async function getMonthlyBars(symbol, months = 120) {
  const end = new Date().toISOString()
  const start = new Date(Date.now() - months * 35 * 24 * 60 * 60 * 1000).toISOString()

  const data = await alpacaFetch(
    `/stocks/${symbol}/bars?timeframe=1Month&start=${start}&end=${end}&limit=${months}`
  )

  return data.bars || []
}

// Get latest quote
export async function getLatestQuote(symbol) {
  const data = await alpacaFetch(`/stocks/${symbol}/quotes/latest`)
  return data.quote || null
}

// Get latest trade
export async function getLatestTrade(symbol) {
  const data = await alpacaFetch(`/stocks/${symbol}/trades/latest`)
  return data.trade || null
}

// Get multiple symbols quotes
export async function getMultipleQuotes(symbols) {
  const symbolList = symbols.join(',')
  const data = await alpacaFetch(`/stocks/quotes/latest?symbols=${symbolList}`)
  return data.quotes || {}
}

// Get intraday bars (for same-day analysis)
export async function getIntradayBars(symbol, timeframe = '5Min') {
  const end = new Date().toISOString()
  const start = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const data = await alpacaFetch(
    `/stocks/${symbol}/bars?timeframe=${timeframe}&start=${start}&end=${end}`
  )

  return data.bars || []
}

// Aggregate monthly bars into quarterly
export function aggregateToQuarterly(monthlyBars) {
  const quarters = []
  for (let i = 0; i < monthlyBars.length; i += 3) {
    const quarterBars = monthlyBars.slice(i, i + 3)
    if (quarterBars.length === 3) {
      quarters.push({
        t: quarterBars[0].t,
        o: quarterBars[0].o,
        h: Math.max(...quarterBars.map(b => b.h)),
        l: Math.min(...quarterBars.map(b => b.l)),
        c: quarterBars[2].c,
        v: quarterBars.reduce((sum, b) => sum + b.v, 0),
      })
    }
  }
  return quarters
}

// Aggregate monthly bars into semi-annual (6M)
export function aggregateToSemiAnnual(monthlyBars) {
  const periods = []
  for (let i = 0; i < monthlyBars.length; i += 6) {
    const periodBars = monthlyBars.slice(i, i + 6)
    if (periodBars.length === 6) {
      periods.push({
        t: periodBars[0].t,
        o: periodBars[0].o,
        h: Math.max(...periodBars.map(b => b.h)),
        l: Math.min(...periodBars.map(b => b.l)),
        c: periodBars[5].c,
        v: periodBars.reduce((sum, b) => sum + b.v, 0),
      })
    }
  }
  return periods
}

// Aggregate monthly bars into yearly
export function aggregateToYearly(monthlyBars) {
  const years = []
  for (let i = 0; i < monthlyBars.length; i += 12) {
    const yearBars = monthlyBars.slice(i, i + 12)
    if (yearBars.length === 12) {
      years.push({
        t: yearBars[0].t,
        o: yearBars[0].o,
        h: Math.max(...yearBars.map(b => b.h)),
        l: Math.min(...yearBars.map(b => b.l)),
        c: yearBars[11].c,
        v: yearBars.reduce((sum, b) => sum + b.v, 0),
      })
    }
  }
  return years
}
