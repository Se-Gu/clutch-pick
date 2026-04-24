import { supabase } from './supabase'
import type { DailyTally, Game, GameDay, Prediction, Profile } from './types'

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, email, display_name')
    .eq('id', userId)
    .maybeSingle()
  return data as Profile | null
}

export async function fetchOtherProfile(currentUserId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, email, display_name')
    .neq('id', currentUserId)
    .limit(1)
  return (data?.[0] as Profile) ?? null
}

export async function fetchCurrentGameDay(): Promise<GameDay | null> {
  const { data } = await supabase
    .from('game_days')
    .select('id, nba_date, first_game_starts_at, status')
    .eq('status', 'open')
    .order('first_game_starts_at', { ascending: true })
    .limit(1)
  return (data?.[0] as GameDay) ?? null
}

export async function fetchGames(gameDayId: string): Promise<Game[]> {
  const { data } = await supabase
    .from('games')
    .select('*')
    .eq('game_day_id', gameDayId)
    .order('starts_at', { ascending: true })
  return (data as Game[]) ?? []
}

export async function fetchPredictionsForDay(
  gameDayId: string,
  userId: string,
): Promise<Prediction[]> {
  const { data } = await supabase
    .from('predictions')
    .select('id, game_id, user_id, picked_team, submitted_at, games!inner(game_day_id)')
    .eq('user_id', userId)
    .eq('games.game_day_id', gameDayId)
  return (data as unknown as Prediction[]) ?? []
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

export async function fetchPastTallies(
  userId: string,
  otherUserId: string | null,
): Promise<DailyTally[]> {
  const { data } = await supabase
    .from('game_days')
    .select(
      'id, nba_date, status, games(id, winner_team, predictions(user_id, picked_team))',
    )
    .eq('status', 'closed')
    .order('nba_date', { ascending: false })
    .limit(30)

  return (data ?? []).map((day: any) => {
    let userCorrect = 0
    let friendCorrect = 0
    let totalGames = 0
    for (const g of day.games ?? []) {
      if (!g.winner_team) continue
      totalGames++
      for (const p of g.predictions ?? []) {
        if (p.picked_team !== g.winner_team) continue
        if (p.user_id === userId) userCorrect++
        else if (otherUserId && p.user_id === otherUserId) friendCorrect++
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
