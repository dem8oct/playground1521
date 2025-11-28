import { useState } from 'react'
import { PageLayout, Button, Card } from '../ui'
import LoginForm from './LoginForm'

interface AuthScreenProps {
  onGuestJoin?: () => void
}

export default function AuthScreen({ onGuestJoin }: AuthScreenProps) {
  const [showLogin, setShowLogin] = useState(false)

  if (showLogin) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto pt-12">
          <div className="text-center mb-8">
            <h1 className="font-display text-5xl md:text-6xl text-gradient-neon mb-4">
              2V2 KICK OFF NIGHT
            </h1>
            <p className="font-mono text-neon-green">
              Track your EA SPORTS FC matches
            </p>
          </div>
          <LoginForm />
          <div className="text-center mt-6">
            <button
              onClick={() => setShowLogin(false)}
              className="font-mono text-sm text-gray-400 hover:text-neon-green transition-colors"
            >
              ← Back to options
            </button>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto pt-12">
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl md:text-7xl text-gradient-neon mb-4">
            2V2 KICK OFF NIGHT
          </h1>
          <p className="font-mono text-xl text-neon-green">
            Track your EA SPORTS FC matches in real time
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card variant="neon-green" className="text-center">
            <div className="text-6xl mb-4">⚽</div>
            <h2 className="font-display text-2xl text-neon-green mb-3">
              Create Session
            </h2>
            <p className="font-mono text-sm text-gray-300 mb-6">
              Start a new game night and get a join code for your friends
            </p>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => setShowLogin(true)}
            >
              Sign In to Create
            </Button>
          </Card>

          <Card variant="neon-pink" className="text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="font-display text-2xl text-neon-pink mb-3">
              Join as Guest
            </h2>
            <p className="font-mono text-sm text-gray-300 mb-6">
              Have a join code? View the session without signing in
            </p>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => {
                console.log('Join as Guest clicked', { onGuestJoin })
                onGuestJoin?.()
              }}
            >
              Enter Join Code
            </Button>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="font-mono text-sm text-gray-400">
            Already have an account?{' '}
            <button
              onClick={() => setShowLogin(true)}
              className="text-neon-green hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </PageLayout>
  )
}
