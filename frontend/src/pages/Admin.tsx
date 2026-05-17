import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import Leagues from '@/pages/admin/Leagues'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export default function Admin() {
  const { password, input, setInput, error, verifying, handleUnlock } = useAdminAuth()

  if (!password) {
    return (
      <div className="max-w-sm mx-auto mt-16">
        <Card>
          <CardHeader>
            <CardTitle>Global Admin</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                placeholder="Enter admin password"
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
            </div>
            <Button onClick={handleUnlock} disabled={verifying}>
              {verifying ? 'Verifying...' : 'Unlock'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Global Admin</h1>
      <Leagues password={password} />
    </div>
  )
}
