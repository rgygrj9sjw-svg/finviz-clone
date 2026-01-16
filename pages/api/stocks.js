// Fetches real-time stock quotes from multiple APIs

const STOCK_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V', 'JNJ',
  'UNH', 'XOM', 'MA', 'HD', 'PG', 'CVX', 'MRK', 'ABBV', 'PFE', 'KO',
  'PEP', 'COST', 'TMO', 'MCD', 'WMT', 'CSCO', 'ACN', 'ABT', 'DHR', 'NKE',
  'LLY', 'ORCL', 'CRM', 'AMD', 'INTC', 'QCOM', 'TXN', 'NEE', 'UPS', 'BA'
]

const SECTOR_MAP = {
  'AAPL': 'Technology', 'MSFT': 'Technology', 'GOOGL': 'Technology', 'NVDA': 'Technology',
  'META': 'Technology', 'ORCL': 'Technology', 'CRM': 'Technology', 'AMD': 'Technology',
  'INTC': 'Technology', 'CSCO': 'Technology', 'QCOM': 'Technology', 'TXN': 'Technology', 'ACN': 'Technology',
  'AMZN': 'Consumer Cyclical', 'TSLA': 'Consumer Cyclical', 'HD': 'Consumer Cyclical',
  'MCD': 'Consumer Cyclical', 'NKE': 'Consumer Cyclical', 'COST': 'Consumer Cyclical', 'WMT': 'Consumer Cyclical',
  'JPM': 'Financial', 'V': 'Financial', 'MA': 'Financial',
  'JNJ': 'Healthcare', 'UNH': 'Healthcare', 'PFE': 'Healthcare', 'MRK': 'Healthcare',
  'ABBV': 'Healthcare', 'LLY': 'Healthcare', 'TMO': 'Healthcare', 'ABT': 'Healthcare', 'DHR': 'Healthcare',
  'XOM': 'Energy', 'CVX': 'Energy', 'NEE': 'Energy',
  'PG': 'Consumer Defensive', 'KO': 'Consumer Defensive', 'PEP': 'Consumer Defensive',
  'UPS': 'Industrials', 'BA': 'Industrials'
}

async function fetchFinnhub(symbol) {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey || apiKey === 'your_finnhub_key_here') return null

  try {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`)
    const data = await res.json()
    if (data.c) {
      return {
        price: data.c,
        change: data.d,
        changePercent: data.dp,
        high: data.h,
        low: data.l,
        open: data.o,
        prevClose: data.pc
      }
    }
  } catch (e) {
    console.error('Finnhub error:', e)
  }
  return null
}

async function fetchAlphaVantage(symbol) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  if (!apiKey || apiKey === 'your_alpha_vantage_key_here') return null

  try {
    const res = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`)
    const data = await res.json()
    const quote = data['Global Quote']
    if (quote && quote['05. price']) {
      return {
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent']?.replace('%', '')),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        open: parseFloat(quote['02. open']),
        prevClose: parseFloat(quote['08. previous close']),
        volume: parseInt(quote['06. volume'])
      }
    }
  } catch (e) {
    console.error('Alpha Vantage error:', e)
  }
  return null
}

async function fetchPolygon(symbol) {
  const apiKey = process.env.POLYGON_API_KEY
  if (!apiKey || apiKey === 'your_polygon_key_here') return null

  try {
    const res = await fetch(`https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?apiKey=${apiKey}`)
    const data = await res.json()
    if (data.results && data.results[0]) {
      const r = data.results[0]
      return {
        price: r.c,
        open: r.o,
        high: r.h,
        low: r.l,
        volume: r.v,
        prevClose: r.c
      }
    }
  } catch (e) {
    console.error('Polygon error:', e)
  }
  return null
}

export default async function handler(req, res) {
  try {
    const stocks = []

    // Fetch data for each symbol (with rate limiting)
    for (const symbol of STOCK_SYMBOLS) {
      let data = await fetchFinnhub(symbol)

      if (!data) {
        data = await fetchAlphaVantage(symbol)
      }

      if (!data) {
        data = await fetchPolygon(symbol)
      }

      if (data) {
        stocks.push({
          symbol,
          name: getCompanyName(symbol),
          sector: SECTOR_MAP[symbol] || 'Other',
          ...data
        })
      }

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 100))
    }

    res.status(200).json({ stocks, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: 'Failed to fetch stock data' })
  }
}

function getCompanyName(symbol) {
  const names = {
    'AAPL': 'Apple Inc.', 'MSFT': 'Microsoft Corp', 'GOOGL': 'Alphabet Inc',
    'AMZN': 'Amazon.com Inc', 'NVDA': 'NVIDIA Corp', 'META': 'Meta Platforms',
    'TSLA': 'Tesla Inc', 'JPM': 'JPMorgan Chase', 'V': 'Visa Inc',
    'JNJ': 'Johnson & Johnson', 'UNH': 'UnitedHealth Group', 'XOM': 'Exxon Mobil',
    'MA': 'Mastercard', 'HD': 'Home Depot', 'PG': 'Procter & Gamble',
    'CVX': 'Chevron Corp', 'MRK': 'Merck & Co', 'ABBV': 'AbbVie Inc',
    'PFE': 'Pfizer Inc', 'KO': 'Coca-Cola Co', 'PEP': 'PepsiCo Inc',
    'COST': 'Costco Wholesale', 'TMO': 'Thermo Fisher', 'MCD': 'McDonalds Corp',
    'WMT': 'Walmart Inc', 'CSCO': 'Cisco Systems', 'ACN': 'Accenture',
    'ABT': 'Abbott Labs', 'DHR': 'Danaher Corp', 'NKE': 'Nike Inc',
    'LLY': 'Eli Lilly', 'ORCL': 'Oracle Corp', 'CRM': 'Salesforce',
    'AMD': 'Advanced Micro Devices', 'INTC': 'Intel Corp', 'QCOM': 'Qualcomm',
    'TXN': 'Texas Instruments', 'NEE': 'NextEra Energy', 'UPS': 'United Parcel Service',
    'BA': 'Boeing Co'
  }
  return names[symbol] || symbol
}
