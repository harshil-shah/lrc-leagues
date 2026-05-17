import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { getLeague, type League } from '@/api/client'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Standings from '@/pages/league/Standings'
import SubmitMatch from '@/pages/league/SubmitMatch'
import MatchHistory from '@/pages/league/MatchHistory'
import Rules from '@/pages/league/Rules'

export default function League() {
  const { leagueId } = useParams<{ leagueId: string }>()
  const [searchParams] = useSearchParams()
  const [league, setLeague] = useState<League | null>(null)
  const [error, setError] = useState<string | null>(null)

  const tab = searchParams.get('tab') ?? 'standings'

  useEffect(() => {
    if (!leagueId) return
    getLeague(Number(leagueId))
      .then(setLeague)
      .catch((e: Error) => setError(e.message))
  }, [leagueId])

  if (error) return <div className="text-destructive">Error: {error}</div>
  if (!league) return <div className="text-muted-foreground">Loading...</div>

  if (league.status === 'pending') {
    return (
      <div className="max-w-sm mx-auto mt-16">
        <div className="flex flex-col gap-4 text-center mb-8">
          <h1 className="text-2xl font-bold">{league.name}</h1>
          <Badge variant="outline" className="w-fit mx-auto">Pending Setup</Badge>
          <p className="text-muted-foreground">
            This league hasn't been set up yet. If you're the league administrator, log in below to complete the setup.
          </p>
        </div>
        <Link to={`/leagues/${leagueId}/admin`}>
          <Button className="w-full">League Admin Login</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{league.name}</h1>
          <Badge variant={league.is_active ? 'default' : 'secondary'}>
            {league.is_active ? 'Active' : 'Ended'}
          </Badge>
        </div>
      </div>

      {tab === 'standings' && <Standings leagueId={Number(leagueId)} />}
      {tab === 'submit-match' && <SubmitMatch leagueId={Number(leagueId)} />}
      {tab === 'match-history' && <MatchHistory leagueId={Number(leagueId)} />}
      {tab === 'rules' && <Rules league={league} />}
    </div>
  )
}
