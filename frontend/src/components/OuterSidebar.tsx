import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLeagues } from '@/context/useLeagues'
import { Button } from '@/components/ui/button'
import logo from '@/assets/logo.jpg'

export default function OuterSidebar({
  onNavigate,
  onNavigateKeepOpen,
}: {
  onNavigate?: () => void
  onNavigateKeepOpen?: () => void
}) {
  function handleLeagueSelect(path: string) {
    navigate(path)
    onNavigateKeepOpen?.()
  }

  function handleOtherNavigate(path: string) {
    navigate(path)
    onNavigate?.()
  }

  const { leagues } = useLeagues()
  const location = useLocation()
  const navigate = useNavigate()

  const activeLeagues = leagues.filter((l) => l.is_active)
  const pendingLeagues = leagues.filter((l) => l.status === 'pending')

  const leagueIdMatch = location.pathname.match(/^\/leagues\/(\d+)/)
  const activeLeagueId = leagueIdMatch ? Number(leagueIdMatch[1]) : null

  // function handleNavigate(path: string) {
  //   navigate(path)
  //   onNavigate?.()
  // }

  return (
    <div className="flex flex-col h-full">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <img src={logo} alt="LRC" className="h-8 w-auto" />
        <span className="font-bold tracking-tight">LRC Leagues</span>
      </Link>

      <div className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
        {activeLeagues.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-1">Active</p>
            {activeLeagues.map((league) => (
              <Button
                key={league.id}
                variant={activeLeagueId === league.id ? 'secondary' : 'ghost'}
                className="w-full justify-between"
                onClick={() => handleLeagueSelect(`/leagues/${league.id}`)}
              >
                <span className="truncate">{league.name}</span>
                {activeLeagueId === league.id && <span className="text-muted-foreground ml-2">›</span>}
              </Button>
            ))}
          </div>
        )}

        {pendingLeagues.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-1">Pending</p>
            {pendingLeagues.map((league) => (
              <Button
                key={league.id}
                variant={activeLeagueId === league.id ? 'secondary' : 'ghost'}
                className="w-full justify-between"
                onClick={() => handleOtherNavigate(`/leagues/${league.id}`)}
              >
                <span className="truncate">{league.name}</span>
                {activeLeagueId === league.id && <span className="text-muted-foreground ml-2">›</span>}
              </Button>
            ))}
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={() => handleOtherNavigate('/leagues')}
        >
          All leagues
        </Button>
      </div>

      <div className="p-3 border-t border-border">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleOtherNavigate('/admin')}
        >
          Admin
        </Button>
      </div>
    </div>
  )
}
