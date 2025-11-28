import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SessionProvider, useSession } from './contexts/SessionContext'
import AuthScreen from './components/auth/AuthScreen'
import CreateSessionForm from './components/session/CreateSessionForm'
import JoinSessionForm from './components/session/JoinSessionForm'
import SessionLobby from './components/session/SessionLobby'
import { PageLayout, Button } from './components/ui'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function AppContent() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { activeSession, loading: sessionLoading, leaveSession } = useSession()
  const [view, setView] = useState<
    'auth' | 'create' | 'join' | 'lobby' | 'dashboard'
  >('auth')

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
            <div className="font-mono text-sm text-gray-400">
              Initializing session
            </div>
          </div>
        </div>
      </PageLayout>
    )
  }

  // If there's an active session, show lobby or dashboard
  if (activeSession) {
    if (view === 'dashboard') {
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
                <Button variant="secondary" size="sm" onClick={() => setView('lobby')}>
                  Back to Lobby
                </Button>
              </div>
            </div>
          }
        >
          <div className="text-center py-12">
            <h1 className="font-display text-4xl text-gradient-neon mb-4">
              Dashboard Coming Soon
            </h1>
            <p className="font-mono text-neon-green mb-6">
              Phase 5-7 implementation in progress
            </p>
          </div>
        </PageLayout>
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
        </div>
      </div>
    </PageLayout>
  )
}

function App() {
  return (
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
  )
}

export default App
