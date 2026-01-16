import { useState, useEffect } from 'react'
import Layout from '../components/Layout'

const SECTORS = ['All', 'Technology', 'Consumer Cyclical', 'Financial', 'Healthcare', 'Energy', 'Consumer Defensive', 'Industrials']

export default function Screener() {
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [filters, setFilters] = useState({
    sector: 'All',
    minPrice: '',
    maxPrice: '',
    minChange: '',
    sortBy: 'changePercent',
    sortDir: 'desc'
  })

  const fetchStocks = async () => {
    try {
      const res = await fetch('/api/stocks')
      const data = await res.json()
      if (data.stocks) {
        setStocks(data.stocks)
        setLastUpdate(new Date().toLocaleTimeString())
      }
    } catch (error) {
      console.error('Failed to fetch stocks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStocks()
    // Refresh every 60 seconds
    const interval = setInterval(fetchStocks, 60000)
    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num) => {
    if (!num) return '-'
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
      const aVal = a[filters.sortBy] || 0
      const bVal = b[filters.sortBy] || 0
      return (aVal - bVal) * dir
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
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Stock Screener</h1>
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <span className="text-xs text-gray-500">Updated: {lastUpdate}</span>
            )}
            <button
              onClick={fetchStocks}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              Refresh
            </button>
          </div>
        </div>

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
        {loading ? (
          <div className="bg-gray-900 rounded-lg p-8 text-center">
            <div className="animate-pulse text-gray-400">Loading real-time data...</div>
          </div>
        ) : (
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
                  <th className="text-right p-3 font-medium">Change $</th>
                  <th className="text-right p-3 font-medium cursor-pointer hover:text-green-400" onClick={() => handleSort('volume')}>
                    Volume {filters.sortBy === 'volume' && (filters.sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 font-medium">High</th>
                  <th className="text-right p-3 font-medium">Low</th>
                  <th className="text-left p-3 font-medium">Sector</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map(stock => (
                  <tr key={stock.symbol} className="border-t border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 font-medium text-blue-400">{stock.symbol}</td>
                    <td className="p-3 text-gray-300">{stock.name}</td>
                    <td className="p-3 text-right font-medium">${stock.price?.toFixed(2) || '-'}</td>
                    <td className={`p-3 text-right font-medium ${(stock.changePercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stock.changePercent ? `${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%` : '-'}
                    </td>
                    <td className={`p-3 text-right ${(stock.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stock.change ? `${stock.change >= 0 ? '+' : ''}$${stock.change.toFixed(2)}` : '-'}
                    </td>
                    <td className="p-3 text-right text-gray-300">{formatNumber(stock.volume)}</td>
                    <td className="p-3 text-right text-gray-300">${stock.high?.toFixed(2) || '-'}</td>
                    <td className="p-3 text-right text-gray-300">${stock.low?.toFixed(2) || '-'}</td>
                    <td className="p-3 text-gray-400">{stock.sector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-2">
          {filteredStocks.length} stocks found
          {stocks.length === 0 && !loading && ' • Add API keys to .env.local for real data'}
        </p>
      </div>
    </Layout>
  )
}
