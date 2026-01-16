import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Navigation() {
  const router = useRouter()

  const links = [
    { href: '/', label: 'Screener' },
    { href: '/heatmap', label: 'Heat Map' },
    { href: '/charts', label: 'Charts' },
    { href: '/news', label: 'News' },
    { href: '/ict', label: 'ICT Scanner' },
  ]

  return (
    <nav className="bg-gray-900 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center">
            <span className="text-xl font-bold text-green-500">StockViz</span>
            <div className="ml-10 flex space-x-4">
              {links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    router.pathname === link.href
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
