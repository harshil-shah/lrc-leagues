import { useEffect, useState } from 'react'
import { getStandings, type DivisionStandings, type PlayerStanding } from '@/api/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Standings({ leagueId }: { leagueId: number }) {
  const [standings, setStandings] = useState<DivisionStandings[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getStandings(leagueId)
      .then(setStandings)
      .catch((e: Error) => setError(e.message))
  }, [leagueId])

  if (error) return <div className="text-destructive">Error: {error}</div>
  if (standings.length === 0) return <div className="text-muted-foreground mt-4">No standings yet.</div>

  return (
    <div className="flex flex-col gap-8 mt-4">
      {standings.map((division) => (
        <Card key={division.division_id}>
          <CardHeader>
            <CardTitle>{division.division_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="sticky left-0 z-10 bg-card w-8">#</TableHead>
                    <TableHead className="sticky left-8 z-10 bg-card w-20 max-w-20 sm:w-48 sm:max-w-48">Player</TableHead>
                    <TableHead className="w-10 text-right whitespace-nowrap">P</TableHead>
                    <TableHead className="w-10 text-right whitespace-nowrap">W</TableHead>
                    <TableHead className="w-10 text-right whitespace-nowrap">L</TableHead>
                    <TableHead className="w-14 text-right whitespace-nowrap">+/-</TableHead>
                    <TableHead className="w-14 text-right whitespace-nowrap">Pts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {division.standings.map((player: PlayerStanding, index: number) => (
                    <TableRow key={player.player_id} className="bg-card hover:bg-muted [&>td.sticky]:bg-inherit">
                      <TableCell className="sticky left-0 z-10">{index + 1}</TableCell>
                      <TableCell className="sticky left-8 z-10 w-20 max-w-20 sm:w-48 sm:max-w-48 truncate font-medium">{player.player_name}</TableCell>
                      <TableCell className="w-10 text-right">{player.matches_played}</TableCell>
                      <TableCell className="w-10 text-right">{player.wins}</TableCell>
                      <TableCell className="w-10 text-right">{player.losses}</TableCell>
                      <TableCell className="w-14 text-right">
                        {player.points_for - player.points_against > 0 ? '+' : ''}
                        {player.points_for - player.points_against}
                      </TableCell>
                      <TableCell className="w-14 text-right font-bold">{player.points.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
