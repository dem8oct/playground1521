import { useRef } from 'react'
import { PageLayout, Button } from '../ui'
import { useAuth } from '../../contexts/AuthContext'
import { useSession } from '../../contexts/SessionContext'
import MatchLoggingForm from './MatchLoggingForm'
import MatchHistory from './MatchHistory'
import toast from 'react-hot-toast'

interface DashboardProps {
  onBackToLobby: () => void
}

export default function Dashboard({ onBackToLobby }: DashboardProps) {
  const { user, signOut } = useAuth()
  const { sessionPlayers } = useSession()
  const matchHistoryRef = useRef<HTMLElement>(null)

  async function handleSignOut() {
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  function scrollToMatchHistory() {
    // Scroll to match history section after successful match submission
    // Delay to allow React Query to refetch and render new data
    setTimeout(() => {
      matchHistoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 300)
  }

  const canLogMatches = sessionPlayers.length >= 4

  return (
    <PageLayout
      header={
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <h1 className="font-display text-2xl text-gradient-neon">
            DASHBOARD
          </h1>
          <div className="flex gap-3 items-center flex-wrap">
            {user && (
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onBackToLobby}>
              Back to Lobby
            </Button>
          </div>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Warning if not enough players */}
        {!canLogMatches && (
          <div className="bg-yellow-500/10 border-4 border-yellow-500/50 p-4">
            <p className="font-mono text-yellow-500 text-center">
              ⚠️ Need at least 4 players to log matches. Add more players in the lobby.
            </p>
          </div>
        )}

        {/* Match Logging Form */}
        {canLogMatches && (
          <section>
            <MatchLoggingForm onSuccess={scrollToMatchHistory} />
          </section>
        )}

        {/* Match History */}
        <section ref={matchHistoryRef}>
          <MatchHistory />
        </section>
      </div>
    </PageLayout>
  )
}
