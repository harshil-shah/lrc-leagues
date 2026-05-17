import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LeagueExplainer() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How the Leagues Work</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
        <p>
          These are <span className="text-foreground font-medium">individual leagues</span> — you don't need to sign up with a partner. Just find other players in the league and play matches whenever works for you.
        </p>
        <p>
          Players are split into <span className="text-foreground font-medium">divisions</span> by the league administrator. Division 1 is the top division. You can play matches with and against anyone in the league, regardless of division.
        </p>
        <p>
          After each match, <span className="text-foreground font-medium">anyone can submit the result</span> using the Submit Match tab on the league page. Just select the four players, enter the scores, and submit.
        </p>
        <p>
          Points are awarded based on the result and the divisions of all four players involved. See the scoring section below for details.
        </p>
      </CardContent>
    </Card>
  )
}
