'use client'

import { useEffect } from 'react'
import { LoginScreen } from '@/components/login-screen'
import { TodayScreen } from '@/components/today-screen'
import { TodayRosterScreen } from '@/components/today-roster-screen'
import { RevealScreen } from '@/components/reveal-screen'
import { TallyScreen } from '@/components/tally-screen'
import { BottomNav } from '@/components/bottom-nav'
import { useAppStore } from '@/lib/store'

export default function Home() {
  const { userId, authChecked, activeTab, hasSubmitted, bootstrap } =
    useAppStore()

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  if (!authChecked) {
    return (
      <main className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </main>
    )
  }

  if (!userId) {
    return <LoginScreen />
  }

  return (
    <main className="min-h-screen bg-background">
      {activeTab === 'today' &&
        (hasSubmitted ? <TodayRosterScreen /> : <TodayScreen />)}
      {activeTab === 'reveal' && <RevealScreen />}
      {activeTab === 'tally' && <TallyScreen />}
      <BottomNav />
    </main>
  )
}
