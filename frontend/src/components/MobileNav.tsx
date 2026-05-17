import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import OuterSidebar from '@/components/OuterSidebar'
import InnerSidebar from '@/components/InnerSidebar'
import { type League } from '@/api/client'
import logo from '@/assets/logo.jpg'
import { Link } from 'react-router-dom'

export default function MobileNav({
  league,
  isAdminPage,
}: {
  league?: League
  isAdminPage?: boolean
}) {
  const [open, setOpen] = useState(false)

  function handleNavigate() {
    setOpen(false)
  }

  return (
    <div className="sm:hidden flex items-center justify-between px-4 py-3 border-b border-border">
      <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-3">
        <img src={logo} alt="LRC" className="h-8 w-auto" />
        <span className="font-bold tracking-tight">LRC Leagues</span>
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 [&>button]:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="flex h-full">
            <div className={league && league.status !== 'pending' ? 'w-40 border-r border-border' : 'w-full'}>
              <OuterSidebar onNavigate={handleNavigate} onNavigateKeepOpen={() => {}} />
            </div>
            {league && league.status !== 'pending' && (
              <div className="flex-1">
                <InnerSidebar
                  league={league}
                  isAdminPage={isAdminPage ?? false}
                  onNavigate={handleNavigate}
                />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
