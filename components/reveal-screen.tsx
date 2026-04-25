'use client'

import { Card, CardContent } from '@/components/ui/card'
import { CopyButton } from '@/components/copy-button'
import { Logo } from '@/components/logo'
import { useAppStore } from '@/lib/store'
import { formatShortDate, teamAbbr } from '@/lib/types'
import { cn } from '@/lib/utils'

export function RevealScreen() {
  const {
    prevGameDay,
    prevGames,
    prevUserPicks,
    prevFriendPicks,
    profile,
    otherProfile,
  } = useAppStore()

  const userName = profile?.display_name ?? 'You'
  const friendName = otherProfile?.display_name ?? 'Friend'

  if (!prevGameDay || prevGames.length === 0) {
    return (
      <div className="flex flex-col min-h-screen pb-24">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/30">
          <div className="px-4 py-4 flex items-center gap-3">
            <Logo size={36} />
            <h1 className="text-xl font-bold text-foreground">Yesterday&apos;s Results</h1>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full border-border/50 bg-card/50">
            <CardContent className="p-6 text-center space-y-2">
              <h2 className="text-lg font-semibold">No previous results yet</h2>
              <p className="text-sm text-muted-foreground">
                Once a slate finishes, you&apos;ll see results here.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  let userCorrect = 0
  let friendCorrect = 0
  let resolvedGames = 0
  for (const g of prevGames) {
    if (!g.winner_team) continue
    resolvedGames++
    if (prevUserPicks[g.id] === g.winner_team) userCorrect++
    if (prevFriendPicks[g.id] === g.winner_team) friendCorrect++
  }

  const dayLabel = formatShortDate(prevGameDay.nba_date)
  const fullyResolved = resolvedGames === prevGames.length

  const buildResultsText = () => {
    let text = `🏀 NBA Picks — ${dayLabel}\n\n`
    text += `${userName}: ${userCorrect} | ${friendName}: ${friendCorrect}\n\n`
    prevGames.forEach((game) => {
      const winner = game.winner_team
      const you = prevUserPicks[game.id]
      const them = prevFriendPicks[game.id]
      text += `${teamAbbr(game.away_team)} @ ${teamAbbr(game.home_team)}`
      if (winner) text += ` → ${teamAbbr(winner)}`
      text += '\n'
      text += `${userName}: ${you ? teamAbbr(you) : '—'}${winner && you === winner ? ' ✓' : winner ? ' ✗' : ''} | `
      text += `${friendName}: ${them ? teamAbbr(them) : '—'}${winner && them === winner ? ' ✓' : winner ? ' ✗' : ''}\n\n`
    })
    return text
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/30">
        <div className="px-4 py-4 flex items-center gap-3">
          <Logo size={36} />
          <div>
            <h1 className="text-xl font-bold text-foreground">Yesterday&apos;s Results</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{dayLabel}</p>
          </div>
        </div>
      </header>

      {/* Day Score */}
      <div className="px-4 py-3">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{userName}</p>
                <p className={cn(
                  'text-2xl font-bold',
                  userCorrect > friendCorrect && 'text-primary'
                )}>
                  {userCorrect}
                </p>
              </div>
              <span className="text-muted-foreground text-sm">vs</span>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{friendName}</p>
                <p className={cn(
                  'text-2xl font-bold',
                  friendCorrect > userCorrect && 'text-accent'
                )}>
                  {friendCorrect}
                </p>
              </div>
            </div>
            {!fullyResolved && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                {resolvedGames}/{prevGames.length} games final — score may update
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-game breakdown */}
      <div className="flex-1 px-4 pt-1 space-y-3">
        {prevGames.map((game) => {
          const winner = game.winner_team
          const you = prevUserPicks[game.id]
          const them = prevFriendPicks[game.id]
          const youCorrect = !!winner && you === winner
          const themCorrect = !!winner && them === winner

          return (
            <Card key={game.id} className="border-border/50 bg-card/80 overflow-hidden">
              <CardContent className="p-0">
                <div className="px-4 py-3 bg-secondary/30 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {teamAbbr(game.away_team)} @ {teamAbbr(game.home_team)}
                      {game.away_score !== null && game.home_score !== null && (
                        <span className="text-muted-foreground ml-2">
                          {game.away_score}–{game.home_score}
                        </span>
                      )}
                    </span>
                    {winner ? (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-500/10 text-green-400">
                        {teamAbbr(winner)} won
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 grid grid-cols-2 gap-3">
                  <div className={cn(
                    'p-3 rounded-xl text-center border-2',
                    !winner
                      ? 'bg-secondary/30 border-border/30'
                      : youCorrect
                      ? 'bg-green-500/10 border-green-500/40'
                      : 'bg-destructive/10 border-destructive/40'
                  )}>
                    <p className="text-xs text-muted-foreground mb-1">{userName}</p>
                    <p className="font-bold text-lg">
                      {you ? teamAbbr(you) : '—'}
                      {winner && you && (
                        <span className="ml-1">{youCorrect ? '✓' : '✗'}</span>
                      )}
                    </p>
                  </div>

                  <div className={cn(
                    'p-3 rounded-xl text-center border-2',
                    !winner
                      ? 'bg-secondary/30 border-border/30'
                      : themCorrect
                      ? 'bg-green-500/10 border-green-500/40'
                      : 'bg-destructive/10 border-destructive/40'
                  )}>
                    <p className="text-xs text-muted-foreground mb-1">{friendName}</p>
                    <p className="font-bold text-lg">
                      {them ? teamAbbr(them) : '—'}
                      {winner && them && (
                        <span className="ml-1">{themCorrect ? '✓' : '✗'}</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <CopyButton getText={buildResultsText} label="Copy Results to WhatsApp" />
      </div>
    </div>
  )
}
