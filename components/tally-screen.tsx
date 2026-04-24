'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Logo } from '@/components/logo'
import { useAppStore } from '@/lib/store'
import * as data from '@/lib/data'
import { formatShortDate, type DailyTally } from '@/lib/types'
import { cn } from '@/lib/utils'

export function TallyScreen() {
  const { userId, profile, otherProfile } = useAppStore()
  const [tallies, setTallies] = useState<DailyTally[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const rows = await data.fetchPastTallies(userId, otherProfile?.id ?? null)
      if (!cancelled) {
        setTallies(rows)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, otherProfile])

  const userName = profile?.display_name ?? 'You'
  const friendName = otherProfile?.display_name ?? 'Friend'

  const totals = tallies.reduce(
    (acc, d) => ({
      user: acc.user + d.userCorrect,
      friend: acc.friend + d.friendCorrect,
    }),
    { user: 0, friend: 0 },
  )
  const leader =
    totals.user > totals.friend
      ? userName
      : totals.friend > totals.user
      ? friendName
      : null

  const copyScoreboardToWhatsApp = () => {
    let text = '🏀 NBA Picks Scoreboard\n\n'
    text += `📊 Total Standings:\n`
    text += `${userName}: ${totals.user}\n`
    text += `${friendName}: ${totals.friend}\n\n`
    text += `${leader ? `🏆 ${leader} leads!` : '🤝 Tied!'}\n\n`
    text += `📅 Recent Results:\n`
    tallies.slice(0, 5).forEach((day) => {
      const dayWinner =
        day.userCorrect > day.friendCorrect
          ? 'U'
          : day.friendCorrect > day.userCorrect
          ? 'F'
          : 'T'
      text += `${formatShortDate(day.nba_date)}: ${day.userCorrect}-${day.friendCorrect} ${
        dayWinner === 'U' ? '🔵' : dayWinner === 'F' ? '🔴' : '⚪'
      }\n`
    })
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/30">
        <div className="px-4 py-4 flex items-center gap-3">
          <Logo size={36} />
          <div>
            <h1 className="text-xl font-bold text-foreground">Scoreboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Season standings</p>
          </div>
        </div>
      </header>

      {/* Main Scoreboard */}
      <div className="px-4 py-4">
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* You */}
              <div className="text-center flex-1">
                <div className={cn(
                  'w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold mb-2',
                  leader === userName ? 'bg-primary/20 text-primary ring-2 ring-primary' : 'bg-muted'
                )}>
                  {totals.user}
                </div>
                <p className="font-semibold">{userName}</p>
                {leader === userName && (
                  <span className="text-xs text-primary">👑 Leading</span>
                )}
              </div>

              {/* VS */}
              <div className="px-4">
                <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
                  <span className="text-sm font-bold text-muted-foreground">VS</span>
                </div>
              </div>

              {/* Friend */}
              <div className="text-center flex-1">
                <div className={cn(
                  'w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold mb-2',
                  leader === friendName ? 'bg-accent/20 text-accent ring-2 ring-accent' : 'bg-muted'
                )}>
                  {totals.friend}
                </div>
                <p className="font-semibold">{friendName}</p>
                {leader === friendName && (
                  <span className="text-xs text-accent">👑 Leading</span>
                )}
              </div>
            </div>

            {!leader && tallies.length > 0 && (
              <p className="text-center text-sm text-muted-foreground mt-4">🤝 All tied up!</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Results */}
      <div className="flex-1 px-4">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Daily Results
        </h2>
        {loading && tallies.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : tallies.length === 0 ? (
          <Card className="border-border/30 bg-card/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground text-center">
                No completed game days yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {tallies.map((day) => {
              const dayWinner =
                day.userCorrect > day.friendCorrect
                  ? userName
                  : day.friendCorrect > day.userCorrect
                  ? friendName
                  : 'Tie'

              return (
                <Card key={day.game_day_id} className="border-border/30 bg-card/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{formatShortDate(day.nba_date)}</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span className={cn(
                            'font-bold',
                            day.userCorrect > day.friendCorrect && 'text-primary'
                          )}>
                            {day.userCorrect}
                          </span>
                          <span className="text-muted-foreground">-</span>
                          <span className={cn(
                            'font-bold',
                            day.friendCorrect > day.userCorrect && 'text-accent'
                          )}>
                            {day.friendCorrect}
                          </span>
                        </div>
                        <span className={cn(
                          'text-xs font-medium px-2 py-1 rounded-full min-w-[60px] text-center',
                          dayWinner === userName && 'bg-primary/10 text-primary',
                          dayWinner === friendName && 'bg-accent/10 text-accent',
                          dayWinner === 'Tie' && 'bg-muted text-muted-foreground'
                        )}>
                          {dayWinner}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Copy Button */}
      {tallies.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <Button onClick={copyScoreboardToWhatsApp} variant="outline" className="w-full h-12">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Copy Scoreboard to WhatsApp
          </Button>
        </div>
      )}
    </div>
  )
}
