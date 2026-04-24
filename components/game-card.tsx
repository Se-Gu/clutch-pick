'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { formatTurkeyTime, teamAbbr, type Game } from '@/lib/types'

interface GameCardProps {
  game: Game
  selectedPick?: string
  onPick: (team: string) => void
  disabled?: boolean
}

export function GameCard({ game, selectedPick, onPick, disabled }: GameCardProps) {
  const awaySelected = selectedPick === game.away_team
  const homeSelected = selectedPick === game.home_team

  return (
    <Card className="border-border/50 bg-card/80 overflow-hidden">
      <CardContent className="p-0">
        {/* Time header */}
        <div className="px-4 py-2 bg-secondary/30 border-b border-border/30">
          <span className="text-xs text-muted-foreground font-medium">
            {formatTurkeyTime(game.starts_at)} Turkey Time
          </span>
        </div>

        {/* Teams */}
        <div className="p-3 space-y-2">
          {/* Away Team */}
          <button
            onClick={() => onPick(game.away_team)}
            disabled={disabled}
            className={cn(
              'w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200',
              'border-2',
              awaySelected
                ? 'bg-primary/15 border-primary text-foreground'
                : 'bg-secondary/30 border-transparent hover:bg-secondary/50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm',
                awaySelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                {teamAbbr(game.away_team)}
              </div>
              <span className="font-medium">{game.away_team}</span>
            </div>
            {awaySelected && (
              <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* VS Divider */}
          <div className="flex items-center gap-2 px-2">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-xs text-muted-foreground font-medium">VS</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          {/* Home Team */}
          <button
            onClick={() => onPick(game.home_team)}
            disabled={disabled}
            className={cn(
              'w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200',
              'border-2',
              homeSelected
                ? 'bg-primary/15 border-primary text-foreground'
                : 'bg-secondary/30 border-transparent hover:bg-secondary/50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm',
                homeSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                {teamAbbr(game.home_team)}
              </div>
              <span className="font-medium">{game.home_team}</span>
            </div>
            {homeSelected && (
              <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
