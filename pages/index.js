import { useState, useEffect } from 'react'
import Layout from '../components/Layout'

// Sample stock data - in production, this comes from Supabase
const SAMPLE_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 178.52, change: 2.34, changePercent: 1.33, volume: 52340000, marketCap: 2800000000000, pe: 28.5, sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corp', price: 378.91, change: -1.23, changePercent: -0.32, volume: 21450000, marketCap: 2810000000000, pe: 35.2, sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc', price: 141.80, change: 3.45, changePercent: 2.49, volume: 18900000, marketCap: 1780000000000, pe: 25.1, sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc', price: 178.25, change: 4.12, changePercent: 2.37, volume: 45600000, marketCap: 1850000000000, pe: 78.3, sector: 'Consumer Cyclical' },
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: 495.22, change: 12.34, changePercent: 2.56, volume: 38700000, marketCap: 1220000000000, pe: 65.4, sector: 'Technology' },
  { symbol: 'META', name: 'Meta Platforms', price: 505.95, change: -8.45, changePercent: -1.64, volume: 15200000, marketCap: 1300000000000, pe: 32.1, sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc', price: 248.48, change: -5.67, changePercent: -2.23, volume: 98500000, marketCap: 789000000000, pe: 72.8, sector: 'Consumer Cyclical' },
  { symbol: 'JPM', name: 'JPMorgan Chase', price: 195.46, change: 1.89, changePercent: 0.98, volume: 8900000, marketCap: 565000000000, pe: 11.2, sector: 'Financial' },
  { symbol: 'V', name: 'Visa Inc', price: 279.15, change: 0.45, changePercent: 0.16, volume: 6700000, marketCap: 575000000000, pe: 29.8, sector: 'Financial' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', price: 156.78, change: -0.89, changePercent: -0.56, volume: 7800000, marketCap: 378000000000, pe: 15.6, sector: 'Healthcare' },
  { symbol: 'UNH', name: 'UnitedHealth Group', price: 527.34, change: 5.67, changePercent: 1.09, volume: 3400000, marketCap: 489000000000, pe: 22.4, sector: 'Healthcare' },
  { symbol: 'XOM', name: 'Exxon Mobil', price: 104.56, change: 2.12, changePercent: 2.07, volume: 14500000, marketCap: 418000000000, pe: 9.8, sector: 'Energy' },
]

const SECTORS = ['All', 'Technology', 'Consumer Cyclical', 'Financial', 'Healthcare', 'Energy']

export default function Screener() {
  const [stocks, setStocks] = useState(SAMPLE_STOCKS)
  const [filters, setFilters] = useState({
    sector: 'All',
    minPrice: '',
    maxPrice: '',
    minChange: '',
    sortBy: 'marketCap',
    sortDir: 'desc'
  })

  const formatNumber = (num) => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T'
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
    return num.toLocaleString()
  }

  const filteredStocks = stocks
    .filter(stock => {
      if (filters.sector !== 'All' && stock.sector !== filters.sector) return false
      if (filters.minPrice && stock.price < parseFloat(filters.minPrice)) return false
      if (filters.maxPrice && stock.price > parseFloat(filters.maxPrice)) return false
      if (filters.minChange && stock.changePercent < parseFloat(filters.minChange)) return false
      return true
    })
    .sort((a, b) => {
      const dir = filters.sortDir === 'asc' ? 1 : -1
      return (a[filters.sortBy] - b[filters.sortBy]) * dir
    })

  const handleSort = (column) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortDir: prev.sortBy === column && prev.sortDir === 'desc' ? 'asc' : 'desc'
    }))
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Stock Screener</h1>

        {/* Filters */}
        <div className="bg-gray-900 p-4 rounded-lg mb-4 flex flex-wrap gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Sector</label>
            <select
              value={filters.sector}
              onChange={(e) => setFilters({...filters, sector: e.target.value})}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            >
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Min Price</label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
              placeholder="0"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-24"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Max Price</label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
              placeholder="Any"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-24"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Min Change %</label>
            <input
              type="number"
              value={filters.minChange}
              onChange={(e) => setFilters({...filters, minChange: e.target.value})}
              placeholder="Any"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-24"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800">
              <tr>
                <th className="text-left p-3 font-medium">Symbol</th>
                <th className="text-left p-3 font-medium">Company</th>
                <th className="text-right p-3 font-medium cursor-pointer hover:text-green-400" onClick={() => handleSort('price')}>
                  Price {filters.sortBy === 'price' && (filters.sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-right p-3 font-medium cursor-pointer hover:text-green-400" onClick={() => handleSort('changePercent')}>
                  Change % {filters.sortBy === 'changePercent' && (filters.sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-right p-3 font-medium cursor-pointer hover:text-green-400" onClick={() => handleSort('volume')}>
                  Volume {filters.sortBy === 'volume' && (filters.sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-right p-3 font-medium cursor-pointer hover:text-green-400" onClick={() => handleSort('marketCap')}>
                  Market Cap {filters.sortBy === 'marketCap' && (filters.sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-right p-3 font-medium cursor-pointer hover:text-green-400" onClick={() => handleSort('pe')}>
                  P/E {filters.sortBy === 'pe' && (filters.sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left p-3 font-medium">Sector</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map(stock => (
                <tr key={stock.symbol} className="border-t border-gray-800 hover:bg-gray-800/50">
                  <td className="p-3 font-medium text-blue-400">{stock.symbol}</td>
                  <td className="p-3 text-gray-300">{stock.name}</td>
                  <td className="p-3 text-right">${stock.price.toFixed(2)}</td>
                  <td className={`p-3 text-right font-medium ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </td>
                  <td className="p-3 text-right text-gray-300">{formatNumber(stock.volume)}</td>
                  <td className="p-3 text-right text-gray-300">${formatNumber(stock.marketCap)}</td>
                  <td className="p-3 text-right text-gray-300">{stock.pe.toFixed(1)}</td>
                  <td className="p-3 text-gray-400">{stock.sector}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">{filteredStocks.length} stocks found</p>
      </div>
    </Layout>
  )
}
