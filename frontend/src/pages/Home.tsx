import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import LeagueExplainer from '@/components/LeagueExplainer'

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-10">
      <div className="flex flex-col gap-4 text-center py-10">
        <h1 className="text-5xl font-bold tracking-tight">LRC Leagues</h1>
        <p className="text-xl text-muted-foreground">
          Individual roundnet leagues for LRC members. Play with anyone, track your progress, climb the rankings.
        </p>
        <div className="flex gap-3 justify-center mt-4">
          <Link to="/leagues">
            <Button size="lg">View Leagues</Button>
          </Link>
        </div>
      </div>

      <LeagueExplainer />
    </div>
  )
}
