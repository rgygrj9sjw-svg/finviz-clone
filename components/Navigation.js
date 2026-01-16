import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

export default function Navigation() {
  const router = useRouter()
  const [xp, setXp] = useState(2450)
  const [level, setLevel] = useState(12)
  const [showXpGain, setShowXpGain] = useState(false)

  const links = [
    { href: '/', label: 'Screener', icon: '🔍' },
    { href: '/heatmap', label: 'Heat Map', icon: '🗺️' },
    { href: '/charts', label: 'Charts', icon: '📊' },
    { href: '/news', label: 'News', icon: '📰' },
    { href: '/ict', label: 'ICT Scanner', icon: '🎯' },
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
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* XP & Level Display */}
          <div className="flex items-center gap-4">
            {/* Level Badge */}
            <div className="level-badge">
              <span className="text-amber-400">⭐</span>
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
              <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <span className="text-emerald-400">🔥</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
