import React, { memo } from 'react'
import { 
  ArrowLeft, 
  Loader2, 
  Copy,
  FolderOpen
} from 'lucide-react'
import { FixedSizeList as List, areEqual } from 'react-window'
// @ts-ignore
import { AutoSizer } from 'react-virtualized-auto-sizer'

interface DuplicatesViewProps {
  groups: string[][]
  totalGroups: number
  loadingMore: boolean
  onBack: () => void
  onReveal: (path: string) => void
  onFetchMore: () => void
}

const GroupRow = memo(({ index, style, data }: { index: number, style: React.CSSProperties, data: any }) => {
  const { items, onReveal } = data
  const group = items[index]
  if (!group) return null

  return (
    <div style={style} className="px-6 pb-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm h-full flex flex-col group/card shadow-indigo-500/5">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 font-bold text-[10px] shrink-0 border border-rose-500/20">
              {index + 1}
            </div>
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate pr-2">
              {group[0].split('\\').pop() || group[0].split('/').pop()}
            </h3>
          </div>
          <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
             {group.length} copies
          </span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin border-l-2 border-slate-50 dark:border-slate-800/50 ml-3.5 pl-3.5 space-y-1">
          {group.map((p: string, pIdx: number) => (
            <div key={pIdx} className="flex items-center justify-between group py-1 border-b border-slate-50 dark:border-slate-800/20 last:border-0 font-mono">
              <span className="text-[10px] text-slate-500 truncate pr-4" title={p}>{p}</span>
              <button 
                onClick={() => onReveal(p)}
                className="p-1 rounded-md text-slate-300 hover:text-primary-500 hover:bg-primary-500/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
              >
                <FolderOpen size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}, areEqual)

const DuplicatesView: React.FC<DuplicatesViewProps> = ({ 
  groups, 
  totalGroups, 
  loadingMore, 
  onBack, 
  onReveal, 
  onFetchMore 
}) => {
  return (
    <div className="absolute inset-0 flex flex-col bg-slate-50 dark:bg-slate-950 z-50">
      <div className="h-14 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm z-10 shrink-0">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 mr-4 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col min-w-0">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <MirrorIcon size={16} />
            Duplicate Groups
          </h2>
          <span className="text-[10px] text-slate-400 font-mono tracking-tight truncate">
            {totalGroups} sets | {groups.length} loaded
          </span>
        </div>
        {loadingMore && (
          <div className="ml-auto flex items-center gap-2 text-[10px] font-bold text-slate-400 animate-pulse">
            <Loader2 size={12} className="animate-spin" /> Fetching
          </div>
        )}
      </div>
      
      <div className="flex-1 w-full min-h-0 bg-slate-50 dark:bg-slate-950 pt-6 relative overflow-hidden">
        {/* @ts-ignore */}
        <AutoSizer>
          {({ height, width }: { height: number, width: number }) => (
            <List
              height={height || 500}
              width={width || 800}
              itemCount={groups.length}
              itemSize={220}
              itemData={{
                items: groups,
                onReveal: onReveal
              }}
              onItemsRendered={({ visibleStopIndex }: { visibleStopIndex: number }) => {
                if (visibleStopIndex >= groups.length - 5 && !loadingMore && groups.length < totalGroups) {
                  onFetchMore()
                }
              }}
            >
              {GroupRow}
            </List>
          )}
        </AutoSizer>

        {groups.length === 0 && !loadingMore && (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
             <Copy size={48} className="text-slate-200 dark:text-slate-800 mb-4" />
             <p className="text-slate-500 text-sm font-bold">No duplicates found</p>
             <p className="text-slate-400 text-xs mt-1">This scope seems clean of identical files.</p>
           </div>
        )}
      </div>
    </div>
  )
}

const MirrorIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
)

export default DuplicatesView
