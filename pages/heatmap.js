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
    if (!change) return 'bg-gray-700'
    if (change >= 3) return 'bg-green-500'
    if (change >= 2) return 'bg-green-600'
    if (change >= 1) return 'bg-green-700'
    if (change >= 0) return 'bg-green-900'
    if (change >= -1) return 'bg-red-900'
    if (change >= -2) return 'bg-red-700'
    if (change >= -3) return 'bg-red-600'
    return 'bg-red-500'
  }

  const displaySectors = selectedSector === 'All'
    ? Object.entries(sectors)
    : [[selectedSector, sectors[selectedSector] || []]]

  return (
    <Layout>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Market Heat Map</h1>
          <div className="flex items-center gap-3">
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            >
              {sectorNames.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
            <button
              onClick={fetchStocks}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mb-4 text-xs flex-wrap">
          <span className="text-gray-400">Change:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>&lt;-3%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-700 rounded"></div>
            <span>-2%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-900 rounded"></div>
            <span>-1%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-900 rounded"></div>
            <span>0%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-700 rounded"></div>
            <span>+1%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span>+2%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>&gt;+3%</span>
          </div>
        </div>

        {/* Heat Map Grid */}
        {loading ? (
          <div className="bg-gray-900 rounded-lg p-8 text-center">
            <div className="animate-pulse text-gray-400">Loading market data...</div>
          </div>
        ) : stocks.length > 0 ? (
          <div className="space-y-4">
            {displaySectors.map(([sectorName, sectorStocks]) => (
              <div key={sectorName} className="bg-gray-900 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3 text-gray-300">
                  {sectorName}
                  <span className="text-sm text-gray-500 ml-2">({sectorStocks.length})</span>
                </h2>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1">
                  {sectorStocks
                    .sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0))
                    .map(stock => (
                    <div
                      key={stock.symbol}
                      className={`${getColor(stock.changePercent)}
                        rounded p-2 flex flex-col items-center justify-center cursor-pointer
                        hover:opacity-80 transition-opacity min-h-[70px]`}
                      title={`${stock.name}: $${stock.price?.toFixed(2) || '-'} (${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent?.toFixed(2) || 0}%)`}
                    >
                      <span className="font-bold text-sm">{stock.symbol}</span>
                      <span className="text-xs opacity-90">
                        {stock.changePercent ? `${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%` : '-'}
                      </span>
                      <span className="text-xs opacity-70">
                        ${stock.price?.toFixed(0) || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-2">No data available</p>
            <p className="text-gray-500 text-sm">Add API keys to .env.local for real data</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
