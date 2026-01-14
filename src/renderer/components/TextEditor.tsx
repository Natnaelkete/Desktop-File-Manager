import React, { useState, useEffect } from 'react'
import { X, Save, Edit, Code } from 'lucide-react'

interface TextEditorProps {
  path: string
  name: string
  onClose: () => void
}

const TextEditor: React.FC<TextEditorProps> = ({ path, name, onClose }) => {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const readFile = async () => {
      setLoading(true)
      const data = await (window as any).electronAPI.readFile(path)
      setContent(data)
      setLoading(false)
    }
    readFile()
  }, [path])

  const handleSave = async () => {
    setSaving(true)
    await (window as any).electronAPI.writeFile(path, content)
    setSaving(false)
    alert('File saved successfully!')
  }

  return (
    <div className="fixed inset-0 z-[120] bg-white dark:bg-slate-900 flex flex-col no-drag">
      <header className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 gap-4 bg-white dark:bg-slate-900/50 backdrop-blur-md">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <Code className="text-indigo-500" size={18} />
        </div>
        <span className="font-bold text-sm truncate flex-1">{name}</span>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-1.5 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-all"
          >
            <Save size={14} /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-slate-500 animate-pulse">Loading file content...</p>
          </div>
        ) : (
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-6 bg-slate-50 dark:bg-slate-950 font-mono text-sm resize-none outline-none text-slate-800 dark:text-slate-300 scrollbar-thin"
            spellCheck={false}
          />
        )}
      </div>
    </div>
  )
}

export default TextEditor
