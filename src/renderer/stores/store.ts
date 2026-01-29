import { create } from 'zustand'

export interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modifiedAt: number
  createdAt: number
  error?: boolean
  parentPath?: string
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
  leftViewMode: 'list' | 'grid'
  rightViewMode: 'list' | 'grid'
  leftSelection: string[]
  rightSelection: string[]
  searchQuery: string
  activeView: 'explorer' | 'analyzer' | 'apps' | 'network'
  activeSide: 'left' | 'right'
  showHidden: boolean
  dualPane: boolean
  clipboard: { paths: string[], type: 'copy' | 'cut' | null }
  
  // View Settings
  leftGridSize: 'small' | 'medium' | 'large' | 'xl'
  rightGridSize: 'small' | 'medium' | 'large' | 'xl'
  leftSortBy: 'name' | 'size' | 'date' | 'type'
  rightSortBy: 'name' | 'size' | 'date' | 'type'
  leftSortOrder: 'asc' | 'desc'
  rightSortOrder: 'asc' | 'desc'
  
  // Persistence for App Manager
  installedApps: any[]
  uwpApps: any[]
  orphans: any[]
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void
  setLeftViewMode: (mode: 'list' | 'grid') => void
  setRightViewMode: (mode: 'list' | 'grid') => void
  setSelection: (side: 'left' | 'right', selection: string[]) => void
  setSearchQuery: (query: string) => void
  setActiveView: (view: 'explorer' | 'analyzer' | 'apps' | 'network') => void
  setInstalledApps: (apps: any[]) => void
  setUwpApps: (apps: any[]) => void
  setOrphans: (orphans: any[]) => void
  addTab: (side: 'left' | 'right', path: string) => void
  closeTab: (side: 'left' | 'right', id: string) => void
  setActiveTab: (side: 'left' | 'right', id: string) => void
  updateTabFiles: (side: 'left' | 'right', id: string, files: FileItem[]) => void
  navigateTo: (side: 'left' | 'right', id: string, path: string) => void
  goBack: (side: 'left' | 'right', id: string) => void
  goForward: (side: 'left' | 'right', id: string) => void
  setActiveSide: (side: 'left' | 'right') => void
  toggleHidden: () => void
  toggleDualPane: () => void
  setGridSize: (side: 'left' | 'right', size: 'small' | 'medium' | 'large' | 'xl') => void
  setSortBy: (side: 'left' | 'right', sortBy: 'name' | 'size' | 'date' | 'type') => void
  setSortOrder: (side: 'left' | 'right', order: 'asc' | 'desc') => void
  copySelection: (side: 'left' | 'right') => void
  cutSelection: (side: 'left' | 'right') => void
  clearClipboard: () => void
}

export const useStore = create<AppState>((set) => ({
  leftTabs: [{ id: 'l1', path: 'C:\\', history: ['C:\\'], historyIndex: 0, files: [], loading: false }],
  rightTabs: [{ id: 'r1', path: 'C:\\', history: ['C:\\'], historyIndex: 0, files: [], loading: false }],
  activeLeftTabId: 'l1',
  activeRightTabId: 'r1',
  theme: 'dark',
  leftViewMode: 'grid',
  rightViewMode: 'grid',
  leftSelection: [],
  rightSelection: [],
  searchQuery: '',
  activeView: 'explorer',
  installedApps: [],
  uwpApps: [],
  orphans: [],
  activeSide: 'left',
  showHidden: false,
  dualPane: true,
  clipboard: { paths: [], type: null },
  leftGridSize: 'medium',
  rightGridSize: 'medium',
  leftSortBy: 'name',
  rightSortBy: 'name',
  leftSortOrder: 'asc',
  rightSortOrder: 'asc',

  setTheme: (theme) => set({ theme }),
  setLeftViewMode: (mode) => set({ leftViewMode: mode }),
  setRightViewMode: (mode) => set({ rightViewMode: mode }),
  setSelection: (side, selection) => set({ [side === 'left' ? 'leftSelection' : 'rightSelection']: selection }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveView: (view) => set({ activeView: view }),
  setInstalledApps: (installedApps) => set({ installedApps }),
  setUwpApps: (uwpApps) => set({ uwpApps }),
  setOrphans: (orphans) => set({ orphans }),

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
    if (newTabs.length === 0) return {} 
    
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
          return { ...t, path, history: newHistory, historyIndex: newHistory.length - 1, loading: true, files: [] }
        }
        return t
      })
    }
  }),

  goBack: (side, id) => set((state) => {
    const tabsKey = side === 'left' ? 'leftTabs' : 'rightTabs'
    return {
      [tabsKey]: state[tabsKey].map(t => {
        if (t.id === id && t.historyIndex > 0) {
          const newIndex = t.historyIndex - 1
          return { ...t, path: t.history[newIndex], historyIndex: newIndex, loading: true, files: [] }
        }
        return t
      })
    }
  }),

  goForward: (side, id) => set((state) => {
    const tabsKey = side === 'left' ? 'leftTabs' : 'rightTabs'
    return {
      [tabsKey]: state[tabsKey].map(t => {
        if (t.id === id && t.historyIndex < t.history.length - 1) {
          const newIndex = t.historyIndex + 1
          return { ...t, path: t.history[newIndex], historyIndex: newIndex, loading: true, files: [] }
        }
        return t
      })
    }
  }),

  setActiveSide: (side) => set({ activeSide: side }),

  toggleHidden: () => set((state: any) => ({ showHidden: !state.showHidden })),

  toggleDualPane: () => set((state: any) => ({ dualPane: !state.dualPane })),

  setGridSize: (side, size) => set({ [side === 'left' ? 'leftGridSize' : 'rightGridSize']: size }),
  setSortBy: (side, sortBy) => set({ [side === 'left' ? 'leftSortBy' : 'rightSortBy']: sortBy }),
  setSortOrder: (side, order) => set({ [side === 'left' ? 'leftSortOrder' : 'rightSortOrder']: order }),

  copySelection: (side) => set((state: any) => ({
    clipboard: { paths: side === 'left' ? state.leftSelection : state.rightSelection, type: 'copy' }
  })),

  cutSelection: (side) => set((state: any) => ({
    clipboard: { paths: side === 'left' ? state.leftSelection : state.rightSelection, type: 'cut' }
  })),

  clearClipboard: () => set({ clipboard: { paths: [], type: null } }),
}))
