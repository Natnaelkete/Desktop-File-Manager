import { create } from 'zustand'

export interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modifiedAt: number
  createdAt: number
  error?: boolean
}

export interface TabState {
  id: string
  path: string
  history: string[]
  historyIndex: number
  files: FileItem[]
  loading: boolean
}

interface AppState {
  leftTabs: TabState[]
  rightTabs: TabState[]
  activeLeftTabId: string
  activeRightTabId: string
  theme: 'light' | 'dark'
  viewMode: 'list' | 'grid'
  selection: string[]
  searchQuery: string
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void
  addTab: (side: 'left' | 'right', path: string) => void
  closeTab: (side: 'left' | 'right', id: string) => void
  setActiveTab: (side: 'left' | 'right', id: string) => void
  updateTabFiles: (side: 'left' | 'right', id: string, files: FileItem[]) => void
  navigateTo: (side: 'left' | 'right', id: string, path: string) => void
  setViewMode: (mode: 'list' | 'grid') => void
  setSelection: (paths: string[]) => void
  setSearchQuery: (query: string) => void
}

export const useStore = create<AppState>((set) => ({
  leftTabs: [{ id: 'l1', path: 'C:\\', history: ['C:\\'], historyIndex: 0, files: [], loading: false }],
  rightTabs: [{ id: 'r1', path: 'C:\\', history: ['C:\\'], historyIndex: 0, files: [], loading: false }],
  activeLeftTabId: 'l1',
  activeRightTabId: 'r1',
  theme: 'dark',
  viewMode: 'list', // 'list' | 'grid'
  selection: [],
  searchQuery: '',

  setTheme: (theme) => set({ theme }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelection: (paths) => set({ selection: paths }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  addTab: (side, path) => set((state) => {
    const id = `${side[0]}${Date.now()}`
    const newTab = { id, path, history: [path], historyIndex: 0, files: [], loading: false }
    return side === 'left' 
      ? { leftTabs: [...state.leftTabs, newTab], activeLeftTabId: id }
      : { rightTabs: [...state.rightTabs, newTab], activeRightTabId: id }
  }),

  closeTab: (side, id) => set((state) => {
    const tabsKey = side === 'left' ? 'leftTabs' : 'rightTabs'
    const activeKey = side === 'left' ? 'activeLeftTabId' : 'activeRightTabId'
    const newTabs = state[tabsKey].filter(t => t.id !== id)
    if (newTabs.length === 0) return {} // Prevent closing last tab
    
    let newActiveId = state[activeKey]
    if (newActiveId === id) {
      newActiveId = newTabs[newTabs.length - 1].id
    }
    
    return { [tabsKey]: newTabs, [activeKey]: newActiveId }
  }),

  setActiveTab: (side, id) => set((state) => ({
    [side === 'left' ? 'activeLeftTabId' : 'activeRightTabId']: id
  })),

  updateTabFiles: (side, id, files) => set((state) => {
    const tabsKey = side === 'left' ? 'leftTabs' : 'rightTabs'
    return {
      [tabsKey]: state[tabsKey].map(t => t.id === id ? { ...t, files, loading: false } : t)
    }
  }),

  navigateTo: (side, id, path) => set((state) => {
    const tabsKey = side === 'left' ? 'leftTabs' : 'rightTabs'
    return {
      [tabsKey]: state[tabsKey].map(t => {
        if (t.id === id) {
          const newHistory = t.history.slice(0, t.historyIndex + 1)
          newHistory.push(path)
          return { ...t, path, history: newHistory, historyIndex: newHistory.length - 1, loading: true }
        }
        return t
      })
    }
  }),
}))
