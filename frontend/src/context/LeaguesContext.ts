import { createContext } from 'react'
import type { League } from '@/api/client'

export interface LeaguesContextType {
  leagues: League[]
  refetch: () => void
}

export const LeaguesContext = createContext<LeaguesContextType>({ leagues: [], refetch: () => {} })
