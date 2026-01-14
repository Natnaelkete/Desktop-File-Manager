import React, { useState, useEffect } from 'react'
import { Package, Trash2, ExternalLink, RefreshCw, Smartphone } from 'lucide-react'

const AppManager: React.FC = () => {
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchApps = async () => {
      // Mocking app list for now as a stub
      setLoading(true)
      setTimeout(() => {
        setApps([
          { name: 'Google Chrome', version: '120.0.6099.130', publisher: 'Google LLC', size: '540 MB' },
          { name: 'Visual Studio Code', version: '1.85.1', publisher: 'Microsoft Corp', size: '320 MB' },
          { name: 'Spotify', version: '1.2.26', publisher: 'Spotify AB', size: '180 MB' },
          { name: 'Discord', version: '1.0.9001', publisher: 'Discord Inc.', size: '210 MB' },
        ])
        setLoading(false)
      }, 1000)
    }
    fetchApps()
  }, [])

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <div className="h-14 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="p-2 bg-pink-500/10 rounded-lg mr-3">
          <Smartphone size={20} className="text-pink-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">App Manager</h2>
        <button onClick={() => {}} className="ml-auto p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <RefreshCw size={18} className="text-slate-500" />
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <RefreshCw className="animate-spin text-primary-500" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apps.map((app) => (
              <div key={app.name} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:text-primary-500 transition-colors">
                    <Package size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">{app.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{app.publisher}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-full uppercase tracking-wider">{app.size}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        <button className="p-1.5 text-slate-400 hover:text-primary-500 transition-colors"><ExternalLink size={16} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AppManager
