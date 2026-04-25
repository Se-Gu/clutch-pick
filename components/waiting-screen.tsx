'use client'

import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CopyButton } from '@/components/copy-button'
import { Logo } from '@/components/logo'
import { useAppStore } from '@/lib/store'
import { teamAbbr } from '@/lib/types'

export function WaitingScreen() {
  const {
    games,
    userPicks,
    friendHasSubmitted,
    refreshFriendStatus,
    otherProfile,
  } = useAppStore()

  const friendName = otherProfile?.display_name ?? 'Friend'

  useEffect(() => {
    if (friendHasSubmitted) return
    const id = setInterval(() => {
      refreshFriendStatus()
    }, 10000)
    return () => clearInterval(id)
  }, [friendHasSubmitted, refreshFriendStatus])

  const buildReminderText = () => '🏀 I locked my NBA picks. Your turn!'

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/30">
        <div className="px-4 py-4 flex items-center gap-3">
          <Logo size={36} />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Tonight&apos;s Picks</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-green-400 font-medium">Picks locked</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-4 py-6 flex flex-col items-center justify-center">
        <Card className="w-full border-border/50 bg-card/50">
          <CardContent className="p-6 text-center space-y-6">
            {/* Lock Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Your picks are locked
              </h2>
              <p className="text-muted-foreground">Waiting for {friendName}…</p>
            </div>

            {/* Your Picks Summary */}
            <div className="space-y-2 pt-2">
              {games.map((game) => {
                const pickedTeam = userPicks[game.id]
                return (
                  <div key={game.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <span className="text-sm text-muted-foreground">
                      {teamAbbr(game.away_team)} vs {teamAbbr(game.home_team)}
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      {pickedTeam ? teamAbbr(pickedTeam) : '—'}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <CopyButton
                getText={buildReminderText}
                label="Copy Reminder to WhatsApp"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
