import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLeagues, type League } from '@/api/client'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AllLeagues() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getLeagues()
      .then(setLeagues)
      .catch((e: Error) => setError(e.message))
  }, [])

  const activeLeagues = leagues.filter((l) => l.status === 'active' && l.is_active)
  const endedLeagues = leagues.filter((l) => l.status === 'active' && !l.is_active)
  const pendingLeagues = leagues.filter((l) => l.status === 'pending')

  if (error) {
    return <div className="p-8 text-destructive">Error: {error}</div>
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <h1 className="text-3xl font-bold">All Leagues</h1>

      {leagues.length === 0 && (
        <p className="text-muted-foreground">No leagues yet.</p>
      )}

      {activeLeagues.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Active</h2>
          <div className="flex flex-col gap-3">
            {activeLeagues.map((league) => (
              <LeagueCard key={league.id} league={league} />
            ))}
          </div>
        </section>
      )}

      {pendingLeagues.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Pending Setup</h2>
          <div className="flex flex-col gap-3">
            {pendingLeagues.map((league) => (
              <LeagueCard key={league.id} league={league} />
            ))}
          </div>
        </section>
      )}

      {endedLeagues.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Past</h2>
          <div className="flex flex-col gap-3">
            {endedLeagues.map((league) => (
              <LeagueCard key={league.id} league={league} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function LeagueCard({ league }: { league: League }) {
  const endDate = league.ends_at
    ? new Date(league.ends_at).toLocaleDateString()
    : null

  return (
    <Link to={`/leagues/${league.id}`}>
      <Card className={league.status === 'pending' || !league.is_active ? 'opacity-60' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{league.name}</CardTitle>
            {league.status === 'pending' && (
              <Badge variant="outline">Pending Setup</Badge>
            )}
            {league.status === 'active' && !league.is_active && (
              <Badge variant="secondary">Ended {endDate}</Badge>
            )}
          </div>
          {league.status === 'active' && league.is_active && endDate && (
            <CardDescription>Ends {endDate}</CardDescription>
          )}
        </CardHeader>
      </Card>
    </Link>
  )
}
