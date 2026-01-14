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
  FileCode
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
  const { navigateTo, activeLeftTabId } = useStore()

  useEffect(() => {
    const fetchDrives = async () => {
      const d = await (window as any).electronAPI.getDrives()
      setDrives(d)
    }
    fetchDrives()
  }, [])

  const quickAccess = [
    { label: 'Documents', path: 'C:\\Users\\use\\Documents', icon: FileText },
    { label: 'Downloads', path: 'C:\\Users\\use\\Downloads', icon: Download },
    { label: 'Desktop', path: 'C:\\Users\\use\\Desktop', icon: Monitor },
    { label: 'Analyzer', action: 'analyzer', icon: PieChart },
  ]

  const library = [
    { label: 'Images', path: 'images', icon: ImageIcon },
    { label: 'Videos', path: 'videos', icon: Film },
    { label: 'Music', path: 'music', icon: Music },
    { label: 'Documents', path: 'docs', icon: FileText },
  ]

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
                onClick={() => navigateTo('left', activeLeftTabId, drive.path)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors group"
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
                onClick={() => {
                  if (item.action === 'analyzer') {
                    onOpenAnalyzer('C:\\')
                  } else if (item.path) {
                    navigateTo('left', activeLeftTabId, item.path)
                  }
                }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <item.icon size={18} className="text-slate-500" />
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
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <item.icon size={18} className="text-slate-500" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  )
}

export default Sidebar
