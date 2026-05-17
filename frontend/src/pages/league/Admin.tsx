import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { getLeague, verifyLeagueAdmin, type League } from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import Players from '@/pages/league/admin/Players'
import Divisions from '@/pages/league/admin/Divisions'
import Setup from '@/pages/league/admin/Setup'
import Settings from '@/pages/league/admin/Settings'
import { useLeagueAdminAuth } from '@/hooks/useAdminAuth'

export default function LeagueAdmin() {
  const { leagueId } = useParams<{ leagueId: string }>()
  const [searchParams] = useSearchParams()
  const [league, setLeague] = useState<League | null>(null)
  const { password, input, setInput, error, verifying, handleUnlock } = useLeagueAdminAuth(Number(leagueId))

  const tab = searchParams.get('tab') ?? 'players'

  useEffect(() => {
    if (!leagueId) return
    getLeague(Number(leagueId)).then(setLeague).catch(() => {})
  }, [leagueId])

  async function unlock() {
    await handleUnlock(async (p) => {
      await verifyLeagueAdmin(Number(leagueId), p)
    })
  }

  if (!league) return <div className="text-muted-foreground">Loading...</div>

  if (!password) {
    return (
      <div className="max-w-sm mx-auto mt-16">
        <Card>
          <CardHeader>
            <CardTitle>{league.name} — Admin</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>League Admin Password</Label>
              <Input
                type="password"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && unlock()}
                placeholder="Enter league admin password"
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
            </div>
            <Button onClick={unlock} disabled={verifying}>
              {verifying ? 'Verifying...' : 'Unlock'}
            </Button>
            <Link to={`/leagues/${leagueId}`}>
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {league.name}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (league.status === 'pending') {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">{league.name} — Setup</h1>
        <Setup
          league={league}
          password={password}
          onPublished={(updated) => setLeague(updated)}
        />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{league.name} — Admin</h1>
      {tab === 'players' && <Players leagueId={Number(leagueId)} password={password} />}
      {tab === 'divisions' && <Divisions leagueId={Number(leagueId)} password={password} />}
      {tab === 'settings' && <Settings league={league} password={password} onUpdated={setLeague} />}
    </div>
  )
}
