import Navigation from './Navigation'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
