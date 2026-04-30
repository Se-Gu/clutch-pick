'use client'

import { Card, CardContent } from '@/components/ui/card'
import { CopyButton } from '@/components/copy-button'
import { Logo } from '@/components/logo'
import { useAppStore } from '@/lib/store'
import { formatShortDate, teamAbbr, type Profile } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Participant {
  id: string
  name: string
  picks: Record<string, string>
  isSelf: boolean
}

export function RevealScreen() {
  const {
    prevGameDay,
    prevGames,
    prevUserPicks,
    prevPicksByUser,
    profile,
    otherProfiles,
    userId,
  } = useAppStore()

  if (!prevGameDay || prevGames.length === 0) {
    return (
      <div className="flex flex-col min-h-screen pb-24">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/30">
          <div className="px-4 py-4 flex items-center gap-3">
            <Logo size={36} />
            <h1 className="text-xl font-bold text-foreground">
              Yesterday&apos;s Results
            </h1>
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

  const userName = profile?.display_name ?? 'You'

  const participants: Participant[] = [
    {
      id: userId ?? 'self',
      name: userName,
      picks: prevUserPicks,
      isSelf: true,
    },
    ...otherProfiles
      .filter((p: Profile) => prevPicksByUser[p.id])
      .map((p: Profile) => ({
        id: p.id,
        name: p.display_name,
        picks: prevPicksByUser[p.id] ?? {},
        isSelf: false,
      })),
  ]

  const correctCount = (picks: Record<string, string>) => {
    let n = 0
    for (const g of prevGames) {
      if (g.winner_team && picks[g.id] === g.winner_team) n++
    }
    return n
  }

  const standings = participants
    .map((p) => ({ ...p, correct: correctCount(p.picks) }))
    .sort(
      (a, b) =>
        b.correct - a.correct ||
        (a.isSelf === b.isSelf ? 0 : a.isSelf ? -1 : 1) ||
        a.name.localeCompare(b.name),
    )

  const resolvedGames = prevGames.filter((g) => g.winner_team).length
  const fullyResolved = resolvedGames === prevGames.length
  const dayLabel = formatShortDate(prevGameDay.nba_date)

  const buildResultsText = () => {
    let text = `🏀 NBA Picks — ${dayLabel}\n\n`
    text += `📊 Standings:\n`
    standings.forEach((s, i) => {
      text += `${i + 1}. ${s.name}: ${s.correct}\n`
    })
    text += '\n'
    prevGames.forEach((game) => {
      text += `${teamAbbr(game.away_team)} @ ${teamAbbr(game.home_team)}`
      if (game.winner_team) text += ` → ${teamAbbr(game.winner_team)}`
      text += '\n'
      for (const p of standings) {
        const pick = p.picks[game.id]
        if (!pick) continue
        const ok = game.winner_team && pick === game.winner_team
        const mark = game.winner_team ? (ok ? ' ✓' : ' ✗') : ''
        text += `  ${p.name}: ${teamAbbr(pick)}${mark}\n`
      }
      text += '\n'
    })
    return text
  }

  const topCorrect = standings[0]?.correct ?? 0

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/30">
        <div className="px-4 py-4 flex items-center gap-3">
          <Logo size={36} />
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Yesterday&apos;s Results
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{dayLabel}</p>
          </div>
        </div>
      </header>

      {/* Standings */}
      <div className="px-4 py-3">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 space-y-2">
            {standings.map((s, i) => {
              const isLeader = s.correct === topCorrect && topCorrect > 0
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-4 text-right">
                      {i + 1}
                    </span>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        s.isSelf && 'text-primary',
                      )}
                    >
                      {s.name}
                      {s.isSelf && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (you)
                        </span>
                      )}
                    </span>
                    {isLeader && (
                      <span className="text-xs">👑</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-lg font-bold',
                      isLeader ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {s.correct}
                  </span>
                </div>
              )
            })}
            {!fullyResolved && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                {resolvedGames}/{prevGames.length} games final — score may
                update
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-game breakdown */}
      <div className="flex-1 px-4 pt-1 space-y-3">
        {prevGames.map((game) => {
          const winner = game.winner_team
          return (
            <Card
              key={game.id}
              className="border-border/50 bg-card/80 overflow-hidden"
            >
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

                <div className="p-3 space-y-1.5">
                  {participants.map((p) => {
                    const pick = p.picks[game.id]
                    if (!pick) {
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between text-xs px-2"
                        >
                          <span className="text-muted-foreground">
                            {p.name}
                            {p.isSelf && ' (you)'}
                          </span>
                          <span className="text-muted-foreground">—</span>
                        </div>
                      )
                    }
                    const ok = !!winner && pick === winner
                    return (
                      <div
                        key={p.id}
                        className={cn(
                          'flex items-center justify-between text-xs px-2 py-1.5 rounded',
                          !winner
                            ? 'bg-secondary/20'
                            : ok
                            ? 'bg-green-500/10'
                            : 'bg-destructive/10',
                        )}
                      >
                        <span
                          className={cn(
                            p.isSelf ? 'text-primary font-medium' : 'text-foreground',
                          )}
                        >
                          {p.name}
                          {p.isSelf && ' (you)'}
                        </span>
                        <span className="font-semibold flex items-center gap-1">
                          {teamAbbr(pick)}
                          {winner && (
                            <span
                              className={cn(
                                ok ? 'text-green-400' : 'text-destructive',
                              )}
                            >
                              {ok ? '✓' : '✗'}
                            </span>
                          )}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <CopyButton
          getText={buildResultsText}
          label="Copy Results to WhatsApp"
        />
      </div>
    </div>
  )
}
