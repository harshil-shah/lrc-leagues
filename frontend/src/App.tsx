import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import AllLeagues from '@/pages/AllLeagues'
import League from '@/pages/League'
import LeagueAdmin from '@/pages/league/Admin'
import Admin from '@/pages/Admin'
import NotFound from '@/pages/NotFound'
import { LeaguesProvider } from '@/context/LeaguesProvider'

export default function App() {
  return (
    <BrowserRouter>
      <LeaguesProvider>
        <Toaster />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/leagues" element={<AllLeagues />} />
            <Route path="/leagues/:leagueId" element={<League />} />
            <Route path="/leagues/:leagueId/admin" element={<LeagueAdmin />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </LeaguesProvider>
    </BrowserRouter>
  )
}
