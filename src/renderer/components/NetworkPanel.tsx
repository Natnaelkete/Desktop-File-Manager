import React from 'react'
import { Globe, Server, Share2, Plus, ArrowRight } from 'lucide-react'

const NetworkPanel: React.FC = () => {
  const providers = [
    { name: 'FTP Server', icon: Server, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'SMB / LAN', icon: Globe, color: 'text-green-500', bg: 'bg-green-500/10' },
    { name: 'WebDAV', icon: Share2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ]

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <div className="h-14 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="p-2 bg-blue-500/10 rounded-lg mr-3">
          <Globe size={20} className="text-blue-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Network & Cloud</h2>
        <button className="ml-auto flex items-center gap-2 px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-primary-500/20">
          <Plus size={16} /> Add Connection
        </button>
      </div>

      <div className="flex-1 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {providers.map((p) => (
            <div key={p.name} className="relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all group cursor-pointer border-b-4 border-b-transparent hover:border-b-primary-500">
              <div className="flex items-center gap-4">
                <div className={`h-16 w-16 rounded-2xl ${p.bg} flex items-center justify-center ${p.color}`}>
                  <p.icon size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{p.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">Connect to remote storage or local servers.</p>
                </div>
                <ArrowRight size={20} className="text-slate-300 group-hover:text-primary-500 translate-x-0 group-hover:translate-x-2 transition-all" />
              </div>
              
              <div className="mt-8 flex gap-2">
                <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-700/50 text-slate-400 rounded-md uppercase tracking-tighter">Status: Disconnected</span>
                <span className="text-[10px] font-bold px-2 py-1 bg-primary-500/10 text-primary-500 rounded-md uppercase tracking-tighter">Stub</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-2xl flex items-center gap-6">
          <div className="h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/30">
            <Share2 size={24} />
          </div>
          <div>
            <h4 className="font-bold text-indigo-900 dark:text-indigo-400">Share with LAN</h4>
            <p className="text-sm text-indigo-700/70 dark:text-indigo-400/60 mt-0.5">Allow other devices on your local network to access your shared folders.</p>
          </div>
          <button className="ml-auto px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all">Enable Sharing</button>
        </div>
      </div>
    </div>
  )
}

export default NetworkPanel
