import { PageLayout, Button, Tabs } from '../ui'
import { useAuth } from '../../contexts/AuthContext'
import { useSession } from '../../contexts/SessionContext'
import MatchLoggingForm from './MatchLoggingForm'
import MatchHistory from './MatchHistory'
import { PlayerLeaderboard, PairLeaderboard } from '../leaderboards'
import toast from 'react-hot-toast'

interface DashboardProps {
  onBackToLobby: () => void
}

export default function Dashboard({ onBackToLobby }: DashboardProps) {
  const { user, signOut } = useAuth()
  const { sessionPlayers } = useSession()

  async function handleSignOut() {
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  const canLogMatches = sessionPlayers.length >= 3

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
      <div className="max-w-6xl mx-auto">
        {/* Warning if not enough players */}
        {!canLogMatches && (
          <div className="bg-yellow-500/10 border-4 border-yellow-500/50 p-4 mb-6">
            <p className="font-mono text-yellow-500 text-center">
              ⚠️ Need at least 3 players to log matches (4th player optional for 2v1). Add more players in the lobby.
            </p>
          </div>
        )}

        {/* Tabbed Interface */}
        <Tabs defaultValue={canLogMatches ? "log" : "history"}>
          <Tabs.List>
            {canLogMatches && (
              <Tabs.Trigger value="log">
                ⚽ LOG MATCH
              </Tabs.Trigger>
            )}
            <Tabs.Trigger value="history">
              📊 HISTORY
            </Tabs.Trigger>
            <Tabs.Trigger value="leaderboards">
              🏆 LEADERBOARDS
            </Tabs.Trigger>
          </Tabs.List>

          {/* Log Match Tab */}
          {canLogMatches && (
            <Tabs.Content value="log">
              <MatchLoggingForm />
            </Tabs.Content>
          )}

          {/* History Tab */}
          <Tabs.Content value="history">
            <MatchHistory />
          </Tabs.Content>

          {/* Leaderboards Tab */}
          <Tabs.Content value="leaderboards">
            <div className="space-y-8">
              {/* Player Leaderboard */}
              <div>
                <h2 className="font-display text-2xl text-neon-green mb-4">
                  Player Leaderboard
                </h2>
                <PlayerLeaderboard />
              </div>

              {/* Pair Leaderboard */}
              <div>
                <h2 className="font-display text-2xl text-neon-pink mb-4">
                  Pair Leaderboard
                </h2>
                <PairLeaderboard />
              </div>
            </div>
          </Tabs.Content>
        </Tabs>
      </div>
    </PageLayout>
  )
}
