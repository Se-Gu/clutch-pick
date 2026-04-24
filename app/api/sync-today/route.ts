import { NextRequest, NextResponse } from 'next/server'
import { getUsEasternDate, syncGamesForDate } from '@/lib/nba'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function handle(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') ?? getUsEasternDate()
    const result = await syncGamesForDate(date)
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'sync failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
