import { create } from 'zustand'
import { supabase } from './supabase'
import * as data from './data'
import type { Game, GameDay, Profile } from './types'

export type TabId = 'today' | 'reveal' | 'tally'

export type PicksByUser = Record<string, Record<string, string>>
export type SubmittedByUser = Record<string, boolean>

interface AppStore {
  // Session
  userId: string | null
  profile: Profile | null
  otherProfiles: Profile[]
  authChecked: boolean
  authListenerAttached: boolean

  // Today's game day
  gameDay: GameDay | null
  games: Game[]
  userPicks: Record<string, string> // gameId -> picked team name
  picksByUser: PicksByUser // userId -> gameId -> team (excludes self)
  hasSubmitted: boolean
  submittedByUser: SubmittedByUser // userId -> bool (excludes self)

  // Previous (yesterday's) game day
  prevGameDay: GameDay | null
  prevGames: Game[]
  prevUserPicks: Record<string, string>
  prevPicksByUser: PicksByUser

  // UI
  activeTab: TabId
  loading: boolean

  // Actions
  bootstrap: () => Promise<void>
  reload: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  setActiveTab: (tab: TabId) => void
  setPick: (gameId: string, team: string) => void
  submitPicks: () => Promise<{ error?: string }>
  refreshSubmissionStatuses: () => Promise<void>
}

const resetState = {
  userId: null,
  profile: null,
  otherProfiles: [] as Profile[],
  gameDay: null,
  games: [],
  userPicks: {},
  picksByUser: {} as PicksByUser,
  hasSubmitted: false,
  submittedByUser: {} as SubmittedByUser,
  prevGameDay: null,
  prevGames: [],
  prevUserPicks: {},
  prevPicksByUser: {} as PicksByUser,
}

function foldPredictions(
  preds: Awaited<ReturnType<typeof data.fetchAllPredictionsForDay>>,
  selfId: string,
): { selfPicks: Record<string, string>; othersPicks: PicksByUser } {
  const selfPicks: Record<string, string> = {}
  const othersPicks: PicksByUser = {}
  for (const p of preds) {
    if (p.user_id === selfId) {
      selfPicks[p.game_id] = p.picked_team
    } else {
      const m = othersPicks[p.user_id] ?? (othersPicks[p.user_id] = {})
      m[p.game_id] = p.picked_team
    }
  }
  return { selfPicks, othersPicks }
}

async function loadTodayState(gameDay: GameDay, userId: string) {
  const [games, allPreds, submitted] = await Promise.all([
    data.fetchGames(gameDay.id),
    data.fetchAllPredictionsForDay(gameDay.id),
    data.fetchAllSubmissionStatuses(gameDay.id),
  ])
  const { selfPicks, othersPicks } = foldPredictions(allPreds, userId)
  const submittedByUser: SubmittedByUser = { ...submitted }
  delete submittedByUser[userId]
  return {
    games,
    userPicks: selfPicks,
    picksByUser: othersPicks,
    hasSubmitted: !!submitted[userId],
    submittedByUser,
  }
}

async function loadPrevState(prevGameDay: GameDay, userId: string) {
  const [prevGames, allPreds] = await Promise.all([
    data.fetchGames(prevGameDay.id),
    data.fetchAllPredictionsForDay(prevGameDay.id),
  ])
  const { selfPicks, othersPicks } = foldPredictions(allPreds, userId)
  return {
    prevGames,
    prevUserPicks: selfPicks,
    prevPicksByUser: othersPicks,
  }
}

export const useAppStore = create<AppStore>((set, get) => ({
  ...resetState,
  authChecked: false,
  authListenerAttached: false,
  activeTab: 'today',
  loading: false,

  bootstrap: async () => {
    await get().reload()
    if (!get().authListenerAttached) {
      supabase.auth.onAuthStateChange(() => {
        get().reload()
      })
      set({ authListenerAttached: true })
    }
    set({ authChecked: true })
  },

  reload: async () => {
    set({ loading: true })
    const [{ data: sessionData }] = await Promise.all([
      supabase.auth.getSession(),
      fetch('/api/sync-today', { method: 'POST' }).catch(() => null),
    ])
    const session = sessionData.session
    if (!session) {
      set({ ...resetState, loading: false })
      return
    }
    const userId = session.user.id
    const [profile, otherProfiles, gameDay, prevGameDay] = await Promise.all([
      data.fetchProfile(userId),
      data.fetchAllOtherProfiles(userId),
      data.fetchCurrentGameDay(),
      data.fetchPreviousGameDay(),
    ])

    const today = gameDay
      ? await loadTodayState(gameDay, userId)
      : {
          games: [],
          userPicks: {},
          picksByUser: {} as PicksByUser,
          hasSubmitted: false,
          submittedByUser: {} as SubmittedByUser,
        }

    const prev = prevGameDay
      ? await loadPrevState(prevGameDay, userId)
      : {
          prevGames: [],
          prevUserPicks: {},
          prevPicksByUser: {} as PicksByUser,
        }

    set({
      userId,
      profile,
      otherProfiles,
      gameDay,
      prevGameDay,
      ...today,
      ...prev,
      loading: false,
    })
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  },

  signOut: async () => {
    await supabase.auth.signOut()
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setPick: (gameId, team) =>
    set((s) => ({ userPicks: { ...s.userPicks, [gameId]: team } })),

  submitPicks: async () => {
    const s = get()
    if (!s.gameDay || !s.userId) return { error: 'Not ready' }
    const picks = s.games
      .filter((g) => s.userPicks[g.id])
      .map((g) => ({ gameId: g.id, pickedTeam: s.userPicks[g.id] }))
    try {
      await data.submitDay({
        gameDayId: s.gameDay.id,
        userId: s.userId,
        picks,
      })
      set({ hasSubmitted: true })
      // Re-fetch so RLS-revealed picks from already-submitted users show up.
      await get().refreshSubmissionStatuses()
      return {}
    } catch (e: any) {
      return { error: e?.message ?? 'Failed to submit picks' }
    }
  },

  refreshSubmissionStatuses: async () => {
    const s = get()
    if (!s.gameDay || !s.userId) return
    const today = await loadTodayState(s.gameDay, s.userId)
    set(today)
  },
}))
