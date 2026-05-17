import { useEffect, useState } from 'react'
import { getPlayers, createMatch, type Player } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function SubmitMatch({ leagueId }: { leagueId: number }) {
  const [players, setPlayers] = useState<Player[]>([])
  const [teamAPlayer1, setTeamAPlayer1] = useState<number | null>(null)
  const [teamAPlayer2, setTeamAPlayer2] = useState<number | null>(null)
  const [teamBPlayer1, setTeamBPlayer1] = useState<number | null>(null)
  const [teamBPlayer2, setTeamBPlayer2] = useState<number | null>(null)
  const [teamAScore, setTeamAScore] = useState<string>('')
  const [teamBScore, setTeamBScore] = useState<string>('')
  const [playedAt, setPlayedAt] = useState<string>(toLocalDatetimeString(new Date()))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPlayers(leagueId)
      .then((ps) => setPlayers(ps.filter((p) => p.division_id !== null)))
      .catch((e: Error) => setError(e.message))
  }, [leagueId])

  const selectedIds = new Set(
    [teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2].filter((id): id is number => id !== null)
  )

  function availablePlayers(currentId: number | null): Player[] {
    return players.filter((p) => p.id === currentId || !selectedIds.has(p.id))
  }

  async function handleSubmit() {
    if (!teamAPlayer1 || !teamAPlayer2 || !teamBPlayer1 || !teamBPlayer2) {
      toast.error('Please select all 4 players')
      return
    }
    const scoreA = parseInt(teamAScore)
    const scoreB = parseInt(teamBScore)
    if (isNaN(scoreA) || isNaN(scoreB)) {
      toast.error('Please enter valid scores')
      return
    }
    if (scoreA === scoreB) {
      toast.error('Scores cannot be equal — there must be a winner')
      return
    }
    setSubmitting(true)
    try {
      await createMatch({
        league_id: leagueId,
        team_a_player_1_id: teamAPlayer1,
        team_a_player_2_id: teamAPlayer2,
        team_b_player_1_id: teamBPlayer1,
        team_b_player_2_id: teamBPlayer2,
        team_a_score: scoreA,
        team_b_score: scoreB,
        played_at: new Date(playedAt).toISOString(),
      })
      toast.success('Match submitted!')
      setTeamAPlayer1(null)
      setTeamAPlayer2(null)
      setTeamBPlayer1(null)
      setTeamBPlayer2(null)
      setTeamAScore('')
      setTeamBScore('')
      setPlayedAt(toLocalDatetimeString(new Date()))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit match')
    } finally {
      setSubmitting(false)
    }
  }

  if (error) return <div className="text-destructive">Error: {error}</div>

  return (
    <div className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Submit a Match</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-4">
            <TeamSection
              title="Team A"
              player1={teamAPlayer1}
              player2={teamAPlayer2}
              score={teamAScore}
              onPlayer1Change={setTeamAPlayer1}
              onPlayer2Change={setTeamAPlayer2}
              onScoreChange={setTeamAScore}
              availablePlayers={availablePlayers}
              align="left"
            />
            <div className="hidden sm:flex items-center justify-center text-2xl font-bold text-muted-foreground">
              vs
            </div>
            <TeamSection
              title="Team B"
              player1={teamBPlayer1}
              player2={teamBPlayer2}
              score={teamBScore}
              onPlayer1Change={setTeamBPlayer1}
              onPlayer2Change={setTeamBPlayer2}
              onScoreChange={setTeamBScore}
              availablePlayers={availablePlayers}
              align="right"
            />
          </div>
          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <Label>Date & Time</Label>
            <Input
              type="datetime-local"
              value={playedAt}
              onChange={(e) => setPlayedAt(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Match'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function TeamSection({
  title,
  player1,
  player2,
  score,
  onPlayer1Change,
  onPlayer2Change,
  onScoreChange,
  availablePlayers,
  align,
}: {
  title: string
  player1: number | null
  player2: number | null
  score: string
  onPlayer1Change: (id: number | null) => void
  onPlayer2Change: (id: number | null) => void
  onScoreChange: (score: string) => void
  availablePlayers: (currentId: number | null) => Player[]
  align: 'left' | 'right'
}) {
  const alignClass = align === 'left' ? 'items-start' : 'sm:items-end'

  return (
    <div className={`flex flex-col gap-3 ${alignClass}`}>
      <h3 className="font-semibold">{title}</h3>
      <PlayerSelect
        value={player1}
        onChange={onPlayer1Change}
        players={availablePlayers(player1)}
        placeholder="Player 1"
      />
      <PlayerSelect
        value={player2}
        onChange={onPlayer2Change}
        players={availablePlayers(player2)}
        placeholder="Player 2"
      />
      <Input
        type="number"
        min={0}
        value={score}
        onChange={(e) => onScoreChange(e.target.value)}
        placeholder="Score"
        className="w-24"
      />
    </div>
  )
}

function PlayerSelect({
  value,
  onChange,
  players,
  placeholder,
}: {
  value: number | null
  onChange: (id: number | null) => void
  players: Player[]
  placeholder: string
}) {
  return (
    <Select
      value={value === null ? 'none' : String(value)}
      onValueChange={(v) => onChange(v === 'none' ? null : Number(v))}
    >
      <SelectTrigger className="w-48">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">{placeholder}</SelectItem>
        {players.map((p) => (
          <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
