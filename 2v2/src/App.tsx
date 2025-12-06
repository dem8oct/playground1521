import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SessionProvider, useSession } from './contexts/SessionContext'
import { PostHogProvider } from './contexts/PostHogContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import AuthScreen from './components/auth/AuthScreen'
import CreateSessionForm from './components/session/CreateSessionForm'
import JoinSessionForm from './components/session/JoinSessionForm'
import SessionLobby from './components/session/SessionLobby'
import { Dashboard } from './components/matches'
import { PageLayout, Button } from './components/ui'
import { GroupsList, GroupDashboard, UserInvites, GroupSessionLobby } from './components/groups'
import { AdminPanel } from './components/admin'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function AppContent() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const { activeSession, loading: sessionLoading, leaveSession } = useSession()
  const [view, setView] = useState<
    'auth' | 'create' | 'join' | 'lobby' | 'dashboard' | 'groups' | 'invites' | 'group-detail' | 'group-session-lobby' | 'admin'
  >('auth')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [, setSelectedSessionId] = useState<string | null>(null)

  async function handleSignOut() {
    try {
      console.log('Signing out and leaving session...')
      // Leave session first (clears localStorage)
      leaveSession()
      // Then sign out
      await signOut()
      setView('auth') // Reset view after sign out
      toast.success('Signed out successfully')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    }
  }

  if (authLoading || sessionLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="font-mono text-neon-green text-xl mb-2">
              Loading...
            </div>
            <div className="font-mono text-sm text-gray-400 mb-4">
              {authLoading && sessionLoading && 'Initializing session'}
              {authLoading && !sessionLoading && 'Loading authentication...'}
              {!authLoading && sessionLoading && 'Loading session...'}
            </div>

            {/* Add helpful message after 5 seconds */}
            <div className="font-mono text-xs text-gray-500 mt-4">
              Taking longer than expected?{' '}
              <button
                onClick={() => window.location.reload()}
                className="text-neon-green hover:underline"
              >
                Try reloading
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    )
  }

  // Handle group detail view - allow this even with active session
  if (view === 'group-detail' && selectedGroupId) {
    if (!user) {
      setView('auth')
      return null
    }
    return (
      <GroupDashboard
        groupId={selectedGroupId}
        onBack={() => setView('groups')}
        onNavigateToSession={(sessionId) => {
          setSelectedSessionId(sessionId)
          setView('group-session-lobby')
        }}
      />
    )
  }

  // If there's an active session, show lobby or dashboard
  if (activeSession) {
    if (view === 'dashboard') {
      return <Dashboard onBackToLobby={() => setView('lobby')} />
    }

    // Check if it's a group session
    if (activeSession.session_type === 'group' && selectedGroupId && view === 'group-session-lobby') {
      return (
        <GroupSessionLobby
          groupId={selectedGroupId}
          onContinue={() => setView('dashboard')}
          onBack={() => {
            setView('group-detail')
          }}
        />
      )
    }

    return <SessionLobby onContinue={() => setView('dashboard')} />
  }

  // Handle join view (for both guests and logged-in users)
  if (view === 'join') {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto pt-12">
          <JoinSessionForm onSuccess={() => setView('lobby')} />
          <div className="text-center mt-6">
            <button
              onClick={() => setView('auth')}
              className="font-mono text-sm text-gray-400 hover:text-neon-green transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </PageLayout>
    )
  }

  // Handle create view (logged-in users only)
  if (view === 'create') {
    if (!user) {
      // Redirect to auth if not logged in
      setView('auth')
      return null
    }

    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto pt-12">
          <CreateSessionForm onSuccess={() => setView('lobby')} />
          <div className="text-center mt-6">
            <button
              onClick={() => setView('auth')}
              className="font-mono text-sm text-gray-400 hover:text-neon-green transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </PageLayout>
    )
  }

  // Handle groups view
  if (view === 'groups') {
    if (!user) {
      setView('auth')
      return null
    }
    return (
      <PageLayout
        header={
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <h1 className="font-display text-2xl text-gradient-neon">
              MY GROUPS
            </h1>
            <div className="flex gap-3">
              <Button variant="ghost" size="sm" onClick={() => setView('auth')}>
                Back
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        }
      >
        <GroupsList
          onGroupClick={(groupId) => {
            setSelectedGroupId(groupId)
            setView('group-detail')
          }}
        />
      </PageLayout>
    )
  }

  // Handle invites view
  if (view === 'invites') {
    if (!user) {
      setView('auth')
      return null
    }
    return (
      <PageLayout
        header={
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <h1 className="font-display text-2xl text-gradient-neon">
              GROUP INVITES
            </h1>
            <div className="flex gap-3">
              <Button variant="ghost" size="sm" onClick={() => setView('auth')}>
                Back
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        }
      >
        <UserInvites />
      </PageLayout>
    )
  }

  // Handle admin view (admin users only)
  if (view === 'admin') {
    if (!user) {
      setView('auth')
      return null
    }

    // Check if user is admin
    if (!profile?.is_admin) {
      toast.error('Unauthorized: Admin access required')
      setView('auth')
      return null
    }

    return <AdminPanel onBack={() => setView('auth')} />
  }

  // No active session - show auth/create/join options
  if (!user) {
    return (
      <AuthScreen
        onGuestJoin={() => {
          console.log('onGuestJoin callback triggered, setting view to join')
          setView('join')
        }}
      />
    )
  }

  // Default: show options
  return (
    <PageLayout
      header={
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <h1 className="font-display text-2xl text-gradient-neon">
            2V2 KICK OFF NIGHT
          </h1>
          {user && (
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          )}
        </div>
      }
    >
      <div className="max-w-2xl mx-auto pt-12 text-center">
        <h1 className="font-display text-5xl text-gradient-neon mb-8">
          What would you like to do?
        </h1>
        <div className="grid gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setView('create')}
          >
            Create New Session
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setView('join')}
          >
            Join Existing Session
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setView('groups')}
          >
            My Groups
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setView('invites')}
          >
            Group Invites
          </Button>
          {profile?.is_admin && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => setView('admin')}
            >
              ⚡ Admin Panel
            </Button>
          )}
        </div>
      </div>
    </PageLayout>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <PostHogProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SessionProvider>
              <AppContent />
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: '#151930',
                    color: '#fff',
                    border: '2px solid #00FF94',
                    fontFamily: 'monospace',
                  },
                  success: {
                    iconTheme: {
                      primary: '#00FF94',
                      secondary: '#151930',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#FF2E97',
                      secondary: '#151930',
                    },
                  },
                }}
              />
            </SessionProvider>
          </AuthProvider>
        </QueryClientProvider>
      </PostHogProvider>
    </ErrorBoundary>
  )
}

export default App
