import { supabase } from './supabase'
import {
  getUsEasternDate,
  type DailyTally,
  type Game,
  type GameDay,
  type LeaderboardEntry,
  type Prediction,
  type Profile,
} from './types'

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, email, display_name, baseline_correct')
    .eq('id', userId)
    .maybeSingle()
  return data as Profile | null
}

export async function fetchAllOtherProfiles(
  currentUserId: string,
): Promise<Profile[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id, email, display_name, baseline_correct')
    .neq('id', currentUserId)
    .order('display_name', { ascending: true })
  return (data as Profile[]) ?? []
}

export async function fetchCurrentGameDay(): Promise<GameDay | null> {
  const today = getUsEasternDate()
  const { data } = await supabase
    .from('game_days')
    .select('id, nba_date, first_game_starts_at, status')
    .eq('nba_date', today)
    .maybeSingle()
  return (data as GameDay) ?? null
}

export async function fetchPreviousGameDay(): Promise<GameDay | null> {
  const today = getUsEasternDate()
  const { data } = await supabase
    .from('game_days')
    .select('id, nba_date, first_game_starts_at, status')
    .lt('nba_date', today)
    .order('nba_date', { ascending: false })
    .limit(1)
  return (data?.[0] as GameDay) ?? null
}

export async function fetchAllPredictionsForDay(
  gameDayId: string,
): Promise<Prediction[]> {
  const { data } = await supabase
    .from('predictions')
    .select(
      'id, game_id, user_id, picked_team, submitted_at, games!inner(game_day_id)',
    )
    .eq('games.game_day_id', gameDayId)
  return (data as unknown as Prediction[]) ?? []
}

export async function fetchGames(gameDayId: string): Promise<Game[]> {
  const { data } = await supabase
    .from('games')
    .select('*')
    .eq('game_day_id', gameDayId)
    .order('starts_at', { ascending: true })
  return (data as Game[]) ?? []
}

export async function hasUserSubmittedDay(
  gameDayId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('daily_submissions')
    .select('id')
    .eq('game_day_id', gameDayId)
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

export async function fetchAllSubmissionStatuses(
  gameDayId: string,
): Promise<Record<string, boolean>> {
  const { data } = await supabase
    .from('daily_submissions')
    .select('user_id')
    .eq('game_day_id', gameDayId)
  const map: Record<string, boolean> = {}
  for (const row of (data ?? []) as { user_id: string }[]) {
    map[row.user_id] = true
  }
  return map
}

export async function submitDay(params: {
  gameDayId: string
  userId: string
  picks: Array<{ gameId: string; pickedTeam: string }>
}): Promise<void> {
  const rows = params.picks.map((p) => ({
    game_id: p.gameId,
    user_id: params.userId,
    picked_team: p.pickedTeam,
  }))
  if (rows.length > 0) {
    const { error } = await supabase
      .from('predictions')
      .upsert(rows, { onConflict: 'game_id,user_id' })
    if (error) throw error
  }
  const { error } = await supabase.from('daily_submissions').upsert(
    { game_day_id: params.gameDayId, user_id: params.userId },
    { onConflict: 'game_day_id,user_id' },
  )
  if (error) throw error
}

interface ClosedDayRow {
  id: string
  nba_date: string
  status: string
  games: Array<{
    id: string
    winner_team: string | null
    predictions: Array<{ user_id: string; picked_team: string }> | null
  }> | null
}

async function fetchClosedDays(limit: number): Promise<ClosedDayRow[]> {
  const { data } = await supabase
    .from('game_days')
    .select(
      'id, nba_date, status, games(id, winner_team, predictions(user_id, picked_team))',
    )
    .eq('status', 'closed')
    .order('nba_date', { ascending: false })
    .limit(limit)
  return (data ?? []) as ClosedDayRow[]
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const [profiles, days] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, baseline_correct')
      .then((r) => (r.data as Pick<Profile, 'id' | 'display_name' | 'baseline_correct'>[] | null) ?? []),
    fetchClosedDays(365),
  ])

  const totals = new Map<string, { correct: number; days: Set<string> }>()
  for (const day of days) {
    for (const g of day.games ?? []) {
      if (!g.winner_team) continue
      for (const p of g.predictions ?? []) {
        const entry = totals.get(p.user_id) ?? { correct: 0, days: new Set() }
        entry.days.add(day.id)
        if (p.picked_team === g.winner_team) entry.correct++
        totals.set(p.user_id, entry)
      }
    }
  }

  const rows: LeaderboardEntry[] = profiles.map((p) => {
    const t = totals.get(p.id)
    return {
      userId: p.id,
      displayName: p.display_name,
      baseline: p.baseline_correct ?? 0,
      totalCorrect: t?.correct ?? 0,
      daysPlayed: t?.days.size ?? 0,
    }
  })

  rows.sort(
    (a, b) =>
      b.baseline + b.totalCorrect - (a.baseline + a.totalCorrect) ||
      a.displayName.localeCompare(b.displayName),
  )
  return rows
}

export async function fetchHeadToHead(
  userId: string,
  otherUserId: string,
): Promise<DailyTally[]> {
  const days = await fetchClosedDays(30)
  return days.map((day) => {
    let userCorrect = 0
    let friendCorrect = 0
    let totalGames = 0
    for (const g of day.games ?? []) {
      if (!g.winner_team) continue
      totalGames++
      for (const p of g.predictions ?? []) {
        if (p.picked_team !== g.winner_team) continue
        if (p.user_id === userId) userCorrect++
        else if (p.user_id === otherUserId) friendCorrect++
      }
    }
    return {
      game_day_id: day.id,
      nba_date: day.nba_date,
      userCorrect,
      friendCorrect,
      totalGames,
    }
  })
}
