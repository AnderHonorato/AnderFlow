import { create } from 'zustand'

// UI Store - estado visual apenas
export const useUIStore = create<{
  sidebarOpen: boolean
  mobileMenuOpen: boolean
  toggleMobileMenu: () => void
  setMobileMenuOpen: (v: boolean) => void
}>(set => ({
  sidebarOpen: true,
  mobileMenuOpen: false,
  toggleMobileMenu: () => set(s => ({ mobileMenuOpen: !s.mobileMenuOpen })),
  setMobileMenuOpen: v => set({ mobileMenuOpen: v }),
}))

// Online counter
export const useOnlineStore = create<{
  onlineNow: number
  maxSimultaneous: number
  visitsToday: number
  setStats: (stats: { onlineNow: number; maxSimultaneous: number; totalVisitsToday: number }) => void
}>(set => ({
  onlineNow: 0,
  maxSimultaneous: 0,
  visitsToday: 0,
  setStats: stats => set({
    onlineNow: stats.onlineNow,
    maxSimultaneous: stats.maxSimultaneous,
    visitsToday: stats.totalVisitsToday,
  }),
}))

// Project filter store
export const useProjectStore = create<{
  search: string
  view: 'kanban' | 'list'
  setSearch: (s: string) => void
  setView: (v: 'kanban' | 'list') => void
}>(set => ({
  search: '',
  view: 'kanban',
  setSearch: s => set({ search: s }),
  setView: v => set({ view: v }),
}))
