import React, { useEffect, useState } from 'react'
import { Folder, File, ChevronRight, MoreVertical, LayoutGrid, List as ListIcon } from 'lucide-react'
import { useStore, FileItem } from '../stores/store'
import { useFileBrowser } from '../hooks/useFileBrowser'
import { clsx } from 'clsx'
import TabBar from './TabBar'
import ContextMenu from './ContextMenu'
import BatchRenameDialog from './BatchRenameDialog'
import { FixedSizeList as List } from 'react-window'
import { AutoSizer } from 'react-virtualized-auto-sizer'

interface FilePanelProps {
  side: 'left' | 'right'
}

const FilePanel: React.FC<FilePanelProps> = ({ side }) => {
  const activeTabId = useStore((state: any) => side === 'left' ? state.activeLeftTabId : state.activeRightTabId)
  const tab = useStore((state: any) => (side === 'left' ? state.leftTabs : state.rightTabs).find((t: any) => t.id === activeTabId))
  const { navigateTo, viewMode, setViewMode, selection, setSelection } = useStore()
  const { refresh } = useFileBrowser(side, activeTabId)
  
  const [menuPos, setMenuPos] = useState<{ x: number, y: number } | null>(null)
  const [showBatchRename, setShowBatchRename] = useState(false)

  useEffect(() => {
    if (tab?.path) {
      refresh(tab.path)
    }
  }, [tab?.path])

  if (!tab) return null

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setMenuPos({ x: e.clientX, y: e.clientY })
  }

  const handleAction = async (action: string) => {
    if (action === 'delete' && selection.length > 0) {
      await (window as any).electronAPI.deleteItems(selection)
      refresh(tab.path)
    } else if (action === 'hash-md5' && selection.length === 1) {
      const hash = await (window as any).electronAPI.getFileHash(selection[0], 'md5')
      alert(`MD5 Hash: ${hash}`)
    } else if (action === 'rename') {
      if (selection.length > 1) {
        setShowBatchRename(true)
      } else if (selection.length === 1) {
        const newName = prompt('Enter new name:', selection[0].split('\\').pop())
        if (newName) {
          const dir = selection[0].substring(0, selection[0].lastIndexOf('\\'))
          await (window as any).electronAPI.renameItem(selection[0], `${dir}\\${newName}`)
          refresh(tab.path)
        }
      }
    }
    setMenuPos(null)
  }

  const handleFileClick = (file: FileItem, e: React.MouseEvent) => {
    if (e.ctrlKey) {
      setSelection(selection.includes(file.path) 
        ? selection.filter((p: string) => p !== file.path) 
        : [...selection, file.path]
      )
    } else {
      setSelection([file.path])
    }
  }

  const handleDoubleClick = async (file: FileItem) => {
    if (file.isDirectory) {
      navigateTo(side, activeTabId, file.path)
    } else {
      const ext = file.name.split('.').pop()?.toLowerCase()
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
      const textExts = ['txt', 'md', 'json', 'js', 'ts', 'tsx', 'css', 'html', 'py', 'java', 'c', 'cpp', 'sh']
      
      if (imageExts.includes(ext || '')) {
        window.dispatchEvent(new CustomEvent('open-image', { detail: file }))
      } else if (textExts.includes(ext || '')) {
        window.dispatchEvent(new CustomEvent('open-text', { detail: file }))
      } else if (ext === 'zip') {
        if (confirm(`Unzip ${file.name} to current directory?`)) {
          await (window as any).electronAPI.unzip(file.path, tab.path)
          refresh(tab.path)
        }
      } else {
        (window as any).electronAPI.openPath(file.path)
      }
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const file = tab.files[index]
    if (!file) return null
    return (
      <div 
        style={style}
        onClick={(e) => handleFileClick(file, e)}
        onDoubleClick={() => handleDoubleClick(file)}
        className={clsx(
          "flex items-center hover:bg-primary-50 dark:hover:bg-primary-900/10 cursor-default group border-b border-slate-50 dark:border-slate-800/50 px-4",
          selection.includes(file.path) && "bg-primary-100/50 dark:bg-primary-900/20"
        )}
      >
        <div className="flex-[3] flex items-center gap-3 min-w-0">
          {file.isDirectory ? (
            <Folder size={18} className="text-amber-500 fill-amber-500/20 flex-shrink-0" />
          ) : (
            <File size={18} className="text-slate-400 flex-shrink-0" />
          )}
          <span className="truncate text-sm">{file.name}</span>
        </div>
        <div className="flex-1 text-xs text-slate-500 overflow-hidden whitespace-nowrap">
          {file.isDirectory ? '--' : formatSize(file.size)}
        </div>
        <div className="flex-1 text-xs text-slate-500 overflow-hidden whitespace-nowrap">
          {new Date(file.modifiedAt).toLocaleDateString()}
        </div>
        <div className="w-8 text-right flex-shrink-0">
          <MoreVertical size={16} className="text-slate-300 group-hover:text-slate-500 cursor-pointer opacity-0 group-hover:opacity-100" />
        </div>
      </div>
    )
  }

  return (
    <div 
      className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 overflow-hidden border-r border-slate-200 dark:border-slate-800 last:border-r-0"
      onContextMenu={handleContextMenu}
    >
      <TabBar side={side} />
      
      {/* Breadcrumbs */}
      <div className="h-10 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-2 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-1 text-xs text-slate-500 overflow-hidden whitespace-nowrap">
          {tab.path.split('\\').filter(Boolean).map((part: string, i: number, arr: string[]) => (
            <React.Fragment key={i}>
              <span 
                onClick={() => {
                  const parts = tab.path.split('\\').filter(Boolean)
                  const newPath = parts.slice(0, i + 1).join('\\') + (parts.length > 0 ? '\\' : '')
                  navigateTo(side, activeTabId, newPath)
                }}
                className="hover:text-primary-500 cursor-pointer"
              >
                {part}
              </span>
              {i < arr.length - 1 && <ChevronRight size={14} />}
            </React.Fragment>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 no-drag">
          <LayoutGrid 
            size={16} 
            className={clsx("cursor-pointer hover:text-primary-500", viewMode === 'grid' ? "text-primary-500" : "text-slate-400")} 
            onClick={() => setViewMode('grid')}
          />
          <ListIcon 
            size={16} 
            className={clsx("cursor-pointer hover:text-primary-500", viewMode === 'list' ? "text-primary-500" : "text-slate-400")} 
            onClick={() => setViewMode('list')}
          />
        </div>
      </div>

      {/* File Content */}
      <div className="flex-1 overflow-hidden no-drag bg-slate-50/50 dark:bg-slate-900/50">
        {viewMode === 'list' ? (
          <div className="h-full flex flex-col">
            <div className="flex bg-slate-100 dark:bg-slate-800 font-bold text-[10px] text-slate-500 uppercase py-3 px-4 shadow-sm">
              <div className="flex-[3]">Name</div>
              <div className="flex-1">Size</div>
              <div className="flex-1">Modified</div>
              <div className="w-8"></div>
            </div>
            <div className="flex-1">
              {(() => {
                const AutoSizerAny = AutoSizer as any
                return (
                  <AutoSizerAny>
                    {({ height, width }: any) => (
                      <List
                        height={height as number}
                        itemCount={tab.files.length}
                        itemSize={44}
                        width={width as number}
                        className="scrollbar-thin"
                      >
                        {Row}
                      </List>
                    )}
                  </AutoSizerAny>
                )
              })()}
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4 scrollbar-thin">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
              {tab.files.map((file: FileItem) => (
                <div
                  key={file.path}
                  onClick={(e) => handleFileClick(file, e)}
                  onDoubleClick={() => handleDoubleClick(file)}
                  className={clsx(
                    "flex flex-col items-center p-3 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/10 cursor-default group transition-all text-center",
                    selection.includes(file.path) && "bg-primary-100 dark:bg-primary-900/30 ring-1 ring-primary-500"
                  )}
                >
                  {file.isDirectory ? (
                    <Folder size={48} className="text-amber-500 fill-amber-500/10 mb-2" />
                  ) : (
                    <File size={48} className="text-slate-400 mb-2" />
                  )}
                  <span className="text-xs font-medium truncate w-full px-1">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab.files.length === 0 && !tab.loading && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Folder size={48} strokeWidth={1} className="mb-2 opacity-20" />
            <p className="text-sm">This folder is empty</p>
          </div>
        )}
      </div>

      {menuPos && (
        <ContextMenu 
          x={menuPos.x} 
          y={menuPos.y} 
          onClose={() => setMenuPos(null)} 
          onAction={handleAction} 
        />
      )}

      {showBatchRename && (
        <BatchRenameDialog 
          files={selection} 
          onClose={() => setShowBatchRename(false)} 
          onRenamed={() => refresh(tab.path)} 
        />
      )}
    </div>
  )
}

export default FilePanel
