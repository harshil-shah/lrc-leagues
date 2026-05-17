import { useEffect, useState } from 'react'
import { getLeagues, createLeague, deleteLeague, type League } from '@/api/client'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useLeagues } from '@/context/useLeagues'

export default function Leagues({ password }: { password: string }) {
  const { refetch } = useLeagues()
  const [leagues, setLeagues] = useState<League[]>([])
  const [newName, setNewName] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getLeagues().then(setLeagues).catch((e: Error) => toast.error(e.message))
  }, [])

  async function handleCreate() {
    if (!newName.trim() || !newAdminPassword.trim()) return
    setLoading(true)
    try {
      const league = await createLeague({
        name: newName.trim(),
        admin_password: newAdminPassword.trim(),
      }, password)
      setLeagues((prev) => [...prev, league])
      refetch()
      setNewName('')
      setNewAdminPassword('')
      toast.success(`League '${league.name}' created`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create league')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number, name: string) {
    setLoading(true)
    try {
      await deleteLeague(id, password)
      setLeagues((prev) => prev.filter((l) => l.id !== id))
      refetch()
      toast.success(`League '${name}' deleted`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete league')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 mt-4">
      <Card>
        <CardContent className="px-4">
          <Accordion type="single" collapsible>
            <AccordionItem value="create" className="border-0">
              <AccordionTrigger className="text-lg font-semibold">Create League</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-4 pt-2 pb-4">
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <Label>Name</Label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Name"
                      className="max-w-sm"
                    />
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <Label>Admin Password</Label>
                    <Input
                      type="password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="Password"
                      className="max-w-sm"
                    />
                  </div>
                  <Button onClick={handleCreate} disabled={loading} className="w-fit">
                    Create League
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leagues</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col">
          {leagues.length === 0 && (
            <p className="text-muted-foreground">No leagues yet.</p>
          )}
          {leagues.map((league) => (
            <div key={league.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <span className="font-medium">{league.name}</span>
                <Badge variant={league.status === 'pending' ? 'outline' : league.is_active ? 'default' : 'secondary'}>
                  {league.status === 'pending' ? 'Pending' : league.is_active ? 'Active' : 'Ended'}
                </Badge>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" disabled={loading}>Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete league?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete '{league.name}' and all its matches, divisions and players.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(league.id, league.name)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
