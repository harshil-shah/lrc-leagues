import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { type League } from '@/api/client'

type NavItem = {
  label: string
  tab: string
}

const leagueNavItems: NavItem[] = [
  { label: 'Standings', tab: 'standings' },
  { label: 'Submit Match', tab: 'submit-match' },
  { label: 'Match History', tab: 'match-history' },
  { label: 'Rules', tab: 'rules' },
]

const leagueAdminNavItems: NavItem[] = [
  { label: 'Players', tab: 'players' },
  { label: 'Divisions', tab: 'divisions' },
  { label: 'Settings', tab: 'settings' },
]

const leagueAdminPendingNavItems: NavItem[] = [
  { label: 'Setup', tab: 'setup' },
]

export default function InnerSidebar({
  league,
  isAdminPage,
  onNavigate,
}: {
  league: League
  isAdminPage: boolean
  onNavigate?: () => void
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const currentTab = searchParams.get('tab') ?? (isAdminPage ? 'players' : 'standings')

  const navItems = isAdminPage
    ? league.status === 'pending' ? leagueAdminPendingNavItems : leagueAdminNavItems
    : leagueNavItems

  function handleTabSelect(tab: string) {
    setSearchParams({ tab })
    onNavigate?.()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-1 p-3 flex-1">
        {navItems.map((item) => (
          <Button
            key={item.tab}
            variant={currentTab === item.tab ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => handleTabSelect(item.tab)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {!isAdminPage && (
        <div className="p-3 border-t border-border">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => { navigate(`/leagues/${league.id}/admin`); onNavigate?.() }}
          >
            League Admin
          </Button>
        </div>
      )}

      {isAdminPage && (
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => { navigate(`/leagues/${league.id}`); onNavigate?.() }}
          >
            ← Back to league
          </Button>
        </div>
      )}
    </div>
  )
}
