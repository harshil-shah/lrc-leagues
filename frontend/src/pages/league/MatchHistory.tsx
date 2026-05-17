import { useEffect, useState } from 'react'
import { getMatches, getPlayers, updateMatch, deleteMatch, type Match, type MatchPlayerDetail, type Player } from '@/api/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

function toLocalDatetimeString(dateStr: string): string {
  const date = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function MatchHistory({ leagueId }: { leagueId: number }) {
  const [matches, setMatches] = useState<Match[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [filterPlayerId, setFilterPlayerId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTeamAScore, setEditTeamAScore] = useState('')
  const [editTeamBScore, setEditTeamBScore] = useState('')
  const [editPlayedAt, setEditPlayedAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMatches(leagueId)
      .then(setMatches)
      .catch((e: Error) => setError(e.message))
    getPlayers(leagueId)
      .then(setPlayers)
      .catch((e: Error) => setError(e.message))
  }, [leagueId])

  const filteredMatches = filterPlayerId === null
    ? matches
    : matches.filter((m) =>
        [m.team_a_player_1, m.team_a_player_2, m.team_b_player_1, m.team_b_player_2]
          .some((p) => p.player_id === filterPlayerId)
      )

  function startEditing(match: Match) {
    setEditingId(match.id)
    setEditTeamAScore(String(match.team_a_score))
    setEditTeamBScore(String(match.team_b_score))
    setEditPlayedAt(toLocalDatetimeString(match.played_at))
  }

  async function handleUpdate(match: Match) {
    const scoreA = parseInt(editTeamAScore)
    const scoreB = parseInt(editTeamBScore)
    if (isNaN(scoreA) || isNaN(scoreB)) {
      toast.error('Please enter valid scores')
      return
    }
    if (scoreA === scoreB) {
      toast.error('Scores cannot be equal — there must be a winner')
      return
    }
    setLoading(true)
    try {
      const updated = await updateMatch(match.id, {
        team_a_score: scoreA,
        team_b_score: scoreB,
        played_at: new Date(editPlayedAt).toISOString(),
      })
      setMatches((prev) => prev.map((m) => (m.id === match.id ? updated : m)))
      setEditingId(null)
      toast.success('Match updated')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update match')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    setLoading(true)
    try {
      await deleteMatch(id)
      setMatches((prev) => prev.filter((m) => m.id !== id))
      toast.success('Match deleted')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete match')
    } finally {
      setLoading(false)
    }
  }

  if (error) return <div className="text-destructive">Error: {error}</div>

  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex items-center gap-3">
        <Select
          value={filterPlayerId === null ? 'all' : String(filterPlayerId)}
          onValueChange={(v) => setFilterPlayerId(v === 'all' ? null : Number(v))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by player" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All players</SelectItem>
            {players.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filterPlayerId !== null && (
          <span className="text-muted-foreground text-sm">
            {filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''}
          </span>
        )}
      </div>

      {filteredMatches.length === 0 && (
        <p className="text-muted-foreground">No matches found.</p>
      )}

      {filteredMatches.map((match) => (
        <Card key={match.id}>
          <CardContent className="pt-4">
            {editingId === match.id ? (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">{match.team_a_player_1.player_name}</p>
                    <p className="font-medium">{match.team_a_player_2.player_name}</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editTeamAScore}
                        onChange={(e) => setEditTeamAScore(e.target.value)}
                        className="w-16 text-center"
                        min={0}
                      />
                      <span className="text-muted-foreground">–</span>
                      <Input
                        type="number"
                        value={editTeamBScore}
                        onChange={(e) => setEditTeamBScore(e.target.value)}
                        className="w-16 text-center"
                        min={0}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 sm:items-end">
                    <p className="font-medium">{match.team_b_player_1.player_name}</p>
                    <p className="font-medium">{match.team_b_player_2.player_name}</p>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-3">
                  <Label>Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={editPlayedAt}
                    onChange={(e) => setEditPlayedAt(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleUpdate(match)} disabled={loading}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-muted-foreground text-sm">
                    {new Date(match.played_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEditing(match)}>Edit</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete match?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this match and cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(match.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <MatchDisplay match={match} />
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function MatchDisplay({ match }: { match: Match }) {
  const teamAWon = match.team_a_score > match.team_b_score

  const winner = teamAWon
    ? { player1: match.team_a_player_1, player2: match.team_a_player_2, score: match.team_a_score }
    : { player1: match.team_b_player_1, player2: match.team_b_player_2, score: match.team_b_score }

  const loser = teamAWon
    ? { player1: match.team_b_player_1, player2: match.team_b_player_2, score: match.team_b_score }
    : { player1: match.team_a_player_1, player2: match.team_a_player_2, score: match.team_a_score }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-4">
      <TeamColumn player1={winner.player1} player2={winner.player2} muted={false} align="left" />
      <div className="flex flex-col items-center gap-1">
        <span className="text-2xl font-bold">{winner.score} – {loser.score}</span>
      </div>
      <TeamColumn player1={loser.player1} player2={loser.player2} muted={true} align="right" />
    </div>
  )
}

function TeamColumn({
  player1,
  player2,
  muted,
  align,
}: {
  player1: MatchPlayerDetail
  player2: MatchPlayerDetail
  muted: boolean
  align: 'left' | 'right'
}) {
  const alignClass = align === 'left' ? 'items-start' : 'sm:items-end'

  return (
    <div className={`flex flex-col gap-2 ${alignClass} w-full`}>
      <PlayerRow player={player1} align={align} muted={muted} />
      <PlayerRow player={player2} align={align} muted={muted} />
    </div>
  )
}

function PlayerRow({ player, align, muted }: { player: MatchPlayerDetail, align: 'left' | 'right', muted: boolean }) {
  const alignClass = align === 'left' ? 'sm:flex-row' : 'sm:flex-row-reverse'

  return (
    <div className={`flex flex-row ${alignClass} items-center gap-2 ${muted ? 'opacity-50' : ''}`}>
      <span className="font-medium">{player.player_name}</span>
      <Badge variant="outline" className="text-xs">{player.division_name}</Badge>
      <span className="text-muted-foreground text-xs">
        {player.points_earned > 0 ? '+' : ''}{player.points_earned.toFixed(1)} pts
      </span>
    </div>
  )
}
