import { useState, FormEvent, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useSession } from '../../contexts/SessionContext'
import { Card, Button, Input, Select } from '../ui'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import type { CreateMatchData } from '../../lib/types'

// Club names from Club_Name.md
const CLUB_OPTIONS = [
  { value: '', label: 'Select club...' },
  { value: 'Classic XI', label: 'Classic XI (The "Older" Legends)' },
  { value: 'World XI', label: 'World XI (The "Newer" Legends)' },
  { value: 'Real Madrid', label: 'Real Madrid (Spain)' },
  { value: 'FC Barcelona', label: 'FC Barcelona (Spain)' },
  { value: 'Lombardia FC', label: 'Lombardia FC (Inter Milan)' },
  { value: 'Manchester City', label: 'Manchester City (England)' },
  { value: 'Bayern Munich', label: 'Bayern Munich (Germany)' },
  { value: 'Liverpool', label: 'Liverpool (England)' },
  { value: 'PSG', label: 'PSG (France)' },
  { value: 'Atlético Madrid', label: 'Atlético Madrid (Spain)' },
  { value: 'Borussia Dortmund', label: 'Borussia Dortmund (Germany)' },
]

interface MatchLoggingFormProps {
  onSuccess?: () => void
}

export default function MatchLoggingForm({ onSuccess }: MatchLoggingFormProps) {
  const { user } = useAuth()
  const { activeSession, sessionPlayers } = useSession()
  const queryClient = useQueryClient()

  const [teamAPlayer1, setTeamAPlayer1] = useState('')
  const [teamAPlayer2, setTeamAPlayer2] = useState('')
  const [teamBPlayer1, setTeamBPlayer1] = useState('')
  const [teamBPlayer2, setTeamBPlayer2] = useState('')
  const [teamAClub, setTeamAClub] = useState('')
  const [teamBClub, setTeamBClub] = useState('')
  const [teamAGoals, setTeamAGoals] = useState(0)
  const [teamBGoals, setTeamBGoals] = useState(0)
  const [loading, setLoading] = useState(false)

  if (!activeSession || !user) return null

  const allPlayerOptions = sessionPlayers.map(p => ({
    value: p.id,
    label: p.display_name
  }))

  // Dynamic filtering: remove selected players from other dropdowns
  const teamAPlayer1Options = useMemo(() => {
    const selected = [teamAPlayer2, teamBPlayer1, teamBPlayer2].filter(Boolean)
    return [
      { value: '', label: 'Select player...' },
      ...allPlayerOptions.filter(opt => !selected.includes(opt.value))
    ]
  }, [teamAPlayer2, teamBPlayer1, teamBPlayer2, allPlayerOptions])

  const teamAPlayer2Options = useMemo(() => {
    const selected = [teamAPlayer1, teamBPlayer1, teamBPlayer2].filter(Boolean)
    return [
      { value: '', label: 'Select player...' },
      ...allPlayerOptions.filter(opt => !selected.includes(opt.value))
    ]
  }, [teamAPlayer1, teamBPlayer1, teamBPlayer2, allPlayerOptions])

  const teamBPlayer1Options = useMemo(() => {
    const selected = [teamAPlayer1, teamAPlayer2, teamBPlayer2].filter(Boolean)
    return [
      { value: '', label: 'Select player...' },
      ...allPlayerOptions.filter(opt => !selected.includes(opt.value))
    ]
  }, [teamAPlayer1, teamAPlayer2, teamBPlayer2, allPlayerOptions])

  const teamBPlayer2Options = useMemo(() => {
    const selected = [teamAPlayer1, teamAPlayer2, teamBPlayer1].filter(Boolean)
    return [
      { value: '', label: 'None (2v1 match)' },
      ...allPlayerOptions.filter(opt => !selected.includes(opt.value))
    ]
  }, [teamAPlayer1, teamAPlayer2, teamBPlayer1, allPlayerOptions])

  // Validation helper
  function validateMatch(): string | null {
    // Check all required players are selected
    if (!teamAPlayer1 || !teamAPlayer2 || !teamBPlayer1) {
      return 'Please select all required players'
    }

    // Check clubs are selected
    if (!teamAClub || !teamBClub) {
      return 'Please select clubs for both teams'
    }

    // Check for duplicate players across teams
    const allPlayers = [teamAPlayer1, teamAPlayer2, teamBPlayer1]
    if (teamBPlayer2) allPlayers.push(teamBPlayer2)

    const uniquePlayers = new Set(allPlayers)
    if (uniquePlayers.size !== allPlayers.length) {
      return 'Players cannot be selected more than once'
    }

    // Check minimum 3 distinct players
    if (uniquePlayers.size < 3) {
      return 'Need at least 3 distinct players'
    }

    // Validate goals
    if (teamAGoals < 0 || teamBGoals < 0) {
      return 'Goals cannot be negative'
    }

    if (teamAGoals > 19 || teamBGoals > 19) {
      return 'Goals cannot exceed 19'
    }

    return null
  }

  function handleReset() {
    setTeamAPlayer1('')
    setTeamAPlayer2('')
    setTeamBPlayer1('')
    setTeamBPlayer2('')
    setTeamAClub('')
    setTeamBClub('')
    setTeamAGoals(0)
    setTeamBGoals(0)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    // Validate
    const error = validateMatch()
    if (error) {
      toast.error(error)
      return
    }

    if (!activeSession || !user) {
      toast.error('Session or user not found')
      return
    }

    setLoading(true)
    try {
      const matchData: CreateMatchData = {
        teamAPlayerIds: [teamAPlayer1, teamAPlayer2],
        teamBPlayerIds: teamBPlayer2
          ? [teamBPlayer1, teamBPlayer2]
          : [teamBPlayer1],
        teamAClub: teamAClub,
        teamBClub: teamBClub,
        teamAGoals,
        teamBGoals,
        playedAt: new Date().toISOString() // Capture current timestamp
      }

      const { error: insertError } = await supabase
        .from('matches')
        .insert({
          session_id: activeSession.id,
          logged_by_user_id: user.id,
          team_a_player_ids: matchData.teamAPlayerIds,
          team_b_player_ids: matchData.teamBPlayerIds,
          team_a_club: matchData.teamAClub,
          team_b_club: matchData.teamBClub,
          team_a_goals: matchData.teamAGoals,
          team_b_goals: matchData.teamBGoals,
          played_at: matchData.playedAt
        } as any)

      if (insertError) throw insertError

      toast.success('Match logged successfully!')

      // Invalidate matches query to trigger refetch
      await queryClient.invalidateQueries({ queryKey: ['matches', activeSession.id] })

      // Reset form
      handleReset()

      // Call onSuccess callback to show match history
      if (onSuccess) {
        onSuccess()
      }

    } catch (error: any) {
      console.error('Failed to log match:', error)
      toast.error(error?.message || 'Failed to log match')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card variant="neon-green">
      <div className="p-6">
        <h2 className="font-display text-2xl text-neon-green mb-6">
          LOG MATCH
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team A */}
          <div className="space-y-4">
            <h3 className="font-mono text-lg text-neon-green">Team A</h3>

            <Select
              label="Player 1*"
              value={teamAPlayer1}
              onChange={(e) => setTeamAPlayer1(e.target.value)}
              required
              options={teamAPlayer1Options}
            />

            <Select
              label="Player 2*"
              value={teamAPlayer2}
              onChange={(e) => setTeamAPlayer2(e.target.value)}
              required
              options={teamAPlayer2Options}
            />

            <Select
              label="Club Name*"
              value={teamAClub}
              onChange={(e) => setTeamAClub(e.target.value)}
              required
              options={CLUB_OPTIONS}
            />

            <Input
              label="Goals*"
              type="number"
              min="0"
              max="19"
              value={teamAGoals}
              onChange={(e) => setTeamAGoals(parseInt(e.target.value) || 0)}
              required
            />
          </div>

          {/* Divider */}
          <div className="border-t border-neon-green/30"></div>

          {/* Team B */}
          <div className="space-y-4">
            <h3 className="font-mono text-lg text-neon-pink">Team B</h3>

            <Select
              label="Player 1*"
              value={teamBPlayer1}
              onChange={(e) => setTeamBPlayer1(e.target.value)}
              required
              options={teamBPlayer1Options}
            />

            <Select
              label="Player 2 (Optional for 2v1)"
              value={teamBPlayer2}
              onChange={(e) => setTeamBPlayer2(e.target.value)}
              options={teamBPlayer2Options}
            />

            <Select
              label="Club Name*"
              value={teamBClub}
              onChange={(e) => setTeamBClub(e.target.value)}
              required
              options={CLUB_OPTIONS}
            />

            <Input
              label="Goals*"
              type="number"
              min="0"
              max="19"
              value={teamBGoals}
              onChange={(e) => setTeamBGoals(parseInt(e.target.value) || 0)}
              required
            />
          </div>

          {/* Submit and Reset Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleReset}
              className="flex-1"
            >
              Reset
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Logging Match...' : 'Log Match'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}
