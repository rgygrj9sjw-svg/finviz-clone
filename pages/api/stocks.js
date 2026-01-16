// Stock quotes API - Uses Yahoo Finance for free real-time data

import { getYahooData } from '../../lib/yahoo'

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

const COMPANY_NAMES = {
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

export default async function handler(req, res) {
  try {
    const stocks = []

    // Fetch data for each symbol
    for (const symbol of STOCK_SYMBOLS) {
      try {
        const data = await getYahooData(symbol, '5d', '1d')

        if (data && data.currentPrice) {
          const lastBar = data.bars[data.bars.length - 1]
          const prevBar = data.bars[data.bars.length - 2]

          stocks.push({
            symbol,
            name: COMPANY_NAMES[symbol] || symbol,
            sector: SECTOR_MAP[symbol] || 'Other',
            price: data.currentPrice,
            previousClose: data.previousClose,
            change: data.currentPrice - data.previousClose,
            changePercent: ((data.currentPrice - data.previousClose) / data.previousClose) * 100,
            high: lastBar?.h,
            low: lastBar?.l,
            open: lastBar?.o,
            volume: lastBar?.v,
          })
        }
      } catch (e) {
        console.error(`Failed to fetch ${symbol}:`, e.message)
      }

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 50))
    }

    res.status(200).json({ stocks, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('Stocks API Error:', error)
    res.status(500).json({ error: 'Failed to fetch stock data' })
  }
}
