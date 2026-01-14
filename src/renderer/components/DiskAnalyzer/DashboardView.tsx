import React from 'react'
import { 
  Trash2,
  ChevronRight,
  AlertCircle,
  Clock,
  FolderOpen,
  Copy
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { clsx } from 'clsx'
import { AnalyzerCard, SectionHeader } from './atoms'

interface DashboardViewProps {
  data: any
  onViewDuplicates: () => void
  onCleanJunk: () => void
  onReveal: (path: string) => void
  formatSize: (bytes: number) => string
}

const COLORS = ['#0ea5e9', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#64748b']

const DashboardView: React.FC<DashboardViewProps> = ({ 
  data, 
  onViewDuplicates, 
  onCleanJunk, 
  onReveal,
  formatSize 
}) => {
  const chartData = Object.entries(data.categories).map(([name, cat]: [string, any]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: cat.size
  })).filter(c => c.value > 0)

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
      
      {/* TOP SECTION: BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Storage Composition - LARGER BENTO PIECE */}
        <AnalyzerCard 
          title="Storage Composition" 
          className="lg:col-span-2 lg:row-span-2 shadow-indigo-500/10 h-full flex flex-col"
        >
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {chartData.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-2xl">
                          <p className="font-bold text-sm tracking-tight">{payload[0].name}</p>
                          <p className="text-xs text-primary-500 font-mono font-bold">{formatSize(payload[0].value)}</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend 
                  verticalAlign="middle" 
                  align="right" 
                  layout="vertical" 
                  iconType="circle"
                  wrapperStyle={{ paddingLeft: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </AnalyzerCard>

        {/* Junk Files CTA - BENTO PIECE */}
        <div className="bg-gradient-to-br from-indigo-500 to-primary-600 rounded-[2.5rem] p-8 shadow-2xl shadow-primary-500/20 text-white relative overflow-hidden flex flex-col justify-between h-[220px] lg:h-auto lg:col-span-1">
          <div className="relative z-10">
            <h3 className="text-[10px] font-black mb-4 uppercase tracking-[0.2em] opacity-60">Junk & Redundant</h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-black tracking-tighter leading-none">{data.redundantCount}</span>
              <span className="text-xs font-bold opacity-60 uppercase tracking-widest">Items</span>
            </div>
            <p className="text-[11px] opacity-90 leading-relaxed font-medium">Potential saving: {formatSize(data.redundantSize)}</p>
          </div>
          <button 
            onClick={onCleanJunk}
            className="relative z-10 bg-white/20 hover:bg-white text-primary-600 lg:text-white lg:hover:text-primary-600 backdrop-blur-md px-6 py-3 rounded-2xl font-black text-[10px] transition-all flex items-center justify-center gap-2 group w-full shadow-lg active:scale-95 uppercase tracking-widest"
          >
            <Trash2 size={14} className="group-hover:rotate-12 transition-transform" />
            Clean System
          </button>
          <div className="absolute -top-4 -right-4 scale-125 opacity-10 pointer-events-none rotate-12">
            <Trash2 size={180} strokeWidth={1} />
          </div>
        </div>

        {/* Duplicates CTA - BENTO PIECE */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col justify-between overflow-hidden relative h-[220px] lg:h-auto lg:col-span-1">
          <div className="relative z-10">
             <h3 className="text-[10px] font-black mb-4 text-slate-400 uppercase tracking-[0.2em]">Duplicate Storage</h3>
             <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-black text-rose-500 tracking-tighter leading-none">{data.duplicateCount}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Copies</span>
             </div>
             <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Potential saving: {formatSize(data.duplicateSize)}</p>
          </div>
          <button 
            onClick={onViewDuplicates}
            className="relative z-10 bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] transition-all flex items-center justify-center gap-2 group w-full shadow-lg shadow-rose-500/20 active:scale-95 uppercase tracking-widest"
          >
            <Copy size={14} className="group-hover:-translate-y-1 transition-transform" />
            Analyze Groups
          </button>
          <div className="absolute -bottom-6 -right-6 scale-125 opacity-[0.03] dark:opacity-[0.05] pointer-events-none text-slate-900 dark:text-white rotate-[-15deg]">
            <Copy size={180} strokeWidth={1} />
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: LISTS (RESTORED TO ORIGINAL) */}
      <div className="space-y-6">
        {/* Large Files Section */}
        <AnalyzerCard>
          <SectionHeader title="Largest Bloatware" badge={`TOP 20 (>100MB)`} badgeColor="bg-amber-500/10 text-amber-500" />
          <div className="space-y-3">
            {data.largeFiles.map((file: any) => (
              <div key={file.path} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                <div className="bg-amber-500/10 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                  <AlertCircle size={20} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{file.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{file.path}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-slate-700 dark:text-slate-200">{formatSize(file.size)}</p>
                  <button 
                    onClick={() => onReveal(file.path)}
                    className="text-[10px] text-primary-500 font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ml-auto uppercase"
                  >
                    Locate <ChevronRight size={10} />
                  </button>
                </div>
              </div>
            ))}
            {data.largeFiles.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4 italic">No massive files discovered.</p>
            )}
          </div>
        </AnalyzerCard>

        {/* Recent Files Section */}
        <AnalyzerCard>
          <SectionHeader title="Recently Created" badge="Last 24 Hours" />
          <div className="space-y-2">
            {data.recentFiles.map((file: any) => (
              <div key={file.path} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                <div className="bg-primary-500/10 p-2.5 rounded-xl group-hover:bg-primary-500 group-hover:text-white transition-all text-primary-500">
                  <Clock size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate tracking-tight">{file.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    {new Date(file.modifiedAt).toLocaleString()}
                  </p>
                </div>
                <button 
                  onClick={() => onReveal(file.path)}
                  className="p-2 rounded-lg text-slate-300 hover:text-primary-500 hover:bg-primary-500/5 transition-all text-sm"
                >
                  <FolderOpen size={16} />
                </button>
              </div>
            ))}
            {data.recentFiles.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4 italic">No files created in the last 24 hours.</p>
            )}
          </div>
        </AnalyzerCard>
      </div>
    </div>
  )
}

export default DashboardView
