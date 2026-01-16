import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

// Clean SVG Icons
const Icons = {
  screener: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  heatmap: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  charts: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  ),
  news: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  ),
  ict: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  ai: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  level: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  fire: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 23c-3.59 0-6.5-2.91-6.5-6.5 0-2.47 1.38-4.62 3.41-5.72.26-.14.57-.09.77.13.2.22.23.54.08.8-.7 1.21-1.26 2.57-1.26 3.79 0 1.93 1.57 3.5 3.5 3.5s3.5-1.57 3.5-3.5c0-1.22-.56-2.58-1.26-3.79-.15-.26-.12-.58.08-.8.2-.22.51-.27.77-.13 2.03 1.1 3.41 3.25 3.41 5.72 0 3.59-2.91 6.5-6.5 6.5zm0-14c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1s1-.45 1-1v-3c0-.55-.45-1-1-1zm0-7c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1s1-.45 1-1V3c0-.55-.45-1-1-1z"/>
    </svg>
  ),
}

export default function Navigation() {
  const router = useRouter()
  const [xp, setXp] = useState(2450)
  const [level, setLevel] = useState(12)
  const [showXpGain, setShowXpGain] = useState(false)

  const links = [
    { href: '/', label: 'Screener', icon: Icons.screener },
    { href: '/heatmap', label: 'Heat Map', icon: Icons.heatmap },
    { href: '/charts', label: 'Charts', icon: Icons.charts },
    { href: '/news', label: 'News', icon: Icons.news },
    { href: '/ict', label: 'ICT Scanner', icon: Icons.ict },
    { href: '/ai-scanner', label: 'AI Scanner', icon: Icons.ai },
  ]

  const xpToNextLevel = 3000
  const xpProgress = (xp % xpToNextLevel) / xpToNextLevel * 100

  // Simulate XP gain on page change
  useEffect(() => {
    const gain = Math.floor(Math.random() * 10) + 5
    setXp(prev => prev + gain)
    setShowXpGain(true)
    setTimeout(() => setShowXpGain(false), 1500)
  }, [router.pathname])

  return (
    <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Nav Links */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">
                R
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                runnr
              </span>
            </Link>

            <div className="ml-10 flex space-x-1">
              {links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    router.pathname === link.href
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* XP & Level Display */}
          <div className="flex items-center gap-4">
            {/* Level Badge */}
            <div className="level-badge">
              <span className="text-amber-400">{Icons.level}</span>
              <span>Level {level}</span>
            </div>

            {/* XP Bar */}
            <div className="flex items-center gap-2">
              <div className="w-32">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">XP</span>
                  <span className="text-amber-400 font-medium">{xp.toLocaleString()}</span>
                </div>
                <div className="xp-bar">
                  <div
                    className="xp-fill"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>

              {/* XP Gain Animation */}
              {showXpGain && (
                <span className="text-emerald-400 text-sm font-bold animate-fadeIn">
                  +{Math.floor(Math.random() * 10) + 5} XP
                </span>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-2 pl-4 border-l border-slate-700">
              <div className="text-right">
                <div className="text-xs text-slate-500">Scans Today</div>
                <div className="text-sm font-bold text-white">24</div>
              </div>
              <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                {Icons.fire}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
