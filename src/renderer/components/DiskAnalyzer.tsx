import React, { useState, useEffect } from 'react'
import { 
  PieChart as PieChartIcon, 
  ArrowLeft, 
  Loader2, 
  FileText, 
  Film, 
  Image as ImageIcon, 
  Music, 
  Package, 
  Archive, 
  Trash2,
  ChevronRight,
  AlertCircle,
  Clock,
  ExternalLink,
  Copy
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { clsx } from 'clsx'

interface DiskAnalyzerProps {
  path: string
  onClose: () => void
}

const COLORS = ['#0ea5e9', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#64748b']

const DiskAnalyzer: React.FC<DiskAnalyzerProps> = ({ path, onClose }) => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      const stats = await (window as any).electronAPI.getAdvancedStats(path)
      if (!stats.error) {
        setData(stats)
      }
      setLoading(false)
    }
    fetchStats()
  }, [path])

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-primary-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Analyzing Storage...</h2>
        <p className="text-slate-500 text-sm">{path}</p>
      </div>
    )
  }

  if (!data) return null

  const chartData = Object.entries(data.categories).map(([name, cat]: [string, any]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: cat.size
  })).filter(c => c.value > 0)

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Header */}
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
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Storage Composition */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold mb-6 text-slate-500 uppercase tracking-widest px-2">Storage Composition</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-2xl">
                            <p className="font-bold text-sm">{payload[0].name}</p>
                            <p className="text-xs text-primary-500 font-mono">{formatSize(payload[0].value)}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Redundant & Junk Files */}
          <div className="bg-gradient-to-br from-indigo-500 to-primary-600 rounded-3xl p-6 shadow-xl shadow-primary-500/20 text-white relative overflow-hidden flex flex-col justify-center">
            <div className="relative z-10">
              <h3 className="text-sm font-bold mb-8 uppercase tracking-widest opacity-80">Junk & Redundant</h3>
              <div className="flex items-end gap-3 mb-2">
                <span className="text-5xl font-black">{data.redundantCount}</span>
                <span className="text-lg font-bold opacity-80 mb-1">items found</span>
              </div>
              <p className="text-sm opacity-90 mb-8 font-medium">Cleaning these .log, .tmp and cache files can free up roughly <span className="font-bold underline">{formatSize(data.redundantSize)}</span> of space.</p>
              <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 group w-fit">
                <Trash2 size={18} className="group-hover:rotate-12 transition-transform" />
                Clean Now
              </button>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-150 rotate-12 opacity-10 pointer-events-none">
              <Trash2 size={200} />
            </div>
          </div>

          {/* Duplicate Files */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col justify-center overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-sm font-bold mb-8 text-slate-500 uppercase tracking-widest px-2">Duplicate Files</h3>
              <div className="flex items-end gap-3 mb-2 px-2">
                <span className="text-5xl font-black text-rose-500">{data.duplicateCount}</span>
                <span className="text-lg font-bold text-slate-400 mb-1">copies</span>
              </div>
              <p className="text-sm text-slate-500 mb-8 px-2">Identical files found in different locations. Potential saving: <span className="text-rose-500 font-bold">{formatSize(data.duplicateSize)}</span></p>
              <button className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 group w-fit shadow-lg shadow-rose-500/30">
                <Copy size={18} className="group-hover:-translate-y-1 transition-transform" />
                View Duplicates
              </button>
            </div>
            <div className="absolute top-1/2 right-0 translate-x-1/4 -translate-y-1/2 scale-110 opacity-[0.03] dark:opacity-[0.05] pointer-events-none text-slate-900 dark:text-white">
              <Copy size={200} />
            </div>
          </div>
        </div>

        {/* Large Files */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Large Files</h3>
            <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full font-bold">Top 10 ({">"}100MB)</span>
          </div>
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
                  <button className="text-[10px] text-primary-500 font-bold hover:underline flex items-center gap-0.5 ml-auto">
                    Details <ChevronRight size={10} />
                  </button>
                </div>
              </div>
            ))}
            {data.largeFiles.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4 italic">No files larger than 100MB found in this scope.</p>
            )}
          </div>
        </div>

        {/* Recent Files */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Recently Created</h3>
            <span className="text-[10px] bg-primary-500/10 text-primary-500 px-2 py-1 rounded-full font-bold uppercase">Last 24 Hours</span>
          </div>
          <div className="space-y-2">
            {data.recentFiles.map((file: any) => (
              <div key={file.path} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                <div className="bg-primary-500/10 p-2.5 rounded-xl group-hover:bg-primary-500 group-hover:text-white transition-all text-primary-500">
                  <Clock size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{file.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    {new Date(file.modifiedAt).toLocaleString()}
                  </p>
                </div>
                <button className="p-2 rounded-lg text-slate-300 hover:text-primary-500 hover:bg-primary-500/5 transition-all">
                  <ExternalLink size={16} />
                </button>
              </div>
            ))}
            {data.recentFiles.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4 italic">No files created in the last 24 hours.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default DiskAnalyzer
