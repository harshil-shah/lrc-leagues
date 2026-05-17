import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import logo from '@/assets/logo.jpg'
import { ChevronDown } from 'lucide-react'
import { useLeagues } from '@/context/useLeagues'

export default function Navbar() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const navigate = useNavigate()

  const { leagues } = useLeagues()

  const activeLeagues = leagues.filter((l) => l.is_active)
  const pendingLeagues = leagues.filter((l) => l.status === 'pending')

  function handleLeagueSelect(id: number) {
    navigate(`/leagues/${id}`)
    setSheetOpen(false)
  }

  return (
    <nav className="border-b border-border px-6 py-3 flex items-center justify-between">
      {/* Left: Logo + Leagues dropdown */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="LRC" className="h-8 w-auto" />
          <span className="text-xl font-bold tracking-tight">LRC Leagues</span>
        </Link>

        {/* Leagues dropdown — desktop only */}
        <div className="hidden sm:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1">
                Leagues <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {activeLeagues.length === 0 && pendingLeagues.length === 0 && (
                <DropdownMenuItem disabled>No leagues</DropdownMenuItem>
              )}
              {activeLeagues.length > 0 && (
                <>
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">Active</DropdownMenuItem>
                  {activeLeagues.map((league) => (
                    <DropdownMenuItem key={league.id} onClick={() => handleLeagueSelect(league.id)}>
                      {league.name}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              {pendingLeagues.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">Pending Setup</DropdownMenuItem>
                  {pendingLeagues.map((league) => (
                    <DropdownMenuItem key={league.id} onClick={() => handleLeagueSelect(league.id)}>
                      {league.name}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/leagues')}>
                View all leagues
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Right: Admin button — desktop only */}
      <div className="hidden sm:block">
        <Link to="/admin">
          <Button variant="outline" size="sm">Admin</Button>
        </Link>
      </div>

      {/* Mobile: Hamburger */}
      <div className="sm:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 mt-6">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-1">
                Active Leagues
              </p>
              {activeLeagues.length === 0 && (
                <p className="text-muted-foreground text-sm px-2">No active leagues</p>
              )}
              {activeLeagues.map((league) => (
                <Button key={league.id} variant="ghost" className="justify-start" onClick={() => handleLeagueSelect(league.id)}>
                  {league.name}
                </Button>
              ))}
              {pendingLeagues.length > 0 && (
                <>
                  <div className="border-t border-border my-2" />
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-1">
                    Pending Setup
                  </p>
                  {pendingLeagues.map((league) => (
                    <Button key={league.id} variant="ghost" className="justify-start" onClick={() => handleLeagueSelect(league.id)}>
                      {league.name}
                    </Button>
                  ))}
                </>
              )}
              <div className="border-t border-border my-2" />
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => { navigate('/leagues'); setSheetOpen(false) }}
              >
                All Leagues
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => { navigate('/admin'); setSheetOpen(false) }}
              >
                Admin
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
