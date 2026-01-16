import { useState } from 'react'
import Layout from '../components/Layout'

// Sample news data
const SAMPLE_NEWS = [
  {
    id: 1,
    title: 'NVIDIA Reports Record Quarterly Revenue of $22.1 Billion',
    source: 'Reuters',
    time: '2 hours ago',
    symbols: ['NVDA'],
    sentiment: 'positive',
    summary: 'NVIDIA announced record-breaking quarterly revenue driven by continued demand for AI chips and data center products.'
  },
  {
    id: 2,
    title: 'Apple Announces New iPhone Launch Event for September',
    source: 'Bloomberg',
    time: '3 hours ago',
    symbols: ['AAPL'],
    sentiment: 'positive',
    summary: 'Apple has sent invitations for its annual iPhone launch event, expected to unveil the iPhone 16 lineup.'
  },
  {
    id: 3,
    title: 'Tesla Stock Drops Amid Increased Competition in China',
    source: 'CNBC',
    time: '4 hours ago',
    symbols: ['TSLA'],
    sentiment: 'negative',
    summary: 'Tesla shares fell as Chinese EV makers continue to gain market share with competitive pricing strategies.'
  },
  {
    id: 4,
    title: 'Federal Reserve Signals Potential Rate Cut in Coming Months',
    source: 'Wall Street Journal',
    time: '5 hours ago',
    symbols: ['JPM', 'BAC', 'GS'],
    sentiment: 'positive',
    summary: 'Fed officials indicated they may begin cutting interest rates if inflation continues to cool.'
  },
  {
    id: 5,
    title: 'Microsoft Azure Growth Exceeds Expectations',
    source: 'TechCrunch',
    time: '6 hours ago',
    symbols: ['MSFT'],
    sentiment: 'positive',
    summary: 'Microsoft cloud services revenue grew 29% year-over-year, beating analyst estimates.'
  },
  {
    id: 6,
    title: 'Amazon Expands Same-Day Delivery to 15 New Cities',
    source: 'Reuters',
    time: '7 hours ago',
    symbols: ['AMZN'],
    sentiment: 'positive',
    summary: 'Amazon announces expansion of its same-day delivery service as it continues to invest in logistics.'
  },
  {
    id: 7,
    title: 'Oil Prices Surge on Middle East Supply Concerns',
    source: 'Bloomberg',
    time: '8 hours ago',
    symbols: ['XOM', 'CVX', 'COP'],
    sentiment: 'positive',
    summary: 'Crude oil prices jumped 3% as geopolitical tensions raise concerns about supply disruptions.'
  },
  {
    id: 8,
    title: 'Meta Faces New Antitrust Lawsuit from FTC',
    source: 'Financial Times',
    time: '9 hours ago',
    symbols: ['META'],
    sentiment: 'negative',
    summary: 'The Federal Trade Commission filed a new antitrust lawsuit against Meta, alleging anticompetitive practices.'
  },
  {
    id: 9,
    title: 'Google Unveils New AI Features for Search',
    source: 'The Verge',
    time: '10 hours ago',
    symbols: ['GOOGL'],
    sentiment: 'positive',
    summary: 'Alphabet announced new AI-powered search features aimed at improving user experience and accuracy.'
  },
  {
    id: 10,
    title: 'Pfizer Reports Lower Than Expected Vaccine Sales',
    source: 'MarketWatch',
    time: '11 hours ago',
    symbols: ['PFE'],
    sentiment: 'negative',
    summary: 'Pfizer shares dropped after the company reported declining vaccine revenue as pandemic demand wanes.'
  },
]

const SYMBOLS = ['All', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA']

export default function News() {
  const [filter, setFilter] = useState('All')
  const [sentimentFilter, setSentimentFilter] = useState('all')

  const filteredNews = SAMPLE_NEWS.filter(news => {
    if (filter !== 'All' && !news.symbols.includes(filter)) return false
    if (sentimentFilter !== 'all' && news.sentiment !== sentimentFilter) return false
    return true
  })

  const getSentimentColor = (sentiment) => {
    if (sentiment === 'positive') return 'text-green-400'
    if (sentiment === 'negative') return 'text-red-400'
    return 'text-gray-400'
  }

  const getSentimentBg = (sentiment) => {
    if (sentiment === 'positive') return 'bg-green-900/30 border-green-800'
    if (sentiment === 'negative') return 'bg-red-900/30 border-red-800'
    return 'bg-gray-800 border-gray-700'
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Financial News</h1>

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
          <div>
            <label className="block text-xs text-gray-400 mb-1">Sentiment</label>
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
            </select>
          </div>
        </div>

        {/* News List */}
        <div className="space-y-4">
          {filteredNews.map(news => (
            <article
              key={news.id}
              className={`p-4 rounded-lg border ${getSentimentBg(news.sentiment)} hover:opacity-90 transition-opacity cursor-pointer`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="font-semibold text-lg mb-1 hover:text-blue-400 transition-colors">
                    {news.title}
                  </h2>
                  <p className="text-gray-400 text-sm mb-2">{news.summary}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-500">{news.source}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-500">{news.time}</span>
                    <span className="text-gray-600">•</span>
                    <span className={getSentimentColor(news.sentiment)}>
                      {news.sentiment === 'positive' ? '↑ Bullish' : news.sentiment === 'negative' ? '↓ Bearish' : 'Neutral'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {news.symbols.map(symbol => (
                    <span
                      key={symbol}
                      className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded text-xs font-medium"
                    >
                      {symbol}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredNews.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No news found matching your filters.
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4">{filteredNews.length} articles</p>
      </div>
    </Layout>
  )
}
