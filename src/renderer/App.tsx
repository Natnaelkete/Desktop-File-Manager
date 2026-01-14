import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import FilePanel from './components/FilePanel'
import DiskAnalyzer from './components/DiskAnalyzer'
import ImageViewer from './components/ImageViewer'
import TextEditor from './components/TextEditor'
import AppManager from './components/AppManager'
import NetworkPanel from './components/NetworkPanel'
import { useStore } from './stores/store'
import { 
  Search, 
  Moon, 
  Sun, 
  Settings, 
  LayoutDashboard,
  Bell
} from 'lucide-react'
import { clsx } from 'clsx'
import hotkeys from 'hotkeys-js'

const App: React.FC = () => {
  console.log('App Component Rendering')
  const { theme, setTheme, searchQuery, setSearchQuery, activeView, setActiveView } = useStore()
  const [analyzerPath, setAnalyzerPath] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<any>(null)
  const [editingFile, setEditingFile] = useState<any>(null)

  useEffect(() => {
    hotkeys('ctrl+t', (e) => {
      e.preventDefault()
      setTheme(useStore.getState().theme === 'dark' ? 'light' : 'dark')
    })
    hotkeys('ctrl+f', (e) => {
      e.preventDefault()
      document.querySelector('input')?.focus()
    })
    hotkeys('ctrl+1', () => setActiveView('explorer'))
    hotkeys('ctrl+2', () => setActiveView('analyzer'))
    hotkeys('ctrl+3', () => setActiveView('apps'))
    hotkeys('ctrl+4', () => setActiveView('network'))
    
    const handleOpenImage = (e: any) => setPreviewImage(e.detail)
    const handleOpenText = (e: any) => setEditingFile(e.detail)
    
    window.addEventListener('open-image', handleOpenImage)
    window.addEventListener('open-text', handleOpenText)
    
    return () => {
      hotkeys.unbind('ctrl+t,ctrl+f,ctrl+1,ctrl+2,ctrl+3,ctrl+4')
      window.removeEventListener('open-image', handleOpenImage)
      window.removeEventListener('open-text', handleOpenText)
    }
  }, [])

  return (
    <div className={clsx("h-screen flex flex-col overflow-hidden select-none", theme)}>
      <div className="flex-1 flex overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        
        {/* Custom Title Bar / Header */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md drag">
          <div className="flex items-center gap-3 no-drag">
            <div className="bg-primary-500 p-1.5 rounded-lg shadow-lg shadow-primary-500/20 cursor-pointer" onClick={() => setActiveView('explorer')}>
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">Smart<span className="text-primary-500 ml-0.5">Explorer</span></h1>
          </div>

          <div className="mx-12 flex-1 max-w-xl no-drag">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search files, folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 no-drag ml-auto pr-[140px]">
            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <Bell size={20} />
            </button>
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <Settings size={20} />
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 ml-2 border border-white dark:border-slate-700 shadow-sm cursor-pointer" />
          </div>
        </header>

        <div className="flex-1 flex mt-14 overflow-hidden">
          <Sidebar onOpenAnalyzer={(path) => { setAnalyzerPath(path); setActiveView('analyzer'); }} />
          
          <main className="flex-1 flex min-w-0 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 relative">
            <AnimatePresence mode="wait">
              {activeView === 'explorer' && (
                <motion.div 
                  key="explorer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex min-w-0"
                >
                  <FilePanel side="left" />
                  <FilePanel side="right" />
                </motion.div>
              )}
              {activeView === 'analyzer' && analyzerPath && (
                <motion.div 
                  key="analyzer"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  className="absolute inset-0 z-40 bg-white dark:bg-slate-950"
                >
                  <DiskAnalyzer path={analyzerPath} onClose={() => setActiveView('explorer')} />
                </motion.div>
              )}
              {activeView === 'apps' && (
                <motion.div 
                  key="apps"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex-1"
                >
                  <AppManager />
                </motion.div>
              )}
              {activeView === 'network' && (
                <motion.div 
                  key="network"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex-1"
                >
                  <NetworkPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100]"
          >
            <ImageViewer 
              src={previewImage.path} 
              name={previewImage.name} 
              onClose={() => setPreviewImage(null)} 
            />
          </motion.div>
        )}
        
        {editingFile && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[120]"
          >
            <TextEditor 
              path={editingFile.path} 
              name={editingFile.name} 
              onClose={() => setEditingFile(null)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="h-6 bg-primary-600 text-white flex items-center px-4 text-[10px] font-medium tracking-wide">
        <div className="flex items-center gap-4">
          <span>{searchQuery ? `Searching for: ${searchQuery}` : 'Ready'}</span>
          <div className="h-3 w-[1px] bg-white/20" />
          <span>Items Selected: {useStore.getState().selection.length}</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span>Win64 v1.0.0</span>
        </div>
      </footer>
    </div>
  )
}

export default App
