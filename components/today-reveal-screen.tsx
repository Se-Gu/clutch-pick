'use client'

import { Card, CardContent } from '@/components/ui/card'
import { CopyButton } from '@/components/copy-button'
import { Logo } from '@/components/logo'
import { useAppStore } from '@/lib/store'
import { teamAbbr } from '@/lib/types'
import { cn } from '@/lib/utils'

export function TodayRevealScreen() {
  const { games, userPicks, friendPicks, profile, otherProfile } = useAppStore()

  const userName = profile?.display_name ?? 'You'
  const friendName = otherProfile?.display_name ?? 'Friend'

  const buildRevealText = () => {
    let text = '🏀 Tonight\'s Picks Revealed!\n\n'
    games.forEach((game) => {
      const you = userPicks[game.id]
      const them = friendPicks[game.id]
      if (!you || !them) return
      const same = you === them
      text += `${teamAbbr(game.away_team)} @ ${teamAbbr(game.home_team)}\n`
      text += `${userName}: ${teamAbbr(you)} | ${friendName}: ${teamAbbr(them)} ${same ? '🤝' : '⚔️'}\n\n`
    })
    return text
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/30">
        <div className="px-4 py-4 flex items-center gap-3">
          <Logo size={36} />
          <div>
            <h1 className="text-xl font-bold text-foreground">Picks Revealed</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Both locked in for tonight</p>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 space-y-3">
        {games.map((game) => {
          const you = userPicks[game.id]
          const them = friendPicks[game.id]
          const samePick = !!you && you === them

          return (
            <Card key={game.id} className="border-border/50 bg-card/80 overflow-hidden">
              <CardContent className="p-0">
                <div className="px-4 py-3 bg-secondary/30 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {teamAbbr(game.away_team)} @ {teamAbbr(game.home_team)}
                    </span>
                    <span className={cn(
                      'text-xs font-medium px-2 py-1 rounded-full',
                      samePick ? 'bg-green-500/10 text-green-400' : 'bg-primary/10 text-primary'
                    )}>
                      {samePick ? '🤝 Same Pick' : '⚔️ Different'}
                    </span>
                  </div>
                </div>

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

      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <CopyButton getText={buildRevealText} label="Copy Picks to WhatsApp" />
      </div>
    </div>
  )
}
