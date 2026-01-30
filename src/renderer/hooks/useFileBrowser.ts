import { useRef, useEffect, useCallback } from 'react'
import { FileItem, useStore } from '../stores/store'

// Request deduplication map
const pendingRequests = new Map<string, Promise<any>>()

export const useFileBrowser = (side: 'left' | 'right' | 'bottomLeft' | 'bottomRight', tabId: string) => {
  const { updateTabFiles } = useStore()
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastPathRef = useRef<string>('')
  
  const refresh = useCallback(async (path: string) => {
    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce rapid navigation
    return new Promise<void>((resolve) => {
      debounceTimerRef.current = setTimeout(async () => {
        try {
          // Check if request is already pending
          let filesPromise = pendingRequests.get(path)
          
          if (!filesPromise) {
            if (path.startsWith('library://')) {
              const type = path.replace('library://', '')
              filesPromise = (window as any).electronAPI.getLibraryFiles(type) as Promise<any>
            } else {
              filesPromise = (window as any).electronAPI.listDir(path) as Promise<any>
            }
            pendingRequests.set(path, filesPromise)
          }
          
          // Clean up after request completes
          filesPromise.finally(() => {
            pendingRequests.delete(path)
          })
          
          const files = await filesPromise
          
          // CRITICAL: Get current state to check if path changed while waiting
          const currentState = useStore.getState() as any
          let tabs = [];
          
          if (side === 'left') tabs = currentState.leftTabs;
          else if (side === 'right') tabs = currentState.rightTabs;
          else if (side === 'bottomLeft') tabs = currentState.bottomLeftTabs;
          else tabs = currentState.bottomRightTabs;
          
          const currentTab = tabs.find((t: any) => t.id === tabId)
          
          if (currentTab && currentTab.path === path) {
            updateTabFiles(side, tabId, files)
            lastPathRef.current = path
          }
          resolve()
        } catch (error) {
          console.error('Failed to list dir:', error)
          updateTabFiles(side, tabId, [])
          resolve()
        }
      }, 50) // 50ms debounce
    })
  }, [side, tabId, updateTabFiles])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return { refresh }
}
