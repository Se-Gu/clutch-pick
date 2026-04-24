import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: number
  showWordmark?: boolean
}

export function Logo({ className, size = 40, showWordmark = false }: LogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="ClutchPick"
        role="img"
      >
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="14"
          className="fill-primary"
        />
        <text
          x="32"
          y="34"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
          fontWeight="900"
          fontSize="30"
          letterSpacing="-1.5"
          className="fill-primary-foreground"
        >
          CP
        </text>
      </svg>
      {showWordmark && (
        <span className="font-bold tracking-tight text-foreground">
          ClutchPick
        </span>
      )}
    </div>
  )
}
