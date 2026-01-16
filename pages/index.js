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

  // Stats
  const gainers = stocks.filter(s => s.changePercent > 0).length
  const losers = stocks.filter(s => s.changePercent < 0).length
  const avgChange = stocks.length
    ? stocks.reduce((sum, s) => sum + (s.changePercent || 0), 0) / stocks.length
    : 0

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Stock Screener</h1>
            <p className="text-slate-400 text-sm">Real-time market data powered by Yahoo Finance</p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <span className="text-xs text-slate-500">Updated: {lastUpdate}</span>
            )}
            <button onClick={fetchStocks} className="btn-primary flex items-center gap-2">
              <span>🔄</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card stat-neutral">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Total Stocks</div>
                <div className="text-3xl font-bold text-white">{stocks.length}</div>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>

          <div className="stat-card stat-up">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Gainers</div>
                <div className="text-3xl font-bold text-emerald-400">{gainers}</div>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </div>

          <div className="stat-card stat-down">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Losers</div>
                <div className="text-3xl font-bold text-red-400">{losers}</div>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📉</span>
              </div>
            </div>
          </div>

          <div className={`stat-card ${avgChange >= 0 ? 'stat-up' : 'stat-down'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Avg Change</div>
                <div className={`text-3xl font-bold ${avgChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
                </div>
              </div>
              <div className={`w-12 h-12 ${avgChange >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'} rounded-xl flex items-center justify-center`}>
                <span className="text-2xl">{avgChange >= 0 ? '🚀' : '⚠️'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Sector</label>
              <select
                value={filters.sector}
                onChange={(e) => setFilters({...filters, sector: e.target.value})}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              >
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Min Price</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                placeholder="$0"
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-24 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Max Price</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                placeholder="Any"
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-24 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Min Change %</label>
              <input
                type="number"
                value={filters.minChange}
                onChange={(e) => setFilters({...filters, minChange: e.target.value})}
                placeholder="Any"
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-24 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <button
              onClick={() => setFilters({ sector: 'All', minPrice: '', maxPrice: '', minChange: '', sortBy: 'changePercent', sortDir: 'desc' })}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Clear filters
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="card p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-400">Loading real-time data...</span>
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-700">
                  <th className="text-left p-4 font-medium text-slate-300">Symbol</th>
                  <th className="text-left p-4 font-medium text-slate-300">Company</th>
                  <th className="text-right p-4 font-medium text-slate-300 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => handleSort('price')}>
                    Price {filters.sortBy === 'price' && (filters.sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-4 font-medium text-slate-300 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => handleSort('changePercent')}>
                    Change % {filters.sortBy === 'changePercent' && (filters.sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-4 font-medium text-slate-300">Change $</th>
                  <th className="text-right p-4 font-medium text-slate-300 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => handleSort('volume')}>
                    Volume {filters.sortBy === 'volume' && (filters.sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-4 font-medium text-slate-300">Sector</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock, i) => (
                  <tr
                    key={stock.symbol}
                    className="border-t border-slate-800 hover:bg-slate-800/50 transition-colors"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <td className="p-4">
                      <span className="font-bold text-blue-400">{stock.symbol}</span>
                    </td>
                    <td className="p-4 text-slate-300">{stock.name}</td>
                    <td className="p-4 text-right font-medium text-white">
                      ${stock.price?.toFixed(2) || '-'}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`badge ${
                        (stock.changePercent || 0) >= 2 ? 'badge-success' :
                        (stock.changePercent || 0) >= 0 ? 'badge-success' :
                        (stock.changePercent || 0) >= -2 ? 'badge-danger' : 'badge-danger'
                      }`}>
                        {stock.changePercent ? `${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%` : '-'}
                      </span>
                    </td>
                    <td className={`p-4 text-right font-medium ${(stock.change || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {stock.change ? `${stock.change >= 0 ? '+' : ''}$${Math.abs(stock.change).toFixed(2)}` : '-'}
                    </td>
                    <td className="p-4 text-right text-slate-400">{formatNumber(stock.volume)}</td>
                    <td className="p-4">
                      <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                        {stock.sector}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-slate-500">
          {filteredStocks.length} stocks found
          {stocks.length === 0 && !loading && ' • Waiting for data...'}
        </p>
      </div>
    </Layout>
  )
}
