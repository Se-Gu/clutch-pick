'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Logo } from '@/components/logo'
import { useAppStore } from '@/lib/store'
import { teamAbbr } from '@/lib/types'

export function WaitingScreen() {
  const {
    games,
    userPicks,
    friendHasSubmitted,
    refreshFriendStatus,
    setActiveTab,
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

  const copyToWhatsApp = () => {
    const text = '🏀 I locked my NBA picks. Your turn!'
    navigator.clipboard.writeText(text)
  }

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
              <p className="text-muted-foreground">
                {friendHasSubmitted
                  ? `${friendName} has submitted! Go to Reveal to see picks.`
                  : `Waiting for ${friendName}…`}
              </p>
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
              {!friendHasSubmitted && (
                <Button onClick={copyToWhatsApp} variant="outline" className="w-full h-12">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Copy Reminder to WhatsApp
                </Button>
              )}

              {friendHasSubmitted && (
                <Button onClick={() => setActiveTab('reveal')} className="w-full h-12">
                  View Reveals →
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
