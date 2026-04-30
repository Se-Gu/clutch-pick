'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CopyButton } from '@/components/copy-button'
import { Logo } from '@/components/logo'
import { useAppStore } from '@/lib/store'
import * as data from '@/lib/data'
import {
  formatShortDate,
  type DailyTally,
  type LeaderboardEntry,
} from '@/lib/types'
import { cn } from '@/lib/utils'

export function TallyScreen() {
  const { userId, profile } = useAppStore()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [drilldownUserId, setDrilldownUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const rows = await data.fetchLeaderboard()
      if (!cancelled) {
        setLeaderboard(rows)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  if (drilldownUserId) {
    const opponent = leaderboard.find((e) => e.userId === drilldownUserId)
    return (
      <H2HView
        opponent={opponent}
        onBack={() => setDrilldownUserId(null)}
      />
    )
  }

  const buildScoreboardText = () => {
    let text = '🏀 NBA Tahmin Sıralaması\n\n'
    leaderboard.forEach((e, i) => {
      text += `${i + 1}. ${e.displayName}: ${e.totalCorrect}\n`
    })
    text += '\nhttps://clutch-pick.vercel.app'
    return text
  }

  const topTotal =
    leaderboard.length > 0 ? leaderboard[0].totalCorrect : 0

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/30">
        <div className="px-4 py-4 flex items-center gap-3">
          <Logo size={36} />
          <div>
            <h1 className="text-xl font-bold text-foreground">Leaderboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Season standings
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-4">
        {loading && leaderboard.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : leaderboard.length === 0 ? (
          <Card className="border-border/30 bg-card/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground text-center">
                No standings yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((e, i) => {
              const total = e.totalCorrect
              const isLeader = total === topTotal && total > 0
              const isSelf = e.userId === userId
              const tappable = !isSelf
              return (
                <Card
                  key={e.userId}
                  className={cn(
                    'border-border/30 bg-card/50 overflow-hidden transition-colors',
                    tappable && 'hover:bg-card/80 active:bg-card cursor-pointer',
                    isSelf && 'ring-1 ring-primary/40',
                  )}
                >
                  <button
                    type="button"
                    onClick={() =>
                      tappable && setDrilldownUserId(e.userId)
                    }
                    disabled={!tappable}
                    className="w-full text-left p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                          isLeader
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <p
                          className={cn(
                            'text-sm font-medium',
                            isSelf && 'text-primary',
                          )}
                        >
                          {e.displayName}
                          {isSelf && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (you)
                            </span>
                          )}
                          {isLeader && <span className="ml-1.5">👑</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {e.daysPlayed} day{e.daysPlayed === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-2xl font-bold',
                          isLeader && 'text-primary',
                        )}
                      >
                        {total}
                      </span>
                      {tappable && (
                        <svg
                          className="w-4 h-4 text-muted-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {leaderboard.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <CopyButton
            getText={buildScoreboardText}
            label="Copy Leaderboard to WhatsApp"
          />
        </div>
      )}
    </div>
  )
}

function H2HView({
  opponent,
  onBack,
}: {
  opponent: LeaderboardEntry | undefined
  onBack: () => void
}) {
  const { userId, profile } = useAppStore()
  const [tallies, setTallies] = useState<DailyTally[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId || !opponent) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const rows = await data.fetchHeadToHead(userId, opponent.userId)
      if (!cancelled) {
        setTallies(rows)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, opponent])

  if (!opponent) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Opponent not found.
      </div>
    )
  }

  const userName = profile?.display_name ?? 'You'
  const friendName = opponent.displayName

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

  const buildScoreboardText = () => {
    let text = `🏀 ${userName} - ${friendName}\n\n`
    text += `${userName}: ${totals.user}\n`
    text += `${friendName}: ${totals.friend}\n\n`
    text += `${leader ? `🏆 ${leader} önde!` : '🤝 Berabere!'}\n\n`
    text += `📅 Son Sonuçlar:\n`
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
    text += '\nhttps://clutch-pick.vercel.app'
    return text
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/30">
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary/50"
            aria-label="Back to leaderboard"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {userName} vs {friendName}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Head-to-head
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <div
                  className={cn(
                    'w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold mb-2',
                    leader === userName
                      ? 'bg-primary/20 text-primary ring-2 ring-primary'
                      : 'bg-muted',
                  )}
                >
                  {totals.user}
                </div>
                <p className="font-semibold">{userName}</p>
                {leader === userName && (
                  <span className="text-xs text-primary">👑 Leading</span>
                )}
              </div>
              <div className="px-4">
                <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
                  <span className="text-sm font-bold text-muted-foreground">
                    VS
                  </span>
                </div>
              </div>
              <div className="text-center flex-1">
                <div
                  className={cn(
                    'w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold mb-2',
                    leader === friendName
                      ? 'bg-accent/20 text-accent ring-2 ring-accent'
                      : 'bg-muted',
                  )}
                >
                  {totals.friend}
                </div>
                <p className="font-semibold">{friendName}</p>
                {leader === friendName && (
                  <span className="text-xs text-accent">👑 Leading</span>
                )}
              </div>
            </div>
            {!leader && tallies.length > 0 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                🤝 All tied up!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

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
                <Card
                  key={day.game_day_id}
                  className="border-border/30 bg-card/50"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {formatShortDate(day.nba_date)}
                      </span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span
                            className={cn(
                              'font-bold',
                              day.userCorrect > day.friendCorrect &&
                                'text-primary',
                            )}
                          >
                            {day.userCorrect}
                          </span>
                          <span className="text-muted-foreground">-</span>
                          <span
                            className={cn(
                              'font-bold',
                              day.friendCorrect > day.userCorrect &&
                                'text-accent',
                            )}
                          >
                            {day.friendCorrect}
                          </span>
                        </div>
                        <span
                          className={cn(
                            'text-xs font-medium px-2 py-1 rounded-full min-w-[60px] text-center',
                            dayWinner === userName &&
                              'bg-primary/10 text-primary',
                            dayWinner === friendName &&
                              'bg-accent/10 text-accent',
                            dayWinner === 'Tie' &&
                              'bg-muted text-muted-foreground',
                          )}
                        >
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

      {tallies.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <CopyButton
            getText={buildScoreboardText}
            label="Copy H2H to WhatsApp"
          />
        </div>
      )}
    </div>
  )
}
