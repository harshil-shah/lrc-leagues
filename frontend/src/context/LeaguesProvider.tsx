import { useEffect, useState, useCallback } from 'react'
import { getLeagues, type League } from '@/api/client'
import { LeaguesContext } from '@/context/LeaguesContext'

export function LeaguesProvider({ children }: { children: React.ReactNode }) {
  const [leagues, setLeagues] = useState<League[]>([])

  const refetch = useCallback(() => {
    getLeagues().then(setLeagues).catch(() => {})
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return (
    <LeaguesContext.Provider value={{ leagues, refetch }}>
      {children}
    </LeaguesContext.Provider>
  )
}
