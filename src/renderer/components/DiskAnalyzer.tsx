import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Loader2, 
  PieChart as PieChartIcon,
} from 'lucide-react'
import { clsx } from 'clsx'
import DashboardView from './DiskAnalyzer/DashboardView'
import DuplicatesView from './DiskAnalyzer/DuplicatesView'

interface DiskAnalyzerProps {
  path: string
  onClose: () => void
}

const DiskAnalyzer: React.FC<DiskAnalyzerProps> = ({ path, onClose }) => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'dashboard' | 'duplicates'>('dashboard')
  const [cleaning, setCleaning] = useState(false)
  
  // Pagination & Virtualization state
  const [paginatedDuplicates, setPaginatedDuplicates] = useState<string[][]>([])
  const [page, setPage] = useState(0)
  const [totalGroups, setTotalGroups] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const stats = await (window as any).electronAPI.getAdvancedStats(path)
      if (!stats.error) {
        setData(stats)
      }
    } catch (e) {
      console.error('Stats fetch error:', e)
    }
    setLoading(false)
  }

  const fetchDuplicates = async (reset = false) => {
    const currentPage = reset ? 0 : page
    setLoadingMore(true)
    try {
      const result = await (window as any).electronAPI.getDuplicatesPaginated(currentPage, 30)
      if (result && result.groups) {
        if (reset) {
          setPaginatedDuplicates(result.groups)
          setPage(1)
        } else {
          setPaginatedDuplicates(prev => [...prev, ...result.groups])
          setPage(currentPage + 1)
        }
        setTotalGroups(result.total)
      }
    } catch (e) {
      console.error('Failed to fetch duplicates:', e)
    }
    setLoadingMore(false)
  }

  useEffect(() => {
    fetchStats()
  }, [path])

  useEffect(() => {
    if (view === 'duplicates' && paginatedDuplicates.length === 0) {
      fetchDuplicates(true)
    }
  }, [view])

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleReveal = (filePath: string) => {
    (window as any).electronAPI.revealInExplorer(filePath)
  }

  const handleCleanJunk = async () => {
    if (!data?.redundantFiles?.length) return
    const confirmed = window.confirm(`Are you sure you want to delete ${data.redundantCount} junk files? This action is permanent.`)
    if (confirmed) {
      setCleaning(true)
      await (window as any).electronAPI.deleteFilesBulk(data.redundantFiles)
      await fetchStats()
      setCleaning(false)
    }
  }

  if (loading && !cleaning) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-primary-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Analyzing Storage...</h2>
        <p className="text-slate-500 text-sm">{path}</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      {cleaning && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-primary-500 mb-4" size={48} />
          <p className="text-sm font-bold animate-pulse text-slate-600 dark:text-slate-300">Cleaning Junk Files...</p>
        </div>
      )}

      {/* Main View Logic */}
      {view === 'duplicates' ? (
        <DuplicatesView 
          groups={paginatedDuplicates}
          totalGroups={totalGroups}
          loadingMore={loadingMore}
          onBack={() => setView('dashboard')}
          onReveal={handleReveal}
          onFetchMore={() => fetchDuplicates()}
        />
      ) : (
        <>
          {/* Dashboard Header */}
          <div className="h-14 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm z-10 shrink-0">
            <button 
              onClick={onClose}
              className="p-2 -ml-2 mr-4 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <PieChartIcon size={16} className="text-primary-500" />
                Storage Analysis
              </h2>
              <span className="text-[10px] text-slate-400 font-mono tracking-tight truncate max-w-[300px]">{path}</span>
            </div>
            <button 
              onClick={fetchStats}
              className="ml-auto p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh Analysis"
            >
              <Loader2 size={18} className={clsx(loading && "animate-spin")} />
            </button>
          </div>

          <DashboardView 
            data={data}
            onViewDuplicates={() => setView('duplicates')}
            onCleanJunk={handleCleanJunk}
            onReveal={handleReveal}
            formatSize={formatSize}
          />
        </>
      )}
    </div>
  )
}

export default DiskAnalyzer
