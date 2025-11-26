import type { Match, TeamStats, MatchResult } from './types'

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
