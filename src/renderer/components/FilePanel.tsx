import React, { useEffect, useState, memo, useMemo, useCallback } from 'react'
import { Folder, File, ChevronRight, MoreVertical, LayoutGrid, List as ListIcon, Eye, EyeOff, Loader2, ChevronDown, ArrowUpDown, Film, SortAsc, SortDesc } from 'lucide-react'
import VideoThumbnail from './VideoThumbnail'
import ContextMenu from './ContextMenu'
import { FileItem, useStore } from '../stores/store'
import PropertiesModal from './PropertiesModal'
import { useFileBrowser } from '../hooks/useFileBrowser'
import { clsx } from 'clsx'
import TabBar from './TabBar'
import BatchRenameDialog from './BatchRenameDialog'
import { FixedSizeList as List, areEqual } from 'react-window'
import { AutoSizer } from 'react-virtualized-auto-sizer'

interface FilePanelProps {
  side: 'left' | 'right'
}


const FileRow = memo(({ index, style, data }: { index: number, style: React.CSSProperties, data: any }) => {
  const { files, selection, handleFileClick, handleDoubleClick, formatSize, isLibraryView } = data
  const file = files[index]
  if (!file) return null

  return (
    <div 
      style={style}
      onClick={(e) => handleFileClick(e, file)}
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
        {isLibraryView && file.parentPath && (
          <span className="text-[10px] text-slate-400 truncate ml-2 opacity-60">({file.parentPath})</span>
        )}
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
}, areEqual)

const FilePanel: React.FC<FilePanelProps> = ({ side }) => {
  const activeTabId = useStore((state: any) => side === 'left' ? state.activeLeftTabId : state.activeRightTabId)
  const tab = useStore((state: any) => (side === 'left' ? state.leftTabs : state.rightTabs).find((t: any) => t.id === activeTabId))
  const viewMode = useStore((state: any) => side === 'left' ? state.leftViewMode : state.rightViewMode)
  const showHidden = useStore((state: any) => state.showHidden)
  const selection = useStore((state: any) => side === 'left' ? state.leftSelection : state.rightSelection)
  const { navigateTo, setLeftViewMode, setRightViewMode, setSelection, toggleHidden, setActiveSide, setGridSize, setSortBy, setSortOrder } = useStore()
  const gridSize = useStore((state: any) => side === 'left' ? state.leftGridSize : state.rightGridSize)
  const sortBy = useStore((state: any) => side === 'left' ? state.leftSortBy : state.rightSortBy)
  const sortOrder = useStore((state: any) => side === 'left' ? state.leftSortOrder : state.rightSortOrder)
  const { refresh } = useFileBrowser(side, activeTabId)
  
  const [menuPos, setMenuPos] = useState<{ x: number, y: number } | null>(null)
  const [showBatchRename, setShowBatchRename] = useState(false)
  const [propertiesFile, setPropertiesFile] = useState<FileItem | null>(null)

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
    } else if (action === 'properties' && selection.length === 1) {
      const file = filteredFiles.find((f: FileItem) => f.path === selection[0])
      if (file) setPropertiesFile(file)
    } else if (action === 'copy' && selection.length > 0) {
      alert('Copy not implemented yet')
    } else if (action === 'cut' && selection.length > 0) {
      alert('Cut not implemented yet')
    } else if (action === 'paste') {
      alert('Paste not implemented yet')
    }
    setMenuPos(null)
  }

  const handleFileClick = (e: React.MouseEvent, file: FileItem) => {
    e.stopPropagation()
    setActiveSide(side) // Ensure side is active
    
    if (e.ctrlKey) {
      if (selection.includes(file.path)) {
        setSelection(side, selection.filter((p: string) => p !== file.path))
      } else {
        setSelection(side, [...selection, file.path])
      }
    } else if (e.shiftKey && selection.length > 0) {
      const lastSelected = selection[selection.length - 1]
      const lastIdx = filteredFiles.findIndex((f: FileItem) => f.path === lastSelected)
      const currIdx = filteredFiles.findIndex((f: FileItem) => f.path === file.path)
      
      if (lastIdx !== -1 && currIdx !== -1) {
        const start = Math.min(lastIdx, currIdx)
        const end = Math.max(lastIdx, currIdx)
        const range = filteredFiles.slice(start, end + 1).map((f: FileItem) => f.path)
        setSelection(side, [...new Set([...selection, ...range])])
      }
    } else {
      setSelection(side, [file.path])
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

  const formatSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  const filteredFiles = useMemo(() => {
    let list = tab.files.filter((f: FileItem) => showHidden || !f.name.startsWith('.'))
    
    list.sort((a: FileItem, b: FileItem) => {
      // Always put directories first
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      
      let comparison = 0
      switch (sortBy) {
        case 'size':
          comparison = a.size - b.size
          break
        case 'date':
          comparison = a.modifiedAt - b.modifiedAt
          break
        case 'type':
          const extA = a.name.split('.').pop()?.toLowerCase() || ''
          const extB = b.name.split('.').pop()?.toLowerCase() || ''
          comparison = extA.localeCompare(extB)
          break
        default:
          comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return list
  }, [tab.files, showHidden, sortBy, sortOrder])

  return (
    <div 
      onClick={() => {
        setActiveSide(side)
        setSelection(side, [])
      }}
      className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 overflow-hidden border-r border-slate-200 dark:border-slate-800 last:border-r-0"
      onContextMenu={handleContextMenu}
    >
      <TabBar side={side} />
      
      {/* Breadcrumbs */}
      <div className="h-10 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-2 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
        <div className="flex-1 flex items-center gap-1 text-xs text-slate-500 overflow-hidden whitespace-nowrap">
          {tab.path.split('\\').filter(Boolean).map((part: string, i: number, arr: string[]) => (
            <React.Fragment key={i}>
              <span 
                onClick={() => {
                  const parts = tab.path.split('\\').filter(Boolean)
                  // Reconstruct path correctly
                  let newPath = ''
                  if (i === 0 && parts[0].endsWith(':')) {
                    newPath = parts[0] + '\\'
                  } else {
                    // Start with drive if it exists
                    if (parts[0].endsWith(':')) {
                      newPath = parts[0] + '\\' + parts.slice(1, i + 1).join('\\')
                    } else {
                      newPath = parts.slice(0, i + 1).join('\\')
                    }
                    if (i < arr.length - 1) {
                      newPath += '\\'
                    }
                  }
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
        <div className="flex-shrink-0 flex items-center gap-1 no-drag ml-2">
          {/* Sort Dropdown */}
          <div className="relative group/menu">
            <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-xs text-slate-500 transition-colors">
              <ArrowUpDown size={14} />
              <span>Sort</span>
              <ChevronDown size={12} />
            </button>
            <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 z-50 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all">
              {['name', 'size', 'date', 'type'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(side, s as any)}
                  className={clsx(
                    "w-full text-left px-3 py-1.5 text-[11px] capitalize hover:bg-primary-50 dark:hover:bg-primary-900/20",
                    sortBy === s ? "text-primary-500 font-bold" : "text-slate-600 dark:text-slate-300"
                  )}
                >
                  {s}
                </button>
              ))}
              <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
              {['asc', 'desc'].map((o) => (
                <button
                  key={o}
                  onClick={() => setSortOrder(side, o as any)}
                  className={clsx(
                    "w-full text-left px-3 py-1.5 text-[11px] capitalize hover:bg-primary-50 dark:hover:bg-primary-900/20",
                    sortOrder === o ? "text-primary-500 font-bold" : "text-slate-600 dark:text-slate-300"
                  )}
                >
                  {o === 'asc' ? 'Ascending' : 'Descending'}
                </button>
              ))}
            </div>
          </div>

          {/* View Dropdown */}
          <div className="relative group/view">
            <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-xs text-slate-500 transition-colors">
              <LayoutGrid size={14} />
              <span>View</span>
              <ChevronDown size={12} />
            </button>
            <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 z-50 opacity-0 invisible group-hover/view:opacity-100 group-hover/view:visible transition-all">
              <button
                onClick={() => side === 'left' ? setLeftViewMode('list') : setRightViewMode('list')}
                className={clsx(
                  "w-full text-left px-3 py-1.5 text-[11px] hover:bg-primary-50 dark:hover:bg-primary-900/20 flex items-center gap-2",
                  viewMode === 'list' ? "text-primary-500 font-bold" : "text-slate-600 dark:text-slate-300"
                )}
              >
                <ListIcon size={12} /> Details
              </button>
              <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
              {['small', 'medium', 'large', 'xl'].map((sz) => (
                <button
                  key={sz}
                  onClick={() => {
                    if (viewMode !== 'grid') side === 'left' ? setLeftViewMode('grid') : setRightViewMode('grid')
                    setGridSize(side, sz as any)
                  }}
                  className={clsx(
                    "w-full text-left px-3 py-1.5 text-[11px] capitalize hover:bg-primary-50 dark:hover:bg-primary-900/20 flex items-center gap-2",
                    viewMode === 'grid' && gridSize === sz ? "text-primary-500 font-bold" : "text-slate-600 dark:text-slate-300"
                  )}
                >
                  <LayoutGrid size={12} /> {sz} Icons
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
          
          <div 
            onClick={toggleHidden}
            className={clsx("p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer", showHidden ? "text-primary-500" : "text-slate-400")}
            title={showHidden ? "Hide hidden files" : "Show hidden files"}
          >
            {showHidden ? <Eye size={16} /> : <EyeOff size={16} />}
          </div>
        </div>
      </div>

      {/* File Content */}
      <div className="flex-1 flex flex-col min-h-0 no-drag bg-slate-50/50 dark:bg-slate-900/50 relative overflow-hidden">
        {viewMode === 'list' ? (
          <div className="flex-1 flex flex-col min-h-0 w-full h-full relative">
            <div className="flex bg-slate-100 dark:bg-slate-800 font-bold text-[10px] text-slate-500 uppercase py-3 px-4 shadow-sm z-10 flex-shrink-0">
              <div className="flex-[3]">Name</div>
              <div className="flex-1">Size</div>
              <div className="flex-1">Modified</div>
              <div className="w-8"></div>
            </div>
            <div className="flex-1 min-h-0 relative w-full">
              {(() => {
                const AutoSizerAny = AutoSizer as any
                return (
                  <AutoSizerAny>
                    {({ height, width }: { height: number, width: number }) => (
                      <List
                        height={height || 600}
                        itemCount={filteredFiles.length}
                        itemSize={44}
                        width={width || 800}
                        overscanCount={5}
                        className="scrollbar-thin"
                        itemData={{
                          files: filteredFiles,
                          selection,
                          handleFileClick,
                          handleDoubleClick,
                          formatSize,
                          isLibraryView: tab.path.startsWith('library://')
                        }}
                      >
                        {FileRow}
                      </List>
                    )}
                  </AutoSizerAny>
                )
              })()}
            </div>
          </div>
        ) : (
          <div className={clsx(
            "flex-1 overflow-y-auto p-4 content-start gap-4 grid h-full scrollbar-thin",
            gridSize === 'small' && "grid-cols-[repeat(auto-fill,minmax(80px,1fr))]",
            gridSize === 'medium' && "grid-cols-[repeat(auto-fill,minmax(120px,1fr))]",
            gridSize === 'large' && "grid-cols-[repeat(auto-fill,minmax(180px,1fr))]",
            gridSize === 'xl' && "grid-cols-[repeat(auto-fill,minmax(280px,1fr))]"
          )}>
            {filteredFiles.map((file: FileItem) => {
              const ext = file.name.split('.').pop()?.toLowerCase() || ''
              const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
              const isVideo = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg', '3gp', 'ogv'].includes(ext)
              
              return (
                <div 
                  key={file.path}
                  onClick={(e) => handleFileClick(e, file)}
                  onDoubleClick={() => handleDoubleClick(file)}
                  className={clsx(
                    "flex flex-col items-center p-2 rounded-xl border border-transparent transition-all cursor-default group",
                    selection.includes(file.path) 
                      ? "bg-primary-500/10 border-primary-500/20 shadow-sm ring-1 ring-primary-500" 
                      : "hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  )}
                >
                  <div className="relative mb-2">
                    {file.isDirectory ? (
                      <Folder className={clsx(
                        "text-amber-500 fill-amber-500/10",
                        gridSize === 'small' && "w-8 h-8",
                        gridSize === 'medium' && "w-12 h-12",
                        gridSize === 'large' && "w-24 h-24",
                        gridSize === 'xl' && "w-48 h-48"
                      )} />
                    ) : isImage ? (
                      <div className={clsx(
                        "rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm group-hover:scale-105 transition-transform",
                        gridSize === 'small' && "w-8 h-8",
                        gridSize === 'medium' && "w-12 h-12",
                        gridSize === 'large' && "w-24 h-24",
                        gridSize === 'xl' && "w-48 h-48"
                      )}>
                        <img 
                          src={`local-resource://media/?path=${encodeURIComponent(file.path)}`} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                          alt={file.name}
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                    ) : isVideo ? (
                      <VideoThumbnail path={file.path} gridSize={gridSize as any} />
                    ) : (
                      <File className={clsx(
                        "text-slate-400",
                        gridSize === 'small' && "w-8 h-8",
                        gridSize === 'medium' && "w-12 h-12",
                        gridSize === 'large' && "w-24 h-24",
                        gridSize === 'xl' && "w-48 h-48"
                      )} />
                    )}
                    
                    {selection.includes(file.path) && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full border-2 border-white dark:border-slate-900 z-10" />
                    )}
                  </div>
                  <span className={clsx(
                    "text-center break-all line-clamp-2 w-full",
                    gridSize === 'small' ? "text-[10px]" : "text-xs px-1"
                  )} title={file.name}>
                    {file.name}
                  </span>
                  {gridSize !== 'small' && tab.path.startsWith('library://') && file.parentPath && (
                   <span className="text-[9px] text-slate-400 opacity-60 truncate w-full text-center">
                     {file.parentPath.split(/[\\/]/).pop()}
                   </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {tab.loading && (
          <div className="absolute inset-0 z-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-primary-500" size={32} />
              <p className="text-xs font-bold text-slate-500 animate-pulse">Scanning Your PC...</p>
            </div>
          </div>
        )}
        {tab.files.length === 0 && !tab.loading && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Folder size={48} strokeWidth={1} className="mb-2 opacity-20" />
            <p className="text-sm">Nothing found here</p>
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

      {propertiesFile && (
        <PropertiesModal 
          file={propertiesFile} 
          onClose={() => setPropertiesFile(null)} 
        />
      )}
    </div>
  )
}

export default FilePanel
