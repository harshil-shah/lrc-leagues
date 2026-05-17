import { useEffect, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  getPlayers, getDivisions, getMatches, createDivision, updateDivision, deleteDivision,
  assignPlayerDivision,
  type Player, type Division, type Match
} from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

function DraggablePlayer({ player, locked }: { player: Player; locked: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `player-${player.id}`,
    data: { player },
    disabled: locked,
  })

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(locked ? {} : listeners)}
      {...(locked ? {} : attributes)}
      className={`${locked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing touch-none'} ${isDragging ? 'opacity-0' : ''}`}
      title={locked ? 'Cannot reassign — player has match history' : undefined}
    >
      <Badge
        variant={locked ? 'outline' : 'secondary'}
        className={`select-none ${locked ? 'opacity-50' : ''}`}
      >
        {player.name} {locked ? '🔒' : ''}
      </Badge>
    </div>
  )
}

function DroppableZone({
  id,
  title,
  players,
  isOver,
  playersWithMatches,
  onEdit,
  onDelete,
  showActions,
}: {
  id: string
  title: string
  players: Player[]
  isOver: boolean
  playersWithMatches: Set<number>
  onEdit?: () => void
  onDelete?: () => void
  showActions?: boolean
}) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <Card ref={setNodeRef} className={`transition-colors ${isOver ? 'border-primary' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {showActions && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>Edit</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete division?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete the division and rerank remaining divisions. Players in this division will become unassigned.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardHeader>
      <CardContent className="min-h-16 flex flex-wrap gap-2">
        {players.length === 0 && (
          <p className="text-muted-foreground text-sm">Drop players here</p>
        )}
        {players.map((p) => (
          <DraggablePlayer key={p.id} player={p} locked={playersWithMatches.has(p.id)} />
        ))}
      </CardContent>
    </Card>
  )
}

export default function Divisions({ leagueId, password }: { leagueId: number; password: string }) {
  const [divisions, setDivisions] = useState<Division[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [activePlayer, setActivePlayer] = useState<Player | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editRank, setEditRank] = useState('')
  const [newName, setNewName] = useState('')
  const [newRank, setNewRank] = useState('')
  const [loading, setLoading] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  useEffect(() => {
    getDivisions(leagueId)
      .then((divs) => setDivisions(divs.sort((a, b) => a.rank - b.rank)))
      .catch((e: Error) => toast.error(e.message))
    getPlayers(leagueId)
      .then(setPlayers)
      .catch((e: Error) => toast.error(e.message))
    getMatches(leagueId)
      .then(setMatches)
      .catch((e: Error) => toast.error(e.message))
  }, [leagueId])

  const playersWithMatches = new Set(
    matches.flatMap((m) => [
      m.team_a_player_1.player_id,
      m.team_a_player_2.player_id,
      m.team_b_player_1.player_id,
      m.team_b_player_2.player_id,
    ])
  )

  const unassignedPlayers = players.filter((p) => p.division_id === null)

  function playersInDivision(divisionId: number): Player[] {
    return players.filter((p) => p.division_id === divisionId)
  }

  function handleDragStart(event: DragStartEvent) {
    setActivePlayer(event.active.data.current?.player as Player)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActivePlayer(null)
    setOverId(null)

    const { over, active } = event
    if (!over) return

    const player = active.data.current?.player as Player
    const targetId = over.id as string

    const newDivisionId = targetId === 'unassigned'
      ? null
      : parseInt(targetId.replace('division-', ''))

    if (player.division_id === newDivisionId) return
    if (targetId === 'unassigned' && playersWithMatches.has(player.id)) {
      toast.error('Cannot unassign — player has match history')
      return
    }

    const previousPlayers = players
    setPlayers((prev) => prev.map((p) =>
      p.id === player.id ? { ...p, division_id: newDivisionId } : p
    ))

    try {
      const updated = await assignPlayerDivision(leagueId, player.id, newDivisionId, password)
      setPlayers((prev) => prev.map((p) => (p.id === player.id ? updated : p)))
      toast.success(newDivisionId ? `${player.name} assigned` : `${player.name} unassigned`)
    } catch (e) {
      setPlayers(previousPlayers)
      toast.error(e instanceof Error ? e.message : 'Failed to assign player')
    }
  }

  async function handleCreateDivision() {
    if (!newName.trim() || !newRank) return
    setLoading(true)
    try {
      const division = await createDivision(leagueId, { name: newName.trim(), rank: parseInt(newRank) }, password)
      setDivisions((prev) => [...prev, division].sort((a, b) => a.rank - b.rank))
      setNewName('')
      setNewRank('')
      toast.success(`Division '${division.name}' created`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create division')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateDivision(id: number) {
    if (!editName.trim() || !editRank) return
    setLoading(true)
    try {
      const division = await updateDivision(leagueId, id, { name: editName.trim(), rank: parseInt(editRank) }, password)
      setDivisions((prev) => prev.map((d) => (d.id === id ? division : d)).sort((a, b) => a.rank - b.rank))
      setEditingId(null)
      toast.success(`Division updated`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update division')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteDivision(id: number) {
    setLoading(true)
    try {
      await deleteDivision(leagueId, id, password)
      setDivisions((prev) => {
        const deleted = prev.find((d) => d.id === id)
        if (!deleted) return prev
        return prev
          .filter((d) => d.id !== id)
          .map((d) => d.rank > deleted.rank
            ? { ...d, rank: d.rank - 1, name: `Division ${d.rank - 1}` }
            : d
          )
          .sort((a, b) => a.rank - b.rank)
      })
      setPlayers((prev) => prev.map((p) => p.division_id === id ? { ...p, division_id: null } : p))
      toast.success('Division deleted')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete division')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Division</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-[120px_1fr] items-center gap-3">
            <Label>Name</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Division 3"
              className="max-w-sm"
            />
          </div>
          <div className="grid grid-cols-[120px_1fr] items-center gap-3">
            <Label>Rank</Label>
            <Input
              type="number"
              min={1}
              value={newRank}
              onChange={(e) => setNewRank(e.target.value)}
              className="max-w-32"
            />
          </div>
          <Button onClick={handleCreateDivision} disabled={loading} className="w-fit">
            Add Division
          </Button>
        </CardContent>
      </Card>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => setOverId(e.over?.id as string ?? null)}
      >
        <DroppableZone
          id="unassigned"
          title="Unassigned Players"
          players={unassignedPlayers}
          isOver={overId === 'unassigned'}
          playersWithMatches={playersWithMatches}
        />

        {divisions.map((division) => (
          <div key={division.id}>
            {editingId === division.id ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Edit Division</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="grid grid-cols-[120px_1fr] items-center gap-3">
                    <Label>Name</Label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="max-w-sm"
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-center gap-3">
                    <Label>Rank</Label>
                    <Input
                      type="number"
                      min={1}
                      value={editRank}
                      onChange={(e) => setEditRank(e.target.value)}
                      className="max-w-32"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdateDivision(division.id)} disabled={loading}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <DroppableZone
                id={`division-${division.id}`}
                title={division.name}
                players={playersInDivision(division.id)}
                isOver={overId === `division-${division.id}`}
                playersWithMatches={playersWithMatches}
                showActions
                onEdit={() => {
                  setEditingId(division.id)
                  setEditName(division.name)
                  setEditRank(String(division.rank))
                }}
                onDelete={() => handleDeleteDivision(division.id)}
              />
            )}
          </div>
        ))}

        <DragOverlay>
          {activePlayer && (
            <Badge variant="secondary" className="cursor-grabbing shadow-lg">
              {activePlayer.name}
            </Badge>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
