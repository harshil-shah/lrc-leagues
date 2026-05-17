import { useState } from 'react'
import { setupLeague, getLeagueDefaults, type League } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import ScoringExplainer from '@/components/ScoringExplainer'
import { useEffect } from 'react'
import { useLeagues } from '@/context/useLeagues'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

export default function Setup({
  league,
  password,
  onPublished,
}: {
  league: League
  password: string
  onPublished: (updated: League) => void
}) {
  const { refetch } = useLeagues()
  const [hasEndDate, setHasEndDate] = useState(false)
  const [endsAt, setEndsAt] = useState('')
  const [baseWinPoints, setBaseWinPoints] = useState('')
  const [baseLossPoints, setBaseLossPoints] = useState('')
  const [multiplier, setMultiplier] = useState('')
  const [numDivisions, setNumDivisions] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getLeagueDefaults().then((d) => {
      setBaseWinPoints(String(d.base_win_points))
      setBaseLossPoints(String(d.base_loss_points))
      setMultiplier(String(d.multiplier))
      setNumDivisions(String(d.num_divisions))
    }).catch((e: Error) => toast.error(e.message))
  }, [])

  async function handleSetup() {
    if (!baseWinPoints || !baseLossPoints || !multiplier || !numDivisions) {
      toast.error('Please fill in all fields')
      return
    }
    if (hasEndDate && !endsAt) {
      toast.error('Please set an end date')
      return
    }
    setLoading(true)
    try {
      const updated = await setupLeague(league.id, {
        ends_at: hasEndDate && endsAt ? new Date(endsAt).toISOString() : null,
        base_win_points: parseFloat(baseWinPoints),
        base_loss_points: parseFloat(baseLossPoints),
        multiplier: parseFloat(multiplier),
        num_divisions: parseInt(numDivisions),
      }, password)
      toast.success(`League '${league.name}' is now live!`)
      onPublished(updated)
      refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to publish league')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>League Setup</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="has-end-date"
                checked={hasEndDate}
                onCheckedChange={(checked) => setHasEndDate(checked === true)}
              />
              <Label htmlFor="has-end-date">Set end date</Label>
            </div>
            <div className="grid grid-cols-[160px_1fr] items-center gap-3">
              <Label className={!hasEndDate ? 'text-muted-foreground' : ''}>End date</Label>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                disabled={!hasEndDate}
                className={`max-w-sm ${!hasEndDate ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>
          <div className="grid grid-cols-[160px_1fr] items-center gap-3">
            <Label>Number of divisions</Label>
            <Input
              type="number"
              min={1}
              value={numDivisions}
              onChange={(e) => setNumDivisions(e.target.value)}
              className="max-w-32"
            />
          </div>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Points Rules</h4>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              The scoring examples below update live as you change the points rules.
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-[160px_1fr] items-center gap-3">
            <Label>Win points</Label>
            <Input
              type="number"
              value={baseWinPoints}
              onChange={(e) => setBaseWinPoints(e.target.value)}
              className="max-w-32"
            />
          </div>
          <div className="grid grid-cols-[160px_1fr] items-center gap-3">
            <Label>Loss points</Label>
            <Input
              type="number"
              value={baseLossPoints}
              onChange={(e) => setBaseLossPoints(e.target.value)}
              className="max-w-32"
            />
          </div>
          <div className="grid grid-cols-[160px_1fr] items-center gap-3">
            <Label>Multiplier</Label>
            <Input
              type="number"
              value={multiplier}
              onChange={(e) => setMultiplier(e.target.value)}
              className="max-w-32"
            />
          </div>
          <Button onClick={handleSetup} disabled={loading} className="w-fit">
            {loading ? 'Publishing...' : 'Publish League'}
          </Button>
        </CardContent>
      </Card>

      <ScoringExplainer
        baseWinPoints={parseFloat(baseWinPoints) || 0}
        baseLossPoints={parseFloat(baseLossPoints) || 0}
        multiplier={parseFloat(multiplier) || 0}
      />
    </div>
  )
}
