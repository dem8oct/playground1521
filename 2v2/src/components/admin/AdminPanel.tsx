import { useState } from 'react'
import { PageLayout, Button } from '../ui'
import AdminDashboard from './AdminDashboard'

interface AdminPanelProps {
  onBack: () => void
}

type AdminTab = 'dashboard' | 'leaderboards' | 'sessions' | 'stats' | 'users'

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')

  return (
    <PageLayout
      header={
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <h1 className="font-display text-2xl text-gradient-neon">ADMIN PANEL</h1>
          <Button variant="ghost" size="sm" onClick={onBack}>
            Back
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'text-neon-green border-b-2 border-neon-green'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('leaderboards')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'leaderboards'
                ? 'text-neon-green border-b-2 border-neon-green'
                : 'text-gray-400 hover:text-white'
            }`}
            disabled
          >
            Leaderboards <span className="text-xs">(Soon)</span>
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'sessions'
                ? 'text-neon-green border-b-2 border-neon-green'
                : 'text-gray-400 hover:text-white'
            }`}
            disabled
          >
            Sessions <span className="text-xs">(Soon)</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'stats'
                ? 'text-neon-green border-b-2 border-neon-green'
                : 'text-gray-400 hover:text-white'
            }`}
            disabled
          >
            Stats <span className="text-xs">(Soon)</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'users'
                ? 'text-neon-green border-b-2 border-neon-green'
                : 'text-gray-400 hover:text-white'
            }`}
            disabled
          >
            Users <span className="text-xs">(Soon)</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'leaderboards' && (
          <div className="text-center py-12 text-gray-400">
            Global Leaderboards - Coming Soon
          </div>
        )}
        {activeTab === 'sessions' && (
          <div className="text-center py-12 text-gray-400">
            Session Management - Coming Soon
          </div>
        )}
        {activeTab === 'stats' && (
          <div className="text-center py-12 text-gray-400">
            System Stats - Coming Soon
          </div>
        )}
        {activeTab === 'users' && (
          <div className="text-center py-12 text-gray-400">
            User List - Coming Soon
          </div>
        )}
      </div>
    </PageLayout>
  )
}
