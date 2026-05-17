import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import OuterSidebar from '@/components/OuterSidebar'
import InnerSidebar from '@/components/InnerSidebar'
import MobileNav from '@/components/MobileNav'
import { getLeague, type League } from '@/api/client'

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  const leagueIdMatch = location.pathname.match(/^\/leagues\/(\d+)/)
  const leagueId = leagueIdMatch ? leagueIdMatch[1] : undefined
  const isAdminPage = location.pathname.includes('/admin') && leagueIdMatch !== null

  const [league, setLeague] = useState<League | null>(null)

  useEffect(() => {
    if (!leagueId) return
    getLeague(Number(leagueId))
      .then(setLeague)
      .catch(() => setLeague(null))
  }, [leagueId])

  const currentLeague = leagueId ? league : null

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Mobile top bar */}
      <MobileNav league={currentLeague ?? undefined} isAdminPage={isAdminPage} />

      {/* Desktop layout */}
      <div className="hidden sm:flex flex-1">
        {/* Outer sidebar */}
        <div className="w-48 border-r border-border shrink-0 sticky top-0 h-screen overflow-y-auto">
          <OuterSidebar />
        </div>

        {/* Inner sidebar — only when on a league page */}
        {currentLeague && currentLeague.status !== 'pending' && (
          <div className="w-48 border-r border-border shrink-0 sticky top-0 h-screen overflow-y-auto">
            <InnerSidebar league={currentLeague} isAdminPage={isAdminPage} />
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile main content */}
      <main className="sm:hidden flex-1 p-4">
        {children}
      </main>
    </div>
  )
}
