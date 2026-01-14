import React, { useState, useEffect } from 'react'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

interface DiskAnalyzerProps {
  path: string
  onClose: () => void
}

const DiskAnalyzer: React.FC<DiskAnalyzerProps> = ({ path, onClose }) => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const stats = await (window as any).electronAPI.getDirStats(path)
      if (!stats.error) {
        setData([{
          name: 'Root',
          children: stats.map((s: any) => ({
            name: s.name,
            size: s.size,
          }))
        }])
      }
      setLoading(false)
    }
    fetchData()
  }, [path])

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const CustomizedContent = (props: any) => {
    const { x, y, width, height, index, name, value } = props
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: `hsl(${(index * 30) % 360}, 70%, 60%)`,
            stroke: '#fff',
            strokeWidth: 2,
            strokeOpacity: 1,
            opacity: 0.8
          }}
        />
        {width > 50 && height > 20 && (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            fill="#fff"
            fontSize={12}
            className="pointer-events-none select-none"
          >
            {name}
          </text>
        )}
      </g>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <div className="h-14 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm z-10">
        <button 
          onClick={onClose}
          className="p-2 -ml-2 mr-4 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Disk Analyzer</h2>
        <span className="ml-4 text-sm text-slate-500 truncate">{path}</span>
      </div>

      <div className="flex-1 p-6 relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <Loader2 className="animate-spin text-primary-500 mb-4" size={48} />
            <p className="text-sm font-medium text-slate-500">Scanning directory structure...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={data}
              dataKey="size"
              stroke="#fff"
              fill="#8884d8"
              content={<CustomizedContent />}
            >
              <Tooltip 
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-xl glass">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{data.name}</p>
                        <p className="text-sm text-primary-500 font-medium">{formatSize(data.value)}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default DiskAnalyzer
