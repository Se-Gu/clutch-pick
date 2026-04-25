'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CopyButton } from '@/components/copy-button'
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

  const userBaseline = profile?.baseline_correct ?? 0
  const friendBaseline = otherProfile?.baseline_correct ?? 0
  const hasBaseline = userBaseline > 0 || friendBaseline > 0

  const totals = tallies.reduce(
    (acc, d) => ({
      user: acc.user + d.userCorrect,
      friend: acc.friend + d.friendCorrect,
    }),
    { user: userBaseline, friend: friendBaseline },
  )
  const leader =
    totals.user > totals.friend
      ? userName
      : totals.friend > totals.user
      ? friendName
      : null

  const buildScoreboardText = () => {
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
    return text
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
        ) : tallies.length === 0 && !hasBaseline ? (
          <Card className="border-border/30 bg-card/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground text-center">
                No completed game days yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {hasBaseline && (
              <Card className="border-border/30 bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Before app</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className={cn(
                          'font-bold',
                          userBaseline > friendBaseline && 'text-primary'
                        )}>
                          {userBaseline}
                        </span>
                        <span className="text-muted-foreground">-</span>
                        <span className={cn(
                          'font-bold',
                          friendBaseline > userBaseline && 'text-accent'
                        )}>
                          {friendBaseline}
                        </span>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded-full min-w-[60px] text-center bg-muted text-muted-foreground">
                        Baseline
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
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
          <CopyButton getText={buildScoreboardText} label="Copy Scoreboard to WhatsApp" />
        </div>
      )}
    </div>
  )
}
