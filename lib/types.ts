export interface Profile {
  id: string
  email: string
  display_name: string
}

export interface GameDay {
  id: string
  nba_date: string
  first_game_starts_at: string
  status: string
}

export interface Game {
  id: string
  game_day_id: string
  external_game_id: string
  away_team: string
  home_team: string
  starts_at: string
  status: string
  away_score: number | null
  home_score: number | null
  winner_team: string | null
}

export interface Prediction {
  id: string
  game_id: string
  user_id: string
  picked_team: string
  submitted_at: string
}

export interface DailyTally {
  game_day_id: string
  nba_date: string
  userCorrect: number
  friendCorrect: number
  totalGames: number
}

export interface LeaderboardEntry {
  userId: string
  displayName: string
  totalCorrect: number
  daysPlayed: number
}

export function teamAbbr(name: string): string {
  const parts = name.trim().split(/\s+/)
  const last = parts[parts.length - 1] ?? name
  return last.slice(0, 3).toUpperCase()
}

export function formatTurkeyTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul',
  })
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Europe/Istanbul',
  })
}

export function getUsEasternDate(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const y = parts.find((p) => p.type === 'year')!.value
  const m = parts.find((p) => p.type === 'month')!.value
  const d = parts.find((p) => p.type === 'day')!.value
  return `${y}-${m}-${d}`
}

export function getDayBefore(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}
