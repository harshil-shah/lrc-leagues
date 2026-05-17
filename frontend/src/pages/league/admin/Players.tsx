import { useEffect, useState } from 'react'
import { getPlayers, createPlayer, updatePlayer, deletePlayer, type Player } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function Players({ leagueId, password }: { leagueId: number; password: string }) {
  const [players, setPlayers] = useState<Player[]>([])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getPlayers(leagueId).then(setPlayers).catch((e: Error) => toast.error(e.message))
  }, [leagueId])

  async function handleCreate() {
    if (!newName.trim()) return
    setLoading(true)
    try {
      const player = await createPlayer(leagueId, newName.trim(), password)
      setPlayers((prev) => [...prev, player])
      setNewName('')
      toast.success(`Player '${player.name}' created`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create player')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate(id: number) {
    if (!editingName.trim()) return
    setLoading(true)
    try {
      const player = await updatePlayer(leagueId, id, editingName.trim(), password)
      setPlayers((prev) => prev.map((p) => (p.id === id ? player : p)))
      setEditingId(null)
      setEditingName('')
      toast.success(`Player renamed to '${player.name}'`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update player')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number, name: string) {
    setLoading(true)
    try {
      await deletePlayer(leagueId, id, password)
      setPlayers((prev) => prev.filter((p) => p.id !== id))
      toast.success(`Player '${name}' deleted`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete player')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Player</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Player name"
            className="max-w-sm"
          />
          <Button onClick={handleCreate} disabled={loading}>Add</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Players</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {players.length === 0 && (
            <p className="text-muted-foreground">No players yet.</p>
          )}
          {players.map((player) => (
            <div key={player.id} className="flex items-center justify-between gap-3 py-1 border-b border-border last:border-0">
              {editingId === player.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(player.id)}
                    className="max-w-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdate(player.id)} disabled={loading}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </>
              ) : (
                <>
                  <span>{player.name}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditingId(player.id); setEditingName(player.name) }}
                    >
                      Rename
                    </Button>
                    {!player.has_matches && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(player.id, player.name)}
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
