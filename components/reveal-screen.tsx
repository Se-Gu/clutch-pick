'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Logo } from '@/components/logo'
import { useAppStore } from '@/lib/store'
import * as data from '@/lib/data'
import { teamAbbr } from '@/lib/types'
import { cn } from '@/lib/utils'

export function RevealScreen() {
  const {
    games,
    gameDay,
    userPicks,
    hasSubmitted,
    friendHasSubmitted,
    profile,
    otherProfile,
  } = useAppStore()

  const bothSubmitted = hasSubmitted && friendHasSubmitted
  const [friendPicks, setFriendPicks] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!bothSubmitted || !gameDay || !otherProfile) return
    let cancelled = false
    ;(async () => {
      const preds = await data.fetchPredictionsForDay(gameDay.id, otherProfile.id)
      if (cancelled) return
      const map: Record<string, string> = {}
      for (const p of preds) map[p.game_id] = p.picked_team
      setFriendPicks(map)
    })()
    return () => {
      cancelled = true
    }
  }, [bothSubmitted, gameDay, otherProfile])

  const userName = profile?.display_name ?? 'You'
  const friendName = otherProfile?.display_name ?? 'Friend'

  const copyPicksToWhatsApp = () => {
    let text = '🏀 NBA Picks Revealed!\n\n'
    games.forEach((game) => {
      const you = userPicks[game.id]
      const them = friendPicks[game.id]
      if (!you || !them) return
      const same = you === them
      text += `${teamAbbr(game.away_team)} vs ${teamAbbr(game.home_team)}\n`
      text += `${userName}: ${teamAbbr(you)} | ${friendName}: ${teamAbbr(them)} ${same ? '🤝' : '⚔️'}\n\n`
    })
    navigator.clipboard.writeText(text)
  }

  if (!bothSubmitted) {
    return (
      <div className="flex flex-col min-h-screen pb-24">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/30">
          <div className="px-4 py-4 flex items-center gap-3">
            <Logo size={36} />
            <h1 className="text-xl font-bold text-foreground">Picks Revealed</h1>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full border-border/50 bg-card/50">
            <CardContent className="p-6 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-1">Not Yet Available</h2>
                <p className="text-sm text-muted-foreground">
                  {!hasSubmitted && !friendHasSubmitted
                    ? 'Both players need to submit their picks first.'
                    : !hasSubmitted
                    ? 'You need to submit your picks first.'
                    : `Waiting for ${friendName} to submit...`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/30">
        <div className="px-4 py-4 flex items-center gap-3">
          <Logo size={36} />
          <div>
            <h1 className="text-xl font-bold text-foreground">Picks Revealed</h1>
            <p className="text-sm text-muted-foreground mt-0.5">See how you both picked</p>
          </div>
        </div>
      </header>

      {/* Picks List */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {games.map((game) => {
          const you = userPicks[game.id]
          const them = friendPicks[game.id]
          const samePick = !!you && you === them

          return (
            <Card key={game.id} className="border-border/50 bg-card/80 overflow-hidden">
              <CardContent className="p-0">
                {/* Game Header */}
                <div className="px-4 py-3 bg-secondary/30 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {teamAbbr(game.away_team)} vs {teamAbbr(game.home_team)}
                    </span>
                    <span className={cn(
                      'text-xs font-medium px-2 py-1 rounded-full',
                      samePick ? 'bg-green-500/10 text-green-400' : 'bg-primary/10 text-primary'
                    )}>
                      {samePick ? '🤝 Same Pick' : '⚔️ Different'}
                    </span>
                  </div>
                </div>

                {/* Picks */}
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div className={cn(
                    'p-3 rounded-xl text-center border-2',
                    samePick ? 'bg-green-500/5 border-green-500/30' : 'bg-primary/5 border-primary/30'
                  )}>
                    <p className="text-xs text-muted-foreground mb-1">{userName}</p>
                    <p className="font-bold text-lg">{you ? teamAbbr(you) : '—'}</p>
                  </div>

                  <div className={cn(
                    'p-3 rounded-xl text-center border-2',
                    samePick ? 'bg-green-500/5 border-green-500/30' : 'bg-accent/5 border-accent/30'
                  )}>
                    <p className="text-xs text-muted-foreground mb-1">{friendName}</p>
                    <p className="font-bold text-lg">{them ? teamAbbr(them) : '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Copy Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <Button onClick={copyPicksToWhatsApp} variant="outline" className="w-full h-12">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Copy Picks to WhatsApp
        </Button>
      </div>
    </div>
  )
}
