import { create } from 'zustand'
import { supabase } from './supabase'
import * as data from './data'
import type { Game, GameDay, Profile } from './types'

export type TabId = 'today' | 'reveal' | 'tally'

interface AppStore {
  // Session
  userId: string | null
  profile: Profile | null
  otherProfile: Profile | null
  authChecked: boolean
  authListenerAttached: boolean

  // Today's game day
  gameDay: GameDay | null
  games: Game[]
  userPicks: Record<string, string> // gameId -> picked team name
  hasSubmitted: boolean
  friendHasSubmitted: boolean

  // Previous (yesterday's) game day
  prevGameDay: GameDay | null
  prevGames: Game[]
  prevUserPicks: Record<string, string>
  prevFriendPicks: Record<string, string>

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
  refreshFriendStatus: () => Promise<void>
}

const resetState = {
  userId: null,
  profile: null,
  otherProfile: null,
  gameDay: null,
  games: [],
  userPicks: {},
  hasSubmitted: false,
  friendHasSubmitted: false,
  prevGameDay: null,
  prevGames: [],
  prevUserPicks: {},
  prevFriendPicks: {},
}

async function loadTodayState(
  gameDay: GameDay,
  userId: string,
  otherUserId: string | null,
) {
  const games = await data.fetchGames(gameDay.id)
  const [preds, hasSub, friendSub] = await Promise.all([
    data.fetchPredictionsForDay(gameDay.id, userId),
    data.hasUserSubmittedDay(gameDay.id, userId),
    otherUserId
      ? data.hasUserSubmittedDay(gameDay.id, otherUserId)
      : Promise.resolve(false),
  ])
  const userPicks: Record<string, string> = {}
  for (const p of preds) userPicks[p.game_id] = p.picked_team
  return {
    games,
    userPicks,
    hasSubmitted: hasSub,
    friendHasSubmitted: friendSub,
  }
}

async function loadPrevState(
  prevGameDay: GameDay,
  userId: string,
  otherUserId: string | null,
) {
  const [prevGames, allPreds] = await Promise.all([
    data.fetchGames(prevGameDay.id),
    data.fetchAllPredictionsForDay(prevGameDay.id),
  ])
  const prevUserPicks: Record<string, string> = {}
  const prevFriendPicks: Record<string, string> = {}
  for (const p of allPreds) {
    if (p.user_id === userId) prevUserPicks[p.game_id] = p.picked_team
    else if (otherUserId && p.user_id === otherUserId)
      prevFriendPicks[p.game_id] = p.picked_team
  }
  return { prevGames, prevUserPicks, prevFriendPicks }
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
    const [profile, otherProfile, gameDay, prevGameDay] = await Promise.all([
      data.fetchProfile(userId),
      data.fetchOtherProfile(userId),
      data.fetchCurrentGameDay(),
      data.fetchPreviousGameDay(),
    ])

    const today = gameDay
      ? await loadTodayState(gameDay, userId, otherProfile?.id ?? null)
      : {
          games: [],
          userPicks: {},
          hasSubmitted: false,
          friendHasSubmitted: false,
        }

    const prev = prevGameDay
      ? await loadPrevState(prevGameDay, userId, otherProfile?.id ?? null)
      : { prevGames: [], prevUserPicks: {}, prevFriendPicks: {} }

    set({
      userId,
      profile,
      otherProfile,
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
      return {}
    } catch (e: any) {
      return { error: e?.message ?? 'Failed to submit picks' }
    }
  },

  refreshFriendStatus: async () => {
    const s = get()
    if (!s.gameDay || !s.otherProfile) return
    const friendSub = await data.hasUserSubmittedDay(
      s.gameDay.id,
      s.otherProfile.id,
    )
    set({ friendHasSubmitted: friendSub })
  },
}))
