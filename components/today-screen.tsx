'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { GameCard } from '@/components/game-card'
import { Logo } from '@/components/logo'
import { useAppStore } from '@/lib/store'
import { formatTurkeyTime } from '@/lib/types'
import { cn } from '@/lib/utils'

export function TodayScreen() {
  const {
    games,
    gameDay,
    profile,
    otherProfile,
    userPicks,
    setPick,
    submitPicks,
    hasSubmitted,
    friendHasSubmitted,
    loading,
  } = useAppStore()

  const allPicked = games.length > 0 && games.every((g) => userPicks[g.id])
  const pickedCount = games.filter((g) => userPicks[g.id]).length

  const userName = profile?.display_name ?? 'You'
  const friendName = otherProfile?.display_name ?? 'Friend'
  const userInitial = userName.charAt(0).toUpperCase()
  const friendInitial = friendName.charAt(0).toUpperCase()

  if (loading && games.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-sm text-muted-foreground">
        Loading tonight&apos;s games…
      </div>
    )
  }

  if (!gameDay || games.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 pb-24">
        <Card className="w-full max-w-sm border-border/50 bg-card/50">
          <CardContent className="p-6 text-center space-y-2">
            <h2 className="text-lg font-semibold">No games tonight</h2>
            <p className="text-sm text-muted-foreground">
              Check back when the next slate is scheduled.
            </p>
          </CardContent>
        </Card>
      </div>
    )
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
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">
              Locks at first tip-off:{' '}
              <span className="text-foreground font-medium">
                {formatTurkeyTime(gameDay.first_game_starts_at)}
              </span>
            </span>
          </div>
          </div>
        </div>
      </header>

      {/* Progress Card */}
      <div className="px-4 py-3">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  hasSubmitted ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'
                )}>
                  {hasSubmitted ? '✓' : userInitial}
                </div>
                <div>
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {hasSubmitted ? 'Submitted' : `${pickedCount}/${games.length} picked`}
                  </p>
                </div>
              </div>

              <div className="h-8 w-px bg-border/50" />

              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-medium text-right">{friendName}</p>
                  <p className="text-xs text-muted-foreground text-right">
                    {friendHasSubmitted ? 'Submitted' : 'Waiting...'}
                  </p>
                </div>
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  friendHasSubmitted ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'
                )}>
                  {friendHasSubmitted ? '✓' : friendInitial}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Games List */}
      <div className="flex-1 px-4 space-y-3">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            selectedPick={userPicks[game.id]}
            onPick={(team) => setPick(game.id, team)}
            disabled={hasSubmitted}
          />
        ))}
      </div>

      {/* Sticky Submit Button */}
      {!hasSubmitted && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <Button
            onClick={() => submitPicks()}
            disabled={!allPicked}
            className="w-full h-14 text-base font-semibold"
          >
            {allPicked
              ? 'Lock My Picks'
              : `Pick ${games.length - pickedCount} more game${games.length - pickedCount > 1 ? 's' : ''}`}
          </Button>
        </div>
      )}
    </div>
  )
}
