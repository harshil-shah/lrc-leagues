import { type League } from '@/api/client'
import ScoringExplainer from '@/components/ScoringExplainer'

export default function Rules({ league }: { league: League }) {
  return (
    <div className="flex flex-col gap-6 mt-4">
      <ScoringExplainer
        baseWinPoints={league.base_win_points}
        baseLossPoints={league.base_loss_points}
        multiplier={league.multiplier}
      />
    </div>
  )
}
