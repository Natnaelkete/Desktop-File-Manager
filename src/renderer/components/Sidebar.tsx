import React, { useEffect, useState } from 'react'
import { 
  HardDrive, 
  Folder, 
  FileText, 
  Download, 
  Monitor, 
  PieChart, 
  Clock, 
  Star, 
  Settings,
  Image as ImageIcon,
  Film,
  Music,
  FileCode,
  Smartphone,
  Globe,
  Package,
  Eye,
  EyeOff
} from 'lucide-react'
import { useStore } from '../stores/store'
import { clsx } from 'clsx'

interface Drive {
  name: string
  path: string
  used: number
  free: number
  total: number
}

interface SidebarProps {
  onOpenAnalyzer: (path: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenAnalyzer }) => {
  const [drives, setDrives] = useState<Drive[]>([])
  const [userPaths, setUserPaths] = useState<any>(null)
  const { navigateTo, activeLeftTabId, activeRightTabId, activeSide, activeView, setActiveView, showHidden, toggleHidden } = useStore()

  useEffect(() => {
    const init = async () => {
      const [d, paths] = await Promise.all([
        (window as any).electronAPI.getDrives(),
        (window as any).electronAPI.getUserPaths()
      ])
      setDrives(d)
      setUserPaths(paths)
    }
    init()
  }, [])

  const quickAccess = userPaths ? [
    { label: 'Documents', path: userPaths.documents, icon: FileText },
    { label: 'Downloads', path: userPaths.downloads, icon: Download },
    { label: 'Desktop', path: userPaths.desktop, icon: Monitor },
  ] : []

  const tools = [
    { label: 'Analyzer', action: 'analyzer', icon: PieChart },
    { label: 'Apps', view: 'apps', icon: Package },
    { label: 'Network', view: 'network', icon: Globe },
  ]

  const library = [
    { label: 'Images', path: 'library://images', icon: ImageIcon },
    { label: 'Videos', path: 'library://videos', icon: Film },
    { label: 'Music', path: 'library://music', icon: Music },
  ]

  const handleItemClick = (item: any) => {
    if (item.action === 'analyzer') {
      onOpenAnalyzer('C:\\')
      setActiveView('analyzer')
    } else if (item.view) {
      setActiveView(item.view)
    } else if (item.path) {
      setActiveView('explorer')
      const activeTabId = activeSide === 'left' ? activeLeftTabId : activeRightTabId
      navigateTo(activeSide, activeTabId, item.path)
    }
  }

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-950 no-drag">
      <div className="p-4">
        {/* Drives */}
        <section className="mb-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2">Drives</h2>
          <div className="space-y-1">
            {drives.map((drive) => (
              <div 
                key={drive.name}
                className={clsx(
                  "flex items-center gap-3 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors group relative",
                  activeView === 'explorer' && activeLeftTabId === 'l1' && drives[0]?.path === drive.path && "bg-slate-200 dark:bg-slate-800"
                )}
                onClick={() => {
                  setActiveView('explorer')
                  const activeTabId = activeSide === 'left' ? activeLeftTabId : activeRightTabId
                  navigateTo(activeSide, activeTabId, drive.path)
                }}
              >
                <HardDrive size={18} className="text-primary-500" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{drive.name}</div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full mt-1 overflow-hidden">
                    <div 
                      className="bg-primary-500 h-full" 
                      style={{ width: `${(drive.used / drive.total) * 100}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenAnalyzer(drive.path)
                  }}
                  title="Analyze partition"
                  className="p-1.5 rounded-md hover:bg-primary-500 hover:text-white text-slate-400 opacity-0 group-hover:opacity-100 transition-all ml-1"
                >
                  <PieChart size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Tools */}
        <section className="mb-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2">Tools</h2>
          <div className="space-y-1">
            {tools.map((item) => (
              <div 
                key={item.label}
                onClick={() => handleItemClick(item)}
                className={clsx(
                  "flex items-center gap-3 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors",
                  activeView === item.view || (item.view === 'analyzer' && activeView === 'analyzer') ? "bg-primary-500/10 text-primary-500 font-bold" : "text-slate-500"
                )}
              >
                <item.icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Access */}
        <section className="mb-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2">Quick Access</h2>
          <div className="space-y-1">
            {quickAccess.map((item) => (
              <div 
                key={item.label}
                onClick={() => handleItemClick(item)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors text-slate-500"
              >
                <item.icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Library */}
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2">Library</h2>
          <div className="space-y-1">
            {library.map((item) => (
              <div 
                key={item.label}
                onClick={() => handleItemClick(item)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors text-slate-500"
              >
                <item.icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sidebar Footer / Settings */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto">
        <div 
          onClick={toggleHidden}
          className={clsx(
            "flex items-center gap-3 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors text-slate-500",
            showHidden && "text-primary-500 bg-primary-500/5"
          )}
        >
          {showHidden ? <Eye size={18} /> : <EyeOff size={18} />}
          <span className="text-sm font-medium">{showHidden ? 'Hide Hidden' : 'Show Hidden'}</span>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
