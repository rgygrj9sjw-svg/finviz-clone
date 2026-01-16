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
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">ICT Scanner & Analyst</h1>
          <p className="text-slate-400 text-sm">
            20-Day Look Back | Suspension Blocks | FVGs | Order Blocks | Market Maker Models
          </p>
        </div>

        {/* Search */}
        <div className="card p-4">
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && runAnalysis()}
              placeholder="Enter ticker (e.g., AAPL)"
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-lg flex-1 max-w-xs text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
            <button
              onClick={runAnalysis}
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                loading
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'btn-primary'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : (
                <span>Analyze</span>
              )}
            </button>
          </div>

          {/* Quick Select */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-500 self-center mr-2">Quick select:</span>
            {quickSymbols.map(s => (
              <button
                key={s}
                onClick={() => { setSymbol(s); }}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  symbol === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="card p-4 border-l-4 border-l-red-500 bg-red-900/20">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-medium text-red-400">Analysis Error</div>
                <div className="text-red-300/70 text-sm">{error}</div>
              </div>
            </div>
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            {/* Header Card */}
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-bold text-white">{analysis.ticker}</h2>
                  <p className="text-slate-400 mt-1">Current Price: <span className="text-white font-medium">${analysis.currentPrice?.toFixed(2)}</span></p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${
                    analysis.bias === 'BULLISH' ? 'text-emerald-400' :
                    analysis.bias === 'BEARISH' ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {analysis.bias}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    Confidence: <span className={`font-medium ${
                      analysis.confidence === 'HIGH' ? 'text-emerald-400' :
                      analysis.confidence === 'MEDIUM' ? 'text-amber-400' : 'text-slate-300'
                    }`}>{analysis.confidence}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {analysis.warnings?.length > 0 && (
              <div className="card p-4 border-l-4 border-l-amber-500 bg-amber-900/10">
                <h3 className="font-bold text-amber-400 mb-3 flex items-center gap-2">
                  <span>⚠️</span> WARNINGS
                </h3>
                <ul className="space-y-2">
                  {analysis.warnings.map((w, i) => (
                    <li key={i} className="text-amber-300/80 text-sm flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weekly Structure */}
            {analysis.weeklyStructure && (
              <div className="card p-4">
                <h3 className="font-bold text-lg mb-4 text-purple-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  WEEKLY STRUCTURE CHECK (MANDATORY)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <span className="text-xs text-slate-500 uppercase">Open</span>
                    <div className="text-lg font-medium text-white">${analysis.weeklyStructure.open?.toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <span className="text-xs text-slate-500 uppercase">High</span>
                    <div className="text-lg font-medium text-emerald-400">${analysis.weeklyStructure.high?.toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <span className="text-xs text-slate-500 uppercase">Low</span>
                    <div className="text-lg font-medium text-red-400">${analysis.weeklyStructure.low?.toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <span className="text-xs text-slate-500 uppercase">Close</span>
                    <div className="text-lg font-medium text-white">${analysis.weeklyStructure.close?.toFixed(2)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`badge ${
                    analysis.weeklyStructure.character === 'BULLISH' ? 'badge-success' :
                    analysis.weeklyStructure.character === 'BEARISH' ? 'badge-danger' : 'badge-warning'
                  }`}>
                    {analysis.weeklyStructure.character}
                  </span>
                  <span className="text-slate-400 text-sm">
                    Close: {analysis.weeklyStructure.closeZone} ({analysis.weeklyStructure.closePosition})
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-3">{analysis.weeklyStructure.action}</p>
              </div>
            )}

            {/* 20-Day Look Back */}
            {analysis.lookBack20Day && (
              <div className="card p-4">
                <h3 className="font-bold text-lg mb-4 text-blue-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  20-DAY LOOK BACK
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-emerald-900/20 rounded-lg">
                    <span className="text-slate-300">Range High (100%)</span>
                    <span className="text-emerald-400 font-bold">${analysis.lookBack20Day.high?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg">
                    <span className="text-slate-400">Upper Quadrant (75%)</span>
                    <span className="text-slate-300">${analysis.lookBack20Day.upperQuadrant?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-amber-900/20 rounded-lg border border-amber-500/30">
                    <span className="text-amber-400 font-medium">Equilibrium / CE (50%)</span>
                    <span className="text-amber-400 font-bold">${analysis.lookBack20Day.equilibrium?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg">
                    <span className="text-slate-400">Lower Quadrant (25%)</span>
                    <span className="text-slate-300">${analysis.lookBack20Day.lowerQuadrant?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-900/20 rounded-lg">
                    <span className="text-slate-300">Range Low (0%)</span>
                    <span className="text-red-400 font-bold">${analysis.lookBack20Day.low?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Market Maker Model */}
            {analysis.marketMakerModel && (
              <div className="card p-4">
                <h3 className="font-bold text-lg mb-4 text-orange-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  MARKET MAKER MODEL
                </h3>
                <div className="flex items-center gap-4 mb-3">
                  <span className={`px-4 py-2 rounded-lg font-bold text-lg ${
                    analysis.marketMakerModel.model === 'MMBM' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30' :
                    analysis.marketMakerModel.model === 'MMSM' ? 'bg-red-900/50 text-red-400 border border-red-500/30' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {analysis.marketMakerModel.model}
                  </span>
                  <span className="text-slate-300">{analysis.marketMakerModel.phase}</span>
                </div>
                {analysis.marketMakerModel.dealingRange && (
                  <div className="text-sm bg-slate-800/50 rounded-lg p-3">
                    <span className="text-slate-400">Dealing Range: </span>
                    <span className="text-emerald-400 font-medium">${analysis.marketMakerModel.dealingRange.high?.toFixed(2)}</span>
                    <span className="text-slate-500"> to </span>
                    <span className="text-red-400 font-medium">${analysis.marketMakerModel.dealingRange.low?.toFixed(2)}</span>
                    <span className="text-slate-400 ml-3">({analysis.marketMakerModel.position})</span>
                  </div>
                )}
              </div>
            )}

            {/* Suspension Blocks (V7.0) */}
            {analysis.suspensionBlocks?.length > 0 && (
              <div className="card p-4">
                <h3 className="font-bold text-lg mb-2 text-pink-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                  SUSPENSION BLOCKS (V7.0)
                </h3>
                <p className="text-xs text-slate-500 mb-4">Prior wicks DON'T invalidate these - extremely strong levels</p>
                <div className="space-y-2">
                  {analysis.suspensionBlocks.map((sb, i) => (
                    <div key={i} className={`p-3 rounded-lg ${
                      sb.type === 'bullish' ? 'bg-emerald-900/20 border border-emerald-500/30' :
                      'bg-red-900/20 border border-red-500/30'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className={`badge ${sb.type === 'bullish' ? 'badge-success' : 'badge-danger'}`}>
                          {sb.type.toUpperCase()} SB
                        </span>
                        <span className="text-xs text-slate-400">{new Date(sb.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm mt-2">
                        <span className="text-slate-400">Range: </span>
                        <span className="text-white">${sb.low?.toFixed(2)} - ${sb.high?.toFixed(2)}</span>
                        <span className="text-amber-400 ml-3">CE: ${sb.ce?.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fair Value Gaps */}
            {analysis.fairValueGaps?.length > 0 && (
              <div className="card p-4">
                <h3 className="font-bold text-lg mb-4 text-cyan-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                  FAIR VALUE GAPS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {analysis.fairValueGaps.slice(-6).map((fvg, i) => (
                    <div key={i} className={`p-3 rounded-lg text-sm ${
                      fvg.type === 'bullish' ? 'bg-emerald-900/20' : 'bg-red-900/20'
                    }`}>
                      <span className={`badge ${fvg.type === 'bullish' ? 'badge-success' : 'badge-danger'}`}>
                        {fvg.type.toUpperCase()}
                      </span>
                      <span className="text-slate-300 ml-3">
                        ${fvg.low?.toFixed(2)} - ${fvg.high?.toFixed(2)}
                      </span>
                      <span className="text-amber-400 ml-2">CE: ${fvg.ce?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Blocks */}
            {analysis.orderBlocks?.length > 0 && (
              <div className="card p-4">
                <h3 className="font-bold text-lg mb-4 text-indigo-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  ORDER BLOCKS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {analysis.orderBlocks.map((ob, i) => (
                    <div key={i} className={`p-3 rounded-lg text-sm ${
                      ob.type === 'bullish' ? 'bg-emerald-900/20' : 'bg-red-900/20'
                    }`}>
                      <span className={`badge ${ob.type === 'bullish' ? 'badge-success' : 'badge-danger'}`}>
                        {ob.type.toUpperCase()} OB
                      </span>
                      <span className="text-slate-300 ml-3">
                        ${ob.low?.toFixed(2)} - ${ob.high?.toFixed(2)}
                      </span>
                      <span className="text-slate-400 ml-2">Mean: ${ob.meanThreshold?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3-Day Liquidity Matrix */}
            {analysis.liquidityMatrix && (
              <div className="card p-4">
                <h3 className="font-bold text-lg mb-4 text-teal-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                  3-DAY LIQUIDITY MATRIX
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-emerald-400 text-sm font-medium mb-3 uppercase tracking-wide">Buy Side Liquidity</h4>
                    {analysis.liquidityMatrix.buySide?.map((level, i) => (
                      <div key={i} className="text-sm text-slate-300 py-1 border-b border-slate-800 last:border-0">
                        <span className="text-emerald-400 font-medium">${level.level?.toFixed(2)}</span>
                        <span className="text-slate-500 ml-2">({level.label})</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-red-400 text-sm font-medium mb-3 uppercase tracking-wide">Sell Side Liquidity</h4>
                    {analysis.liquidityMatrix.sellSide?.map((level, i) => (
                      <div key={i} className="text-sm text-slate-300 py-1 border-b border-slate-800 last:border-0">
                        <span className="text-red-400 font-medium">${level.level?.toFixed(2)}</span>
                        <span className="text-slate-500 ml-2">({level.label})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Large Range Day Check */}
            {analysis.largeRangeDay && (
              <div className={`card p-4 ${
                analysis.largeRangeDay.isLargeRangeDay ? 'border-l-4 border-l-amber-500 bg-amber-900/10' : ''
              }`}>
                <h3 className="font-bold text-lg mb-3 text-white">LARGE RANGE DAY CHECK</h3>
                <div className="text-sm">
                  <span className="text-slate-400">Yesterday Range vs Avg: </span>
                  <span className={`font-bold ${analysis.largeRangeDay.isLargeRangeDay ? 'text-amber-400' : 'text-slate-300'}`}>
                    {analysis.largeRangeDay.ratio}x
                  </span>
                  {analysis.largeRangeDay.isLargeRangeDay && (
                    <p className="text-amber-300 mt-2">{analysis.largeRangeDay.warning}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {!analysis && !loading && (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Enter a Ticker Symbol</h3>
            <p className="text-slate-400 mb-1">Run comprehensive ICT analysis</p>
            <p className="text-slate-500 text-sm">
              Uses real OHLC data from Yahoo Finance
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
