import { useState, useEffect } from 'react'
import Layout from '../components/Layout'

const SYMBOLS = ['All', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA']

export default function News() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')

  const fetchNews = async (symbol = null) => {
    setLoading(true)
    try {
      const url = symbol && symbol !== 'All'
        ? `/api/news?symbol=${symbol}`
        : '/api/news'

      const res = await fetch(url)
      const data = await res.json()

      if (data.news) {
        setNews(data.news)
      }
    } catch (error) {
      console.error('Failed to fetch news:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews(filter)
  }, [filter])

  const getSentimentBadge = (sentiment) => {
    if (sentiment === 'positive' || sentiment === 'bullish') return 'badge-success'
    if (sentiment === 'negative' || sentiment === 'bearish') return 'badge-danger'
    return 'badge-info'
  }

  const getSentimentBg = (sentiment) => {
    if (sentiment === 'positive' || sentiment === 'bullish') return 'border-l-4 border-l-emerald-500 bg-emerald-900/10'
    if (sentiment === 'negative' || sentiment === 'bearish') return 'border-l-4 border-l-red-500 bg-red-900/10'
    return ''
  }

  // Stats
  const bullishNews = news.filter(n => n.sentiment === 'positive' || n.sentiment === 'bullish').length
  const bearishNews = news.filter(n => n.sentiment === 'negative' || n.sentiment === 'bearish').length

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Financial News</h1>
            <p className="text-slate-400 text-sm">Real-time market news and sentiment</p>
          </div>
          <button
            onClick={() => fetchNews(filter)}
            className="btn-primary flex items-center gap-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card stat-neutral">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Total Articles</div>
                <div className="text-3xl font-bold text-white">{news.length}</div>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📰</span>
              </div>
            </div>
          </div>

          <div className="stat-card stat-up">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Bullish</div>
                <div className="text-3xl font-bold text-emerald-400">{bullishNews}</div>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </div>

          <div className="stat-card stat-down">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Bearish</div>
                <div className="text-3xl font-bold text-red-400">{bearishNews}</div>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📉</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Filter by Stock</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              >
                {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* News List */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-6 bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : news.length > 0 ? (
          <div className="space-y-4">
            {news.map((item, index) => (
              <article
                key={item.id || index}
                className={`card p-4 ${getSentimentBg(item.sentiment)} hover:border-blue-500/30 transition-all`}
              >
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="flex items-start gap-4">
                    {item.image && (
                      <img
                        src={item.image}
                        alt=""
                        className="w-28 h-20 object-cover rounded-lg hidden sm:block"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    )}
                    <div className="flex-1">
                      <h2 className="font-semibold text-lg mb-2 text-white hover:text-blue-400 transition-colors">
                        {item.title}
                      </h2>
                      {item.summary && (
                        <p className="text-slate-400 text-sm mb-3 line-clamp-2">{item.summary}</p>
                      )}
                      <div className="flex items-center flex-wrap gap-3 text-xs">
                        <span className="text-slate-500">{item.source}</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-slate-500">{item.timeAgo || 'Recently'}</span>
                        {item.sentiment && item.sentiment !== 'neutral' && (
                          <>
                            <span className="text-slate-600">|</span>
                            <span className={`badge ${getSentimentBadge(item.sentiment)}`}>
                              {item.sentiment === 'positive' || item.sentiment === 'bullish' ? 'Bullish' : 'Bearish'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {item.symbols?.slice(0, 3).map(symbol => (
                        <span
                          key={symbol}
                          className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded-lg text-xs font-medium border border-blue-500/30"
                        >
                          {symbol}
                        </span>
                      ))}
                    </div>
                  </div>
                </a>
              </article>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📰</span>
            </div>
            <p className="text-slate-400 mb-2">No news available</p>
            <p className="text-slate-500 text-sm">Check back later for updates</p>
          </div>
        )}

        <p className="text-xs text-slate-500">{news.length} articles</p>
      </div>
    </Layout>
  )
}
