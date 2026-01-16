import { useState } from 'react'
import Layout from '../components/Layout'

// Sample data organized by sector
const SECTORS_DATA = {
  'Technology': [
    { symbol: 'AAPL', name: 'Apple', change: 1.33, marketCap: 2800 },
    { symbol: 'MSFT', name: 'Microsoft', change: -0.32, marketCap: 2810 },
    { symbol: 'GOOGL', name: 'Alphabet', change: 2.49, marketCap: 1780 },
    { symbol: 'NVDA', name: 'NVIDIA', change: 2.56, marketCap: 1220 },
    { symbol: 'META', name: 'Meta', change: -1.64, marketCap: 1300 },
    { symbol: 'AVGO', name: 'Broadcom', change: 1.12, marketCap: 620 },
    { symbol: 'ORCL', name: 'Oracle', change: 0.89, marketCap: 320 },
    { symbol: 'CRM', name: 'Salesforce', change: -0.45, marketCap: 280 },
    { symbol: 'AMD', name: 'AMD', change: 3.21, marketCap: 250 },
    { symbol: 'INTC', name: 'Intel', change: -2.34, marketCap: 180 },
  ],
  'Consumer': [
    { symbol: 'AMZN', name: 'Amazon', change: 2.37, marketCap: 1850 },
    { symbol: 'TSLA', name: 'Tesla', change: -2.23, marketCap: 789 },
    { symbol: 'HD', name: 'Home Depot', change: 0.67, marketCap: 380 },
    { symbol: 'MCD', name: 'McDonalds', change: 0.34, marketCap: 210 },
    { symbol: 'NKE', name: 'Nike', change: -1.12, marketCap: 165 },
    { symbol: 'SBUX', name: 'Starbucks', change: 0.89, marketCap: 105 },
  ],
  'Financial': [
    { symbol: 'JPM', name: 'JPMorgan', change: 0.98, marketCap: 565 },
    { symbol: 'V', name: 'Visa', change: 0.16, marketCap: 575 },
    { symbol: 'MA', name: 'Mastercard', change: 0.45, marketCap: 420 },
    { symbol: 'BAC', name: 'Bank of America', change: -0.67, marketCap: 310 },
    { symbol: 'WFC', name: 'Wells Fargo', change: 1.23, marketCap: 185 },
    { symbol: 'GS', name: 'Goldman Sachs', change: 0.78, marketCap: 145 },
  ],
  'Healthcare': [
    { symbol: 'UNH', name: 'UnitedHealth', change: 1.09, marketCap: 489 },
    { symbol: 'JNJ', name: 'Johnson & Johnson', change: -0.56, marketCap: 378 },
    { symbol: 'LLY', name: 'Eli Lilly', change: 2.87, marketCap: 580 },
    { symbol: 'PFE', name: 'Pfizer', change: -1.45, marketCap: 158 },
    { symbol: 'MRK', name: 'Merck', change: 0.34, marketCap: 275 },
    { symbol: 'ABBV', name: 'AbbVie', change: 0.67, marketCap: 290 },
  ],
  'Energy': [
    { symbol: 'XOM', name: 'Exxon', change: 2.07, marketCap: 418 },
    { symbol: 'CVX', name: 'Chevron', change: 1.56, marketCap: 285 },
    { symbol: 'COP', name: 'ConocoPhillips', change: 1.89, marketCap: 128 },
    { symbol: 'SLB', name: 'Schlumberger', change: 0.45, marketCap: 78 },
    { symbol: 'EOG', name: 'EOG Resources', change: -0.23, marketCap: 72 },
  ],
}

const getColor = (change) => {
  if (change >= 3) return 'bg-green-500'
  if (change >= 2) return 'bg-green-600'
  if (change >= 1) return 'bg-green-700'
  if (change >= 0) return 'bg-green-900'
  if (change >= -1) return 'bg-red-900'
  if (change >= -2) return 'bg-red-700'
  if (change >= -3) return 'bg-red-600'
  return 'bg-red-500'
}

const getSize = (marketCap, maxCap) => {
  const ratio = marketCap / maxCap
  if (ratio > 0.5) return 'col-span-2 row-span-2'
  if (ratio > 0.2) return 'col-span-2'
  return ''
}

export default function HeatMap() {
  const [selectedSector, setSelectedSector] = useState('All')

  const sectors = selectedSector === 'All'
    ? Object.entries(SECTORS_DATA)
    : [[selectedSector, SECTORS_DATA[selectedSector]]]

  return (
    <Layout>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">S&P 500 Heat Map</h1>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
          >
            <option value="All">All Sectors</option>
            {Object.keys(SECTORS_DATA).map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mb-4 text-xs">
          <span className="text-gray-400">Change:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>-3%</span>
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
            <span>+3%</span>
          </div>
        </div>

        {/* Heat Map Grid */}
        <div className="space-y-4">
          {sectors.map(([sectorName, stocks]) => {
            const maxCap = Math.max(...stocks.map(s => s.marketCap))
            return (
              <div key={sectorName} className="bg-gray-900 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3 text-gray-300">{sectorName}</h2>
                <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1">
                  {stocks.map(stock => (
                    <div
                      key={stock.symbol}
                      className={`${getColor(stock.change)} ${getSize(stock.marketCap, maxCap)}
                        rounded p-2 flex flex-col items-center justify-center cursor-pointer
                        hover:opacity-80 transition-opacity min-h-[60px]`}
                      title={`${stock.name}: ${stock.change >= 0 ? '+' : ''}${stock.change}%`}
                    >
                      <span className="font-bold text-sm">{stock.symbol}</span>
                      <span className="text-xs opacity-90">
                        {stock.change >= 0 ? '+' : ''}{stock.change}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
