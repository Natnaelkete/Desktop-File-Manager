import React, { useState, useEffect } from 'react'
import { 
  Package, 
  Search, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  ShieldAlert, 
  Layers,
  Monitor,
  LayoutGrid,
  Zap,
  Ghost,
  CheckCircle2,
  RefreshCw
} from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../stores/store'

interface AppInfo {
  name: string
  version: string
  publisher: string
  uninstallString?: string
  installLocation?: string
  icon?: string
  size: number
  installDate?: string
  isUWP?: boolean
  fullName?: string // For UWP
}

type ViewMode = 'desktop' | 'windows' | 'orphans'

const AppManager: React.FC = () => {
  const { 
    installedApps, setInstalledApps, 
    uwpApps, setUwpApps, 
    orphans, setOrphans 
  } = useStore()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [currentView, setCurrentView] = useState<ViewMode>('desktop')
  
  const [uninstalling, setUninstalling] = useState<string | null>(null)
  const [leftovers, setLeftovers] = useState<{ files: string[], registry: string[] } | null>(null)
  const [scanning, setScanning] = useState(false)
  const [cleaning, setCleaning] = useState(false)

  const fetchData = async (force = false) => {
    // Only fetch if empty or forced
    if (!force) {
      if (currentView === 'desktop' && installedApps.length > 0) return
      if (currentView === 'windows' && uwpApps.length > 0) return
      if (currentView === 'orphans' && orphans.length > 0) return
    }

    setLoading(true)
    setError(null)
    try {
      if (currentView === 'desktop') {
        const result = await (window as any).electronAPI.getInstalledApps()
        if (result.error) setError(result.error)
        else setInstalledApps(result)
      } else if (currentView === 'windows') {
        const result = await (window as any).electronAPI.getUWPApps()
        if (result.error) setError(result.error)
        else setUwpApps(result)
      } else if (currentView === 'orphans') {
        // We'll let the user trigger the scan manually
      }
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleOrphanScan = async () => {
    setLoading(true)
    try {
      const results = await (window as any).electronAPI.findOrphanLeftovers()
      setOrphans(results)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [currentView])

  const formatSize = (bytes: number) => {
    if (bytes === 0) return 'Unknown'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const handleUninstall = async (app: AppInfo) => {
    if (app.isUWP) {
      if (window.confirm(`Uninstall Windows App: ${app.name}?`)) {
        setUninstalling(app.name)
        const res = await (window as any).electronAPI.uninstallUWPApp(app.fullName)
        if (res.success) {
          fetchData(true)
        } else {
          alert(`UWP Uninstall Error: ${res.error}`)
        }
        setUninstalling(null)
      }
      return
    }

    if (!app.uninstallString) {
      if (window.confirm(`No uninstaller found for ${app.name}. Use Force Uninstall (Powerful Scan)?`)) {
        handleForceUninstall(app)
      }
      return
    }

    if (window.confirm(`Uninstall ${app.name}?`)) {
      setUninstalling(app.name)
      const res = await (window as any).electronAPI.runUninstaller(app.uninstallString)
      
      if (res.success) {
        setScanning(true)
        const scanRes = await (window as any).electronAPI.findAppLeftovers(app.name, app.installLocation)
        setLeftovers(scanRes)
        setScanning(false)
      } else {
        alert(`Uninstall Failed. Error: ${res.error}\n\nRunning Force Uninstall scan...`)
        handleForceUninstall(app)
      }
    }
  }

  const handleForceUninstall = async (app: AppInfo) => {
    setUninstalling(app.name)
    setScanning(true)
    const scanRes = await (window as any).electronAPI.forceUninstall(app.name, app.installLocation)
    setLeftovers(scanRes)
    setScanning(false)
  }

  const handleCleanup = async () => {
    if (!leftovers) return
    setCleaning(true)
    const allPaths = [...leftovers.files]
    if (allPaths.length > 0) {
      await (window as any).electronAPI.deleteFilesBulk(allPaths)
    }
    // TODO: Implement registry cleanup in main process if needed
    setLeftovers(null)
    setUninstalling(null)
    setCleaning(false)
    fetchData(true)
  }

  const filteredApps = (currentView === 'desktop' ? installedApps : uwpApps).filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.publisher.toLowerCase().includes(search.toLowerCase())
  )

  const NavItem = ({ id, label, icon: Icon }: { id: ViewMode, label: string, icon: any }) => (
    <button 
      onClick={() => setCurrentView(id)}
      className={clsx(
        "flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all text-sm whitespace-nowrap",
        currentView === id 
          ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30" 
          : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
      )}
    >
      <Icon size={18} />
      {label}
    </button>
  )

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      {/* Power Scan Modal */}
      <AnimatePresence>
        {leftovers && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 bg-emerald-500/5">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                  <ShieldAlert size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">Powerful Scan Result</h2>
                  <p className="text-slate-500 font-medium">Found remnants left behind by {uninstalling}</p>
                </div>
              </div>

              <div className="p-8 max-h-[400px] overflow-y-auto scrollbar-thin space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Layers size={14} /> Residual Files ({leftovers.files.length})
                  </h3>
                  <div className="space-y-2">
                    {leftovers.files.map((p, i) => (
                      <div key={i} className="text-[10px] font-mono p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 truncate">
                        {p}
                      </div>
                    ))}
                    {leftovers.files.length === 0 && <p className="text-sm italic text-slate-400">No leftover files found.</p>}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Zap size={14} /> Registry Entries ({leftovers.registry.length})
                  </h3>
                  <div className="space-y-2">
                    {leftovers.registry.map((r, i) => (
                      <div key={i} className="text-[10px] font-mono p-3 bg-rose-500/5 rounded-xl text-rose-500/80 border border-rose-500/10 truncate">
                        {r}
                      </div>
                    ))}
                    {leftovers.registry.length === 0 && <p className="text-sm italic text-slate-400">No leftover registry keys found.</p>}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button 
                  onClick={() => { setLeftovers(null); setUninstalling(null); fetchData(); }}
                  className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  Skip
                </button>
                <button 
                  onClick={handleCleanup}
                  disabled={cleaning}
                  className="px-8 py-3 rounded-2xl bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/30 hover:bg-primary-600 transition-all flex items-center gap-2"
                >
                  {cleaning ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                  Wipe traces now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-6 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-indigo-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
              <Package size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">Advanced Uninstaller</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Master Tool by Antigravity</p>
            </div>
          </div>

          <div className="flex-1 max-w-md relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search programs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary-500/30 transition-all shadow-inner"
            />
          </div>

          <button 
            onClick={() => fetchData(true)}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary-500/50 transition-all shadow-sm"
          >
            <RefreshCw size={20} className={clsx(loading && "animate-spin", "text-slate-500")} />
          </button>
        </div>

        <div className="flex items-center gap-3 mt-8">
          <NavItem id="desktop" label="Desktop Programs" icon={LayoutGrid} />
          <NavItem id="windows" label="Windows Apps" icon={Monitor} />
          <NavItem id="orphans" label="Orphan Traces" icon={Ghost} />
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
        {error ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-rose-500/5 rounded-[40px] border border-rose-500/10 mb-8">
            <AlertCircle size={64} className="text-rose-500 mb-6" />
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Something went wrong</h2>
            <p className="text-slate-500 max-w-sm mb-8">{error}</p>
            <button onClick={() => fetchData(true)} className="px-8 py-3 bg-primary-500 text-white rounded-2xl font-bold shadow-lg shadow-primary-500/20">Try Again</button>
          </div>
        ) : loading ? (
          <div className="h-full flex flex-col items-center justify-center">
            <Loader2 size={48} className="animate-spin text-primary-500 mb-4" />
            <p className="font-bold text-slate-500">Scanning System...</p>
          </div>
        ) : currentView === 'orphans' ? (
          <div className="h-full flex flex-col items-center justify-center p-8">
            {orphans.length === 0 ? (
              <div className="max-w-md text-center bg-white dark:bg-slate-900 p-12 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20">
                <Ghost size={80} className="text-slate-300 dark:text-slate-700 mx-auto mb-6" />
                <h2 className="text-2xl font-black mb-2 dark:text-white">Residual Cleanup</h2>
                <p className="text-slate-500 mb-8 font-medium">Scan for folders and files left behind by previously uninstalled programs.</p>
                <button 
                  onClick={() => handleOrphanScan()}
                  disabled={loading}
                  className="w-full px-10 py-4 bg-indigo-500 text-white rounded-3xl font-bold shadow-xl shadow-indigo-500/20 hover:scale-105 transition-transform flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                  Start Deep Orphan Scan
                </button>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black dark:text-white">Found {orphans.length} Orphan Traces</h2>
                  <button onClick={handleOrphanScan} className="flex items-center gap-2 text-primary-500 font-bold hover:underline">
                    <RefreshCw size={16} /> Re-scan
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {orphans.map((o, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={o.path}
                      className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 flex flex-col"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 mb-4">
                        <Ghost size={24} />
                      </div>
                      <h3 className="font-bold text-slate-800 dark:text-white truncate mb-1">{o.name}</h3>
                      <p className="text-[10px] text-slate-400 font-mono truncate mb-6">{o.path}</p>
                      <button 
                        onClick={() => {
                          setUninstalling(o.name)
                          setLeftovers({ files: [o.path], registry: [] })
                        }}
                        className="mt-auto w-full py-3 bg-slate-50 dark:bg-slate-800 text-rose-500 rounded-2xl font-bold text-xs hover:bg-rose-500 hover:text-white transition-all transition-all"
                      >
                        Deep Clean
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            <AnimatePresence>
              {filteredApps.map((app) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={app.fullName || app.name}
                  className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-primary-500/50 transition-all flex flex-col group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-inner group-hover:scale-110 transition-transform">
                      {app.icon ? (
                        <img src={`file:///${app.icon.replace(/"/g, '')}`} className="w-8 h-8 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      ) : (
                        <Package className="text-slate-400 group-hover:text-primary-500 transition-colors" size={28} />
                      )}
                    </div>
                    {app.size > 0 && (
                      <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
                        <span className="text-[10px] font-black text-slate-500">{formatSize(app.size)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 mb-6">
                    <h3 className="font-bold text-slate-800 dark:text-white leading-tight mb-1 line-clamp-1">{app.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold line-clamp-1">{app.publisher}</p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-6 px-1">
                    <span>V. {app.version}</span>
                    {app.isUWP && <span className="text-sky-500">Windows App</span>}
                  </div>

                  <button 
                    onClick={() => handleUninstall(app)}
                    disabled={uninstalling === app.name}
                    className={clsx(
                      "w-full py-3.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2",
                      uninstalling === app.name 
                        ? "bg-amber-500/10 text-amber-600" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-500/20"
                    )}
                  >
                    {uninstalling === app.name ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        {scanning ? "Sweeping Traces..." : "Uninstalling..."}
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Uninstall
                      </>
                    )}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loading && filteredApps.length === 0 && !error && currentView !== 'orphans' && (
          <div className="h-full flex flex-col items-center justify-center opacity-30 py-20 grayscale">
            <Package size={80} className="mb-4" />
            <p className="text-xl font-black">No apps found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AppManager
