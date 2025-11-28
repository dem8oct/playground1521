import type { Match, TeamStats, MatchResult } from './types'
import { supabase } from './supabase'

/**
 * Determine the match result for a team based on goals scored
 */
export function getMatchResult(goalsFor: number, goalsAgainst: number): MatchResult {
  if (goalsFor > goalsAgainst) return 'win'
  if (goalsFor < goalsAgainst) return 'loss'
  return 'draw'
}

/**
 * Calculate points for a match result
 */
export function getPointsForResult(result: MatchResult): number {
  switch (result) {
    case 'win': return 3
    case 'draw': return 1
    case 'loss': return 0
  }
}

/**
 * Initialize empty stats
 */
export function createEmptyStats(): TeamStats {
  return {
    mp: 0,
    w: 0,
    d: 0,
    l: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    pts: 0,
  }
}

/**
 * Add match result to existing stats
 */
export function addMatchToStats(
  stats: TeamStats,
  goalsFor: number,
  goalsAgainst: number
): TeamStats {
  const result = getMatchResult(goalsFor, goalsAgainst)
  const points = getPointsForResult(result)

  return {
    mp: stats.mp + 1,
    w: stats.w + (result === 'win' ? 1 : 0),
    d: stats.d + (result === 'draw' ? 1 : 0),
    l: stats.l + (result === 'loss' ? 1 : 0),
    gf: stats.gf + goalsFor,
    ga: stats.ga + goalsAgainst,
    gd: stats.gd + (goalsFor - goalsAgainst),
    pts: stats.pts + points,
  }
}

/**
 * Calculate player stats from all matches in a session
 */
export function calculatePlayerStats(
  playerId: string,
  matches: Match[]
): TeamStats {
  let stats = createEmptyStats()

  for (const match of matches) {
    const isInTeamA = match.team_a_player_ids.includes(playerId)
    const isInTeamB = match.team_b_player_ids.includes(playerId)

    if (isInTeamA) {
      stats = addMatchToStats(stats, match.team_a_goals, match.team_b_goals)
    } else if (isInTeamB) {
      stats = addMatchToStats(stats, match.team_b_goals, match.team_a_goals)
    }
  }

  return stats
}

/**
 * Calculate pair stats from matches where both players were on the same team
 */
export function calculatePairStats(
  playerId1: string,
  playerId2: string,
  matches: Match[]
): TeamStats {
  let stats = createEmptyStats()

  for (const match of matches) {
    const bothInTeamA =
      match.team_a_player_ids.includes(playerId1) &&
      match.team_a_player_ids.includes(playerId2)

    const bothInTeamB =
      match.team_b_player_ids.includes(playerId1) &&
      match.team_b_player_ids.includes(playerId2)

    if (bothInTeamA) {
      stats = addMatchToStats(stats, match.team_a_goals, match.team_b_goals)
    } else if (bothInTeamB) {
      stats = addMatchToStats(stats, match.team_b_goals, match.team_a_goals)
    }
  }

  return stats
}

/**
 * Create a sorted pair ID to ensure consistent ordering (A+B === B+A)
 */
export function createPairId(playerId1: string, playerId2: string): string {
  return [playerId1, playerId2].sort().join('_')
}

/**
 * Create a readable label for a pair
 */
export function createPairLabel(player1Name: string, player2Name: string): string {
  return `${player1Name} & ${player2Name}`
}

/**
 * Sort stats by leaderboard rules: Pts → GD → GF → Name
 */
export function sortByLeaderboard<T extends TeamStats & { name: string }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    // 1. Points (descending)
    if (a.pts !== b.pts) return b.pts - a.pts

    // 2. Goal Difference (descending)
    if (a.gd !== b.gd) return b.gd - a.gd

    // 3. Goals For (descending)
    if (a.gf !== b.gf) return b.gf - a.gf

    // 4. Alphabetical by name
    return a.name.localeCompare(b.name)
  })
}

/**
 * Recalculate and persist all stats for a session to the database
 * This should be called after any match is added, updated, or deleted
 */
export async function recalculateSessionStats(sessionId: string): Promise<void> {
  try {
    // Fetch all matches and players for this session
    const [matchesResult, playersResult] = await Promise.all([
      supabase
        .from('matches')
        .select('*')
        .eq('session_id', sessionId)
        .order('played_at', { ascending: true }),
      supabase
        .from('session_players')
        .select('*')
        .eq('session_id', sessionId)
    ])

    if (matchesResult.error) throw matchesResult.error
    if (playersResult.error) throw playersResult.error

    const matches = matchesResult.data || []
    const players = playersResult.data || []

    // Calculate player stats
    const playerStatsToInsert = players.map((player) => {
      const stats = calculatePlayerStats(player.id, matches)
      return {
        session_id: sessionId,
        session_player_id: player.id,
        ...stats
      }
    })

    // Calculate pair stats (only for pairs that played together)
    const pairStatsMap = new Map<string, any>()

    for (const match of matches) {
      // Team A pairs
      if (match.team_a_player_ids.length === 2) {
        const [p1, p2] = match.team_a_player_ids.sort()
        const pairId = createPairId(p1, p2)

        if (!pairStatsMap.has(pairId)) {
          const player1 = players.find((p) => p.id === p1)
          const player2 = players.find((p) => p.id === p2)
          if (player1 && player2) {
            const stats = calculatePairStats(p1, p2, matches)
            const label = createPairLabel(player1.display_name, player2.display_name)
            pairStatsMap.set(pairId, {
              session_id: sessionId,
              session_player_id_1: p1,
              session_player_id_2: p2,
              label,
              ...stats
            })
          }
        }
      }

      // Team B pairs
      if (match.team_b_player_ids.length === 2) {
        const [p1, p2] = match.team_b_player_ids.sort()
        const pairId = createPairId(p1, p2)

        if (!pairStatsMap.has(pairId)) {
          const player1 = players.find((p) => p.id === p1)
          const player2 = players.find((p) => p.id === p2)
          if (player1 && player2) {
            const stats = calculatePairStats(p1, p2, matches)
            const label = createPairLabel(player1.display_name, player2.display_name)
            pairStatsMap.set(pairId, {
              session_id: sessionId,
              session_player_id_1: p1,
              session_player_id_2: p2,
              label,
              ...stats
            })
          }
        }
      }
    }

    const pairStatsToInsert = Array.from(pairStatsMap.values())

    // Delete existing stats
    await Promise.all([
      supabase.from('player_stats').delete().eq('session_id', sessionId),
      supabase.from('pair_stats').delete().eq('session_id', sessionId)
    ])

    // Insert new stats
    const promises = []

    if (playerStatsToInsert.length > 0) {
      promises.push(
        supabase.from('player_stats').insert(playerStatsToInsert as any)
      )
    }

    if (pairStatsToInsert.length > 0) {
      promises.push(
        supabase.from('pair_stats').insert(pairStatsToInsert as any)
      )
    }

    if (promises.length > 0) {
      const results = await Promise.all(promises)
      for (const result of results) {
        if (result.error) throw result.error
      }
    }

    console.log('Stats recalculated successfully for session:', sessionId)
  } catch (error) {
    console.error('Error recalculating stats:', error)
    throw error
  }
}
