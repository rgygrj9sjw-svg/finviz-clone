import { useState } from 'react'
import Layout from '../components/Layout'

export default function ICTScanner() {
  const [symbol, setSymbol] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runAnalysis = async () => {
    if (!symbol.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/ict-analysis?symbol=${symbol.toUpperCase()}`)
      const data = await res.json()

      if (res.ok) {
        setAnalysis(data)
      } else {
        setError(data.error || 'Failed to analyze')
      }
    } catch (err) {
      setError('Failed to connect to API')
    } finally {
      setLoading(false)
    }
  }

  const quickSymbols = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN', 'META', 'SPY', 'QQQ']

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">ICT Scanner & Analyst</h1>
        <p className="text-gray-400 text-sm mb-4">
          20-Day Look Back • Suspension Blocks • FVGs • Order Blocks • Market Maker Models
        </p>

        {/* Search */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && runAnalysis()}
            placeholder="Enter ticker (e.g., AAPL)"
            className="bg-gray-800 border border-gray-700 rounded px-4 py-2 text-lg flex-1 max-w-xs"
          />
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded font-medium"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {/* Quick Select */}
        <div className="flex flex-wrap gap-2 mb-6">
          {quickSymbols.map(s => (
            <button
              key={s}
              onClick={() => { setSymbol(s); }}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm"
            >
              {s}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded p-4 mb-4">
            {error}
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">{analysis.ticker}</h2>
                  <p className="text-gray-400">Current Price: ${analysis.currentPrice?.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    analysis.bias === 'BULLISH' ? 'text-green-400' :
                    analysis.bias === 'BEARISH' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {analysis.bias}
                  </div>
                  <div className="text-sm text-gray-400">Confidence: {analysis.confidence}</div>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {analysis.warnings?.length > 0 && (
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                <h3 className="font-bold text-yellow-400 mb-2">WARNINGS</h3>
                <ul className="space-y-1">
                  {analysis.warnings.map((w, i) => (
                    <li key={i} className="text-yellow-300 text-sm">• {w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weekly Structure */}
            {analysis.weeklyStructure && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3 text-purple-400">WEEKLY STRUCTURE CHECK (MANDATORY)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Open:</span>
                    <span className="ml-2">${analysis.weeklyStructure.open?.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">High:</span>
                    <span className="ml-2 text-green-400">${analysis.weeklyStructure.high?.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Low:</span>
                    <span className="ml-2 text-red-400">${analysis.weeklyStructure.low?.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Close:</span>
                    <span className="ml-2">${analysis.weeklyStructure.close?.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <span className={`px-3 py-1 rounded font-medium ${
                    analysis.weeklyStructure.character === 'BULLISH' ? 'bg-green-900 text-green-400' :
                    analysis.weeklyStructure.character === 'BEARISH' ? 'bg-red-900 text-red-400' :
                    'bg-yellow-900 text-yellow-400'
                  }`}>
                    {analysis.weeklyStructure.character}
                  </span>
                  <span className="text-gray-400 text-sm">
                    Close: {analysis.weeklyStructure.closeZone} ({analysis.weeklyStructure.closePosition})
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-2">{analysis.weeklyStructure.action}</p>
              </div>
            )}

            {/* 20-Day Look Back */}
            {analysis.lookBack20Day && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3 text-blue-400">20-DAY LOOK BACK</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Range High (100%)</span>
                    <span className="text-green-400 font-medium">${analysis.lookBack20Day.high?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Upper Quadrant (75%)</span>
                    <span>${analysis.lookBack20Day.upperQuadrant?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-800 px-2 py-1 rounded">
                    <span className="text-yellow-400">Equilibrium / CE (50%)</span>
                    <span className="text-yellow-400 font-medium">${analysis.lookBack20Day.equilibrium?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Lower Quadrant (25%)</span>
                    <span>${analysis.lookBack20Day.lowerQuadrant?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Range Low (0%)</span>
                    <span className="text-red-400 font-medium">${analysis.lookBack20Day.low?.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <span className="text-gray-400">Current Position: </span>
                  <span className={`font-medium ${
                    analysis.lookBack20Day.getPosition?.(analysis.currentPrice)?.zone === 'Premium' ? 'text-red-400' :
                    analysis.lookBack20Day.getPosition?.(analysis.currentPrice)?.zone === 'Discount' ? 'text-green-400' :
                    'text-yellow-400'
                  }`}>
                    {analysis.lookBack20Day.getPosition?.(analysis.currentPrice)?.zone} (
                    {analysis.lookBack20Day.getPosition?.(analysis.currentPrice)?.pct?.toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}

            {/* Market Maker Model */}
            {analysis.marketMakerModel && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3 text-orange-400">MARKET MAKER MODEL</h3>
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-2 rounded-lg font-bold ${
                    analysis.marketMakerModel.model === 'MMBM' ? 'bg-green-900 text-green-400' :
                    analysis.marketMakerModel.model === 'MMSM' ? 'bg-red-900 text-red-400' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {analysis.marketMakerModel.model}
                  </span>
                  <span className="text-gray-300">{analysis.marketMakerModel.phase}</span>
                </div>
                {analysis.marketMakerModel.dealingRange && (
                  <div className="mt-3 text-sm">
                    <span className="text-gray-400">Dealing Range: </span>
                    <span className="text-green-400">${analysis.marketMakerModel.dealingRange.high?.toFixed(2)}</span>
                    <span className="text-gray-500"> to </span>
                    <span className="text-red-400">${analysis.marketMakerModel.dealingRange.low?.toFixed(2)}</span>
                    <span className="text-gray-400 ml-2">({analysis.marketMakerModel.position})</span>
                  </div>
                )}
              </div>
            )}

            {/* Suspension Blocks (V7.0) */}
            {analysis.suspensionBlocks?.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3 text-pink-400">
                  SUSPENSION BLOCKS (V7.0 - EXTREMELY STRONG)
                </h3>
                <p className="text-xs text-gray-500 mb-3">Prior wicks DON'T invalidate these</p>
                <div className="space-y-2">
                  {analysis.suspensionBlocks.map((sb, i) => (
                    <div key={i} className={`p-3 rounded ${
                      sb.type === 'bullish' ? 'bg-green-900/30 border border-green-800' :
                      'bg-red-900/30 border border-red-800'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${sb.type === 'bullish' ? 'text-green-400' : 'text-red-400'}`}>
                          {sb.type.toUpperCase()} SB
                        </span>
                        <span className="text-xs text-gray-400">{new Date(sb.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm mt-1">
                        <span className="text-gray-400">Range: </span>
                        ${sb.low?.toFixed(2)} - ${sb.high?.toFixed(2)}
                        <span className="text-yellow-400 ml-2">(CE: ${sb.ce?.toFixed(2)})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fair Value Gaps */}
            {analysis.fairValueGaps?.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3 text-cyan-400">FAIR VALUE GAPS</h3>
                <div className="space-y-2">
                  {analysis.fairValueGaps.slice(-5).map((fvg, i) => (
                    <div key={i} className={`p-2 rounded text-sm ${
                      fvg.type === 'bullish' ? 'bg-green-900/20' : 'bg-red-900/20'
                    }`}>
                      <span className={fvg.type === 'bullish' ? 'text-green-400' : 'text-red-400'}>
                        {fvg.type.toUpperCase()}
                      </span>
                      <span className="text-gray-300 ml-2">
                        ${fvg.low?.toFixed(2)} - ${fvg.high?.toFixed(2)}
                      </span>
                      <span className="text-yellow-400 ml-2">CE: ${fvg.ce?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Blocks */}
            {analysis.orderBlocks?.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3 text-indigo-400">ORDER BLOCKS</h3>
                <div className="space-y-2">
                  {analysis.orderBlocks.map((ob, i) => (
                    <div key={i} className={`p-2 rounded text-sm ${
                      ob.type === 'bullish' ? 'bg-green-900/20' : 'bg-red-900/20'
                    }`}>
                      <span className={ob.type === 'bullish' ? 'text-green-400' : 'text-red-400'}>
                        {ob.type.toUpperCase()} OB
                      </span>
                      <span className="text-gray-300 ml-2">
                        ${ob.low?.toFixed(2)} - ${ob.high?.toFixed(2)}
                      </span>
                      <span className="text-gray-400 ml-2">Mean: ${ob.meanThreshold?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3-Day Liquidity Matrix */}
            {analysis.liquidityMatrix && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3 text-teal-400">3-DAY LIQUIDITY MATRIX</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-green-400 text-sm font-medium mb-2">BUY SIDE LIQUIDITY</h4>
                    {analysis.liquidityMatrix.buySide?.map((level, i) => (
                      <div key={i} className="text-sm text-gray-300">
                        ${level.level?.toFixed(2)} <span className="text-gray-500">({level.label})</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-red-400 text-sm font-medium mb-2">SELL SIDE LIQUIDITY</h4>
                    {analysis.liquidityMatrix.sellSide?.map((level, i) => (
                      <div key={i} className="text-sm text-gray-300">
                        ${level.level?.toFixed(2)} <span className="text-gray-500">({level.label})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Large Range Day Check */}
            {analysis.largeRangeDay && (
              <div className={`rounded-lg p-4 ${
                analysis.largeRangeDay.isLargeRangeDay ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-gray-900'
              }`}>
                <h3 className="font-bold text-lg mb-2">LARGE RANGE DAY CHECK</h3>
                <div className="text-sm">
                  <span className="text-gray-400">Yesterday Range vs Avg: </span>
                  <span className={analysis.largeRangeDay.isLargeRangeDay ? 'text-yellow-400' : 'text-gray-300'}>
                    {analysis.largeRangeDay.ratio}x
                  </span>
                  {analysis.largeRangeDay.isLargeRangeDay && (
                    <p className="text-yellow-300 mt-2 text-sm">{analysis.largeRangeDay.warning}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {!analysis && !loading && (
          <div className="bg-gray-900 rounded-lg p-8 text-center">
            <p className="text-gray-400">Enter a ticker symbol to run ICT analysis</p>
            <p className="text-gray-500 text-sm mt-2">
              Uses real OHLC data from Alpaca API
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
