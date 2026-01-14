import { useRef, useEffect } from 'react'
import { FileItem, useStore } from '../stores/store'

export const useFileBrowser = (side: 'left' | 'right', tabId: string) => {
  const { updateTabFiles } = useStore()
  
  const refresh = async (path: string) => {
    try {
      const files = await (window as any).electronAPI.listDir(path)
      updateTabFiles(side, tabId, files)
    } catch (error) {
      console.error('Failed to list dir:', error)
      updateTabFiles(side, tabId, [])
    }
  }

  return { refresh }
}
