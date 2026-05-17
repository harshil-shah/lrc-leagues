import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function example(
  baseWinPoints: number,
  baseLossPoints: number,
  multiplier: number,
  myRank: number,
  partnerRank: number,
  oppRank1: number,
  oppRank2: number,
  won: boolean,
): number {
  const avgMyTeam = (myRank + partnerRank) / 2
  const avgOpp = (oppRank1 + oppRank2) / 2
  const strengthDiff = avgMyTeam - avgOpp
  if (won) {
    return baseWinPoints + strengthDiff * multiplier
  } else {
    return Math.min(baseLossPoints, baseLossPoints + strengthDiff * multiplier)
  }
}

function pts(n: number): string {
  return `${n > 0 ? '+' : ''}${n.toFixed(1)} pts`
}

export default function ScoringExplainer({
  baseWinPoints,
  baseLossPoints,
  multiplier,
}: {
  baseWinPoints: number
  baseLossPoints: number
  multiplier: number
}) {
  const examples = [
    {
      label: 'Two Div 1 players beat two Div 1 players',
      value: example(baseWinPoints, baseLossPoints, multiplier, 1, 1, 1, 1, true),
    },
    {
      label: 'Two Div 1 players beat two Div 2 players',
      value: example(baseWinPoints, baseLossPoints, multiplier, 1, 1, 2, 2, true),
    },
    {
      label: 'Two Div 2 players beat two Div 1 players',
      value: example(baseWinPoints, baseLossPoints, multiplier, 2, 2, 1, 1, true),
    },
    {
      label: 'Two Div 1 players lose to two Div 2 players',
      value: example(baseWinPoints, baseLossPoints, multiplier, 1, 1, 2, 2, false),
    },
    {
      label: 'Two Div 2 players lose to two Div 1 players',
      value: example(baseWinPoints, baseLossPoints, multiplier, 2, 2, 1, 1, false),
    },
    {
      label: 'Mixed team (Div 1 + Div 2) beat two Div 1 players',
      value: example(baseWinPoints, baseLossPoints, multiplier, 1, 2, 1, 1, true),
    },
    {
      label: 'Mixed team (Div 1 + Div 2) lose to two Div 2 players',
      value: example(baseWinPoints, baseLossPoints, multiplier, 1, 2, 2, 2, false),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>How Scoring Works</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <div className="flex flex-col gap-1 text-muted-foreground">
          <p>Points are calculated based on the division ranks of all four players in a match.</p>
          <p className="mt-2 font-mono text-xs bg-muted rounded p-2">
            strength_diff = avg(your team ranks) − avg(opponent ranks)
          </p>
          <p className="mt-1">A positive strength_diff means you're playing down (opponents are weaker). A negative strength_diff means you're playing up.</p>
          <p className="font-mono text-xs bg-muted rounded p-2 mt-2">
            win → {baseWinPoints} + strength_diff × {multiplier}
          </p>
          <p className="font-mono text-xs bg-muted rounded p-2">
            loss → min({baseLossPoints}, {baseLossPoints} + strength_diff × {multiplier})
          </p>
          <p className="mt-1">Losses are capped at {baseLossPoints} pts — you can never gain points from a loss, but you can go negative if you lose to a weaker division.</p>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold">Examples</h4>
          {examples.map((ex) => (
            <div key={ex.label} className="flex items-center justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0">
              <span className="text-muted-foreground">{ex.label}</span>
              <span className={`font-mono font-medium whitespace-nowrap ${ex.value < 0 ? 'text-destructive' : ex.value === 0 ? 'text-muted-foreground' : 'text-primary'}`}>
                {pts(ex.value)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
