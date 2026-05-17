import { useState } from 'react'
import { updateLeague, type League } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import ScoringExplainer from '@/components/ScoringExplainer'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

export default function Settings({
  league,
  password,
  onUpdated,
}: {
  league: League
  password: string
  onUpdated: (updated: League) => void
}) {
  const [name, setName] = useState(league.name)
  const [hasEndDate, setHasEndDate] = useState(league.ends_at !== null)
  const [endsAt, setEndsAt] = useState(league.ends_at ? league.ends_at.slice(0, 16) : '')
  const [baseWinPoints, setBaseWinPoints] = useState(String(league.base_win_points))
  const [baseLossPoints, setBaseLossPoints] = useState(String(league.base_loss_points))
  const [multiplier, setMultiplier] = useState(String(league.multiplier))
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    try {
      const updated = await updateLeague(league.id, {
        name: name.trim(),
        ends_at: hasEndDate && endsAt ? new Date(endsAt).toISOString() : null,
        base_win_points: parseFloat(baseWinPoints),
        base_loss_points: parseFloat(baseLossPoints),
        multiplier: parseFloat(multiplier),
      }, password)
      onUpdated(updated)
      toast.success('League settings updated')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>League Settings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-[160px_1fr] items-center gap-3">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="max-w-sm"
            />
          </div>
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
          <Button onClick={handleSave} disabled={loading} className="w-fit">
            {loading ? 'Saving...' : 'Save Settings'}
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
