import { useState, useEffect } from 'react'
import Layout from '../components/Layout'

export default function HeatMap() {
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSector, setSelectedSector] = useState('All')

  const fetchStocks = async () => {
    try {
      const res = await fetch('/api/stocks')
      const data = await res.json()
      if (data.stocks) {
        setStocks(data.stocks)
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

  // Group stocks by sector
  const sectors = stocks.reduce((acc, stock) => {
    const sector = stock.sector || 'Other'
    if (!acc[sector]) acc[sector] = []
    acc[sector].push(stock)
    return acc
  }, {})

  const sectorNames = ['All', ...Object.keys(sectors).sort()]

  const getColor = (change) => {
    if (!change) return 'bg-slate-700'
    if (change >= 3) return 'bg-emerald-500'
    if (change >= 2) return 'bg-emerald-600'
    if (change >= 1) return 'bg-emerald-700'
    if (change >= 0) return 'bg-emerald-900'
    if (change >= -1) return 'bg-red-900'
    if (change >= -2) return 'bg-red-700'
    if (change >= -3) return 'bg-red-600'
    return 'bg-red-500'
  }

  const displaySectors = selectedSector === 'All'
    ? Object.entries(sectors)
    : [[selectedSector, sectors[selectedSector] || []]]

  // Stats
  const totalStocks = stocks.length
  const gainers = stocks.filter(s => s.changePercent > 0).length
  const losers = stocks.filter(s => s.changePercent < 0).length

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Market Heat Map</h1>
            <p className="text-slate-400 text-sm">Visual market overview by sector</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            >
              {sectorNames.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
            <button
              onClick={fetchStocks}
              className="btn-primary flex items-center gap-2"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card stat-neutral">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Total Stocks</div>
                <div className="text-3xl font-bold text-white">{totalStocks}</div>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🗺️</span>
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
        </div>

        {/* Legend */}
        <div className="card p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-slate-400 text-sm font-medium">Change:</span>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 bg-red-500 rounded"></div>
              <span className="text-xs text-slate-400">&lt;-3%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 bg-red-700 rounded"></div>
              <span className="text-xs text-slate-400">-2%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 bg-red-900 rounded"></div>
              <span className="text-xs text-slate-400">-1%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 bg-emerald-900 rounded"></div>
              <span className="text-xs text-slate-400">0%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 bg-emerald-700 rounded"></div>
              <span className="text-xs text-slate-400">+1%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 bg-emerald-600 rounded"></div>
              <span className="text-xs text-slate-400">+2%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 bg-emerald-500 rounded"></div>
              <span className="text-xs text-slate-400">&gt;+3%</span>
            </div>
          </div>
        </div>

        {/* Heat Map Grid */}
        {loading ? (
          <div className="card p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-400">Loading market data...</span>
            </div>
          </div>
        ) : stocks.length > 0 ? (
          <div className="space-y-4">
            {displaySectors.map(([sectorName, sectorStocks]) => (
              <div key={sectorName} className="card p-4">
                <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  {sectorName}
                  <span className="text-sm text-slate-500 font-normal">({sectorStocks.length})</span>
                </h2>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {sectorStocks
                    .sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0))
                    .map(stock => (
                    <div
                      key={stock.symbol}
                      className={`${getColor(stock.changePercent)}
                        rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer
                        hover:scale-105 hover:z-10 transition-all duration-200 min-h-[80px] shadow-lg`}
                      title={`${stock.name}: $${stock.price?.toFixed(2) || '-'} (${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent?.toFixed(2) || 0}%)`}
                    >
                      <span className="font-bold text-sm text-white">{stock.symbol}</span>
                      <span className="text-xs text-white/90 font-medium">
                        {stock.changePercent ? `${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%` : '-'}
                      </span>
                      <span className="text-xs text-white/70">
                        ${stock.price?.toFixed(0) || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🗺️</span>
            </div>
            <p className="text-slate-400 mb-2">No data available</p>
            <p className="text-slate-500 text-sm">Waiting for market data...</p>
          </div>
        )}

        <p className="text-xs text-slate-500">
          {stocks.length} stocks across {Object.keys(sectors).length} sectors
        </p>
      </div>
    </Layout>
  )
}
