import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUIStore = create<{
  sidebarOpen: boolean
  mobileMenuOpen: boolean
  toggleMobileMenu: () => void
  setMobileMenuOpen: (v: boolean) => void
  toggleSidebar: () => void
}>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      mobileMenuOpen: false,
      toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),
      setMobileMenuOpen: (v) => set({ mobileMenuOpen: v }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    {
      name: 'anderflow-ui-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)

export const useOnlineStore = create<{
  onlineNow: number
  maxSimultaneous: number
  visitsToday: number
  setStats: (stats: { onlineNow: number; maxSimultaneous: number; totalVisitsToday: number }) => void
}>((set) => ({
  onlineNow: 0,
  maxSimultaneous: 0,
  visitsToday: 0,
  setStats: (stats) =>
    set({
      onlineNow: stats.onlineNow,
      maxSimultaneous: stats.maxSimultaneous,
      visitsToday: stats.totalVisitsToday,
    }),
}))

export const useProjectStore = create<{
  search: string
  view: 'kanban' | 'list'
  setSearch: (s: string) => void
  setView: (v: 'kanban' | 'list') => void
}>()(
  persist(
    (set) => ({
      search: '',
      view: 'kanban',
      setSearch: (s) => set({ search: s }),
      setView: (v) => set({ view: v }),
    }),
    {
      name: 'anderflow-project-storage',
      partialize: (state) => ({
        view: state.view,
      }),
    }
  )
)
