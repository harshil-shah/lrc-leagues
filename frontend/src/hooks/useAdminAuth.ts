import { useState } from 'react'
import { verifyAdmin } from '@/api/client'

const EXPIRY_MS = 60 * 60 * 1000 // 1 hour

function getStored(key: string): string | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const { password, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > EXPIRY_MS) {
      sessionStorage.removeItem(key)
      return null
    }
    return password
  } catch {
    return null
  }
}

function store(key: string, password: string) {
  sessionStorage.setItem(key, JSON.stringify({ password, timestamp: Date.now() }))
}

export function useAdminAuth() {
  const [password, setPassword] = useState<string>(() => getStored('admin_password') ?? '')
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  async function handleUnlock() {
    if (!input.trim()) {
      setError('Please enter a password')
      return
    }
    setVerifying(true)
    try {
      await verifyAdmin(input.trim())
      store('admin_password', input.trim())
      setPassword(input.trim())
      setError(null)
    } catch {
      setError('Incorrect password')
    } finally {
      setVerifying(false)
    }
  }

  return { password, input, setInput, error, verifying, handleUnlock }
}

export function useLeagueAdminAuth(leagueId: number) {
  const key = `league_admin_password_${leagueId}`
  const [password, setPassword] = useState<string>(() => getStored(key) ?? '')
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  async function handleUnlock(verify: (password: string) => Promise<void>) {
    if (!input.trim()) {
      setError('Please enter a password')
      return
    }
    setVerifying(true)
    try {
      await verify(input.trim())
      store(key, input.trim())
      setPassword(input.trim())
      setError(null)
    } catch {
      setError('Incorrect password')
    } finally {
      setVerifying(false)
    }
  }

  return { password, input, setInput, error, verifying, handleUnlock }
}
