'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CopyButton } from '@/components/copy-button'
import { Logo } from '@/components/logo'
import { useAppStore } from '@/lib/store'
import { teamAbbr } from '@/lib/types'
import { cn } from '@/lib/utils'

export function TodayRosterScreen() {
  const {
    games,
    userPicks,
    profile,
    otherProfiles,
    picksByUser,
    submittedByUser,
    refreshSubmissionStatuses,
  } = useAppStore()

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const userName = profile?.display_name ?? 'You'

  const allOthersSubmitted =
    otherProfiles.length > 0 &&
    otherProfiles.every((p) => submittedByUser[p.id])

  useEffect(() => {
    if (allOthersSubmitted) return
    const id = setInterval(() => {
      refreshSubmissionStatuses()
    }, 10000)
    return () => clearInterval(id)
  }, [allOthersSubmitted, refreshSubmissionStatuses])

  const pendingProfiles = otherProfiles.filter(
    (p) => !submittedByUser[p.id],
  )
  const pendingNames = pendingProfiles.map((p) => p.display_name)

  const yourTurnLine = () => {
    if (pendingNames.length === 0) return 'Sıra sende!'
    if (pendingNames.length === 1) return `Sıra sende: ${pendingNames[0]}!`
    return `Sıra sizde: ${pendingNames.join(', ')}!`
  }

  const buildReminderText = () =>
    `🏀 NBA tahminlerimi kilitledim. ${yourTurnLine()}\n\nhttps://clutch-pick.vercel.app`

  const buildRevealText = () => {
    let text = '🏀 Bu Geceki Tahminler Açıklandı!\n\n'
    games.forEach((game) => {
      text += `${teamAbbr(game.away_team)} @ ${teamAbbr(game.home_team)}\n`
      const me = userPicks[game.id]
      text += `  ${userName}: ${me ? teamAbbr(me) : '—'}\n`
      for (const p of otherProfiles) {
        if (!submittedByUser[p.id]) continue
        const pick = picksByUser[p.id]?.[game.id]
        if (!pick) continue
        text += `  ${p.display_name}: ${teamAbbr(pick)}\n`
      }
      text += '\n'
    })
    text += 'https://clutch-pick.vercel.app'
    return text
  }

  // Spoiler-safe partial: shows whether locked-in picks align without
  // revealing teams. Used while at least one user still has to pick.
  const buildPartialText = () => {
    let text = '🏀 Tahminler kilitleniyor!\n\n'
    games.forEach((game) => {
      const picks: string[] = []
      const myPick = userPicks[game.id]
      if (myPick) picks.push(myPick)
      for (const p of otherProfiles) {
        if (!submittedByUser[p.id]) continue
        const pick = picksByUser[p.id]?.[game.id]
        if (pick) picks.push(pick)
      }
      const distinct = new Set(picks).size
      const label =
        picks.length < 2
          ? '⏳ Bekleniyor'
          : distinct === 1
          ? '🤝 Aynı seçim'
          : '⚔️ Farklı seçimler'
      text += `${teamAbbr(game.away_team)} @ ${teamAbbr(game.home_team)}  ${label}\n`
    })
    text += `\n⏳ ${yourTurnLine()}\n\nhttps://clutch-pick.vercel.app`
    return text
  }

  const revealedCount = otherProfiles.filter(
    (p) => submittedByUser[p.id] && picksByUser[p.id],
  ).length
  const someoneRevealed = revealedCount > 0

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/30">
        <div className="px-4 py-4 flex items-center gap-3">
          <Logo size={36} />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Tonight&apos;s Picks</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-green-400 font-medium">
                Picks locked
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* My picks summary */}
      <div className="px-4 pt-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10">
                <svg
                  className="w-4 h-4 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold">My picks</p>
                <p className="text-xs text-muted-foreground">{userName}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {games.map((game) => {
                const pickedTeam = userPicks[game.id]
                return (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30"
                  >
                    <span className="text-xs text-muted-foreground">
                      {teamAbbr(game.away_team)} @ {teamAbbr(game.home_team)}
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      {pickedTeam ? teamAbbr(pickedTeam) : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roster */}
      <div className="px-4 pt-4 flex-1">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Others{otherProfiles.length > 0 && ` (${otherProfiles.length})`}
        </h2>
        {otherProfiles.length === 0 ? (
          <Card className="border-border/30 bg-card/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground text-center">
                No other players yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {otherProfiles.map((p) => {
              const submitted = !!submittedByUser[p.id]
              const picks = picksByUser[p.id]
              const revealed = submitted && !!picks
              const isExpanded = expanded[p.id] ?? true
              const initial = (p.display_name ?? '?').charAt(0).toUpperCase()

              return (
                <Card
                  key={p.id}
                  className={cn(
                    'border-border/30 bg-card/50 overflow-hidden',
                    revealed && 'border-border/60',
                  )}
                >
                  <button
                    type="button"
                    onClick={() =>
                      revealed &&
                      setExpanded((s) => ({ ...s, [p.id]: !isExpanded }))
                    }
                    disabled={!revealed}
                    className={cn(
                      'w-full text-left p-4 flex items-center justify-between',
                      revealed && 'cursor-pointer hover:bg-secondary/20',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold',
                          revealed
                            ? 'bg-primary/20 text-primary'
                            : submitted
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-muted/50 text-muted-foreground',
                        )}
                      >
                        {initial}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{p.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {revealed
                            ? '🔓 Picks revealed'
                            : submitted
                            ? '🔒 Locked in (hidden)'
                            : '⏳ Still picking'}
                        </p>
                      </div>
                    </div>
                    {revealed && (
                      <svg
                        className={cn(
                          'w-4 h-4 text-muted-foreground transition-transform',
                          isExpanded && 'rotate-180',
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </button>
                  {revealed && isExpanded && (
                    <div className="border-t border-border/30 px-4 py-3 space-y-1.5 bg-secondary/10">
                      {games.map((game) => {
                        const theirPick = picks?.[game.id]
                        const myPick = userPicks[game.id]
                        const same = !!myPick && myPick === theirPick
                        return (
                          <div
                            key={game.id}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-muted-foreground">
                              {teamAbbr(game.away_team)} @{' '}
                              {teamAbbr(game.home_team)}
                            </span>
                            <span className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'font-semibold',
                                  same ? 'text-green-400' : 'text-foreground',
                                )}
                              >
                                {theirPick ? teamAbbr(theirPick) : '—'}
                              </span>
                              <span className="text-[10px]">
                                {same ? '🤝' : '⚔️'}
                              </span>
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <CopyButton
          getText={
            allOthersSubmitted
              ? buildRevealText
              : someoneRevealed
              ? buildPartialText
              : buildReminderText
          }
          label={
            allOthersSubmitted
              ? 'Copy Picks to WhatsApp'
              : someoneRevealed
              ? 'Copy Status to WhatsApp'
              : 'Copy Reminder to WhatsApp'
          }
        />
      </div>
    </div>
  )
}
