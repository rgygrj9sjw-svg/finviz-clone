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

  const getSentimentColor = (sentiment) => {
    if (sentiment === 'positive' || sentiment === 'bullish') return 'text-green-400'
    if (sentiment === 'negative' || sentiment === 'bearish') return 'text-red-400'
    return 'text-gray-400'
  }

  const getSentimentBg = (sentiment) => {
    if (sentiment === 'positive' || sentiment === 'bullish') return 'bg-green-900/30 border-green-800'
    if (sentiment === 'negative' || sentiment === 'bearish') return 'bg-red-900/30 border-red-800'
    return 'bg-gray-800 border-gray-700'
  }

  return (
    <Layout>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Financial News</h1>
          <button
            onClick={() => fetchNews(filter)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Stock</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            >
              {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* News List */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-gray-900 rounded-lg p-4 animate-pulse">
                <div className="h-6 bg-gray-800 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-800 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : news.length > 0 ? (
          <div className="space-y-4">
            {news.map((item, index) => (
              <article
                key={item.id || index}
                className={`p-4 rounded-lg border ${getSentimentBg(item.sentiment)} hover:opacity-90 transition-opacity`}
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
                        className="w-24 h-16 object-cover rounded hidden sm:block"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    )}
                    <div className="flex-1">
                      <h2 className="font-semibold text-lg mb-1 hover:text-blue-400 transition-colors">
                        {item.title}
                      </h2>
                      {item.summary && (
                        <p className="text-gray-400 text-sm mb-2 line-clamp-2">{item.summary}</p>
                      )}
                      <div className="flex items-center flex-wrap gap-3 text-xs">
                        <span className="text-gray-500">{item.source}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-500">{item.timeAgo || 'Recently'}</span>
                        {item.sentiment && item.sentiment !== 'neutral' && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span className={getSentimentColor(item.sentiment)}>
                              {item.sentiment === 'positive' || item.sentiment === 'bullish' ? '↑ Bullish' : '↓ Bearish'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {item.symbols?.slice(0, 3).map(symbol => (
                        <span
                          key={symbol}
                          className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded text-xs font-medium"
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
          <div className="text-center py-12 bg-gray-900 rounded-lg">
            <p className="text-gray-400 mb-2">No news available</p>
            <p className="text-gray-500 text-sm">Add API keys to .env.local for real news</p>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4">{news.length} articles</p>
      </div>
    </Layout>
  )
}
