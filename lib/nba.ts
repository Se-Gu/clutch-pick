import 'server-only'
import { getSupabaseAdmin } from './supabase-admin'
import { getDayBefore, getUsEasternDate } from './types'

export { getUsEasternDate } from './types'

const BDL_BASE = 'https://api.balldontlie.io/v1'

export interface BdlTeam {
  id: number
  full_name: string
  abbreviation: string
}

export interface BdlGame {
  id: number
  date: string
  datetime: string | null
  status: string
  home_team_score: number
  visitor_team_score: number
  home_team: BdlTeam
  visitor_team: BdlTeam
}

export async function fetchBdlGames(date: string): Promise<BdlGame[]> {
  const apiKey = process.env.BALLDONTLIE_API_KEY
  if (!apiKey) throw new Error('Missing BALLDONTLIE_API_KEY')
  const url = `${BDL_BASE}/games?dates[]=${encodeURIComponent(date)}&per_page=100`
  const res = await fetch(url, {
    headers: { Authorization: apiKey },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`balldontlie ${res.status}: ${await res.text()}`)
  }
  const json = (await res.json()) as { data?: BdlGame[] }
  return json.data ?? []
}

function isFinal(status: string): boolean {
  return status.toLowerCase().startsWith('final')
}

export async function syncRecentDays(): Promise<SyncResult[]> {
  const today = getUsEasternDate()
  const yesterday = getDayBefore(today)
  const results = await Promise.all([
    syncGamesForDate(today),
    syncGamesForDate(yesterday),
  ])
  return results
}

export interface SyncResult {
  date: string
  gameCount: number
  dayStatus: 'open' | 'closed' | 'no-games'
  gameDayId?: string
}

export async function syncGamesForDate(date: string): Promise<SyncResult> {
  const admin = getSupabaseAdmin()
  const games = await fetchBdlGames(date)
  if (games.length === 0) {
    return { date, gameCount: 0, dayStatus: 'no-games' }
  }

  const starts = games
    .map((g) => g.datetime)
    .filter((x): x is string => !!x)
    .sort()
  const firstStart = starts[0] ?? `${date}T23:00:00Z`

  const allFinal = games.every((g) => isFinal(g.status))
  const dayStatus: 'open' | 'closed' = allFinal ? 'closed' : 'open'

  const { data: dayRow, error: dayErr } = await admin
    .from('game_days')
    .upsert(
      {
        nba_date: date,
        first_game_starts_at: firstStart,
        status: dayStatus,
      },
      { onConflict: 'nba_date' },
    )
    .select('id')
    .single()
  if (dayErr) throw dayErr

  const rows = games.map((g) => {
    const final = isFinal(g.status)
    const winner =
      final
        ? g.home_team_score > g.visitor_team_score
          ? g.home_team.full_name
          : g.visitor_team_score > g.home_team_score
          ? g.visitor_team.full_name
          : null
        : null
    return {
      external_game_id: String(g.id),
      game_day_id: dayRow.id,
      away_team: g.visitor_team.full_name,
      home_team: g.home_team.full_name,
      starts_at: g.datetime ?? firstStart,
      status: g.status,
      away_score: final ? g.visitor_team_score : null,
      home_score: final ? g.home_team_score : null,
      winner_team: winner,
    }
  })
  const { error: gamesErr } = await admin
    .from('games')
    .upsert(rows, { onConflict: 'external_game_id' })
  if (gamesErr) throw gamesErr

  return {
    date,
    gameCount: games.length,
    dayStatus,
    gameDayId: dayRow.id as string,
  }
}
