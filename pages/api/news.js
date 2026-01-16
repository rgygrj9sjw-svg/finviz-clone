// Fetches real financial news from multiple sources

async function fetchFinnhubNews(category = 'general') {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey || apiKey === 'your_finnhub_key_here') return []

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/news?category=${category}&token=${apiKey}`
    )
    const data = await res.json()

    if (Array.isArray(data)) {
      return data.slice(0, 20).map(item => ({
        id: item.id,
        title: item.headline,
        summary: item.summary,
        source: item.source,
        url: item.url,
        image: item.image,
        time: new Date(item.datetime * 1000).toISOString(),
        symbols: item.related ? item.related.split(',') : [],
        sentiment: 'neutral'
      }))
    }
  } catch (e) {
    console.error('Finnhub news error:', e)
  }
  return []
}

async function fetchCompanyNews(symbol) {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey || apiKey === 'your_finnhub_key_here') return []

  try {
    const to = new Date().toISOString().split('T')[0]
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const res = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${apiKey}`
    )
    const data = await res.json()

    if (Array.isArray(data)) {
      return data.slice(0, 10).map(item => ({
        id: item.id,
        title: item.headline,
        summary: item.summary,
        source: item.source,
        url: item.url,
        image: item.image,
        time: new Date(item.datetime * 1000).toISOString(),
        symbols: [symbol],
        sentiment: 'neutral'
      }))
    }
  } catch (e) {
    console.error('Company news error:', e)
  }
  return []
}

async function fetchPolygonNews(symbol = null) {
  const apiKey = process.env.POLYGON_API_KEY
  if (!apiKey || apiKey === 'your_polygon_key_here') return []

  try {
    let url = `https://api.polygon.io/v2/reference/news?limit=20&apiKey=${apiKey}`
    if (symbol) {
      url += `&ticker=${symbol}`
    }

    const res = await fetch(url)
    const data = await res.json()

    if (data.results) {
      return data.results.map(item => ({
        id: item.id,
        title: item.title,
        summary: item.description,
        source: item.publisher?.name || 'Unknown',
        url: item.article_url,
        image: item.image_url,
        time: item.published_utc,
        symbols: item.tickers || [],
        sentiment: item.insights?.[0]?.sentiment || 'neutral'
      }))
    }
  } catch (e) {
    console.error('Polygon news error:', e)
  }
  return []
}

function getTimeAgo(isoDate) {
  const now = new Date()
  const then = new Date(isoDate)
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  return `${diffDays} days ago`
}

export default async function handler(req, res) {
  const { symbol } = req.query

  try {
    let news = []

    if (symbol) {
      // Fetch company-specific news
      news = await fetchCompanyNews(symbol.toUpperCase())

      if (news.length === 0) {
        news = await fetchPolygonNews(symbol.toUpperCase())
      }
    } else {
      // Fetch general market news
      news = await fetchFinnhubNews('general')

      if (news.length === 0) {
        news = await fetchPolygonNews()
      }
    }

    // Add relative time
    news = news.map(item => ({
      ...item,
      timeAgo: getTimeAgo(item.time)
    }))

    res.status(200).json({ news })
  } catch (error) {
    console.error('News API Error:', error)
    res.status(500).json({ error: 'Failed to fetch news' })
  }
}
