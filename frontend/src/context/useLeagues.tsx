import { useContext } from 'react'
import { LeaguesContext } from '@/context/LeaguesContext'

export function useLeagues() {
  return useContext(LeaguesContext)
}
