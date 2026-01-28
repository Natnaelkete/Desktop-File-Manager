import React, { useState, useEffect, useCallback } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

interface ImageViewerProps {
  items: any[]
  startIndex: number
  onClose: () => void
}

const ImageViewer: React.FC<ImageViewerProps> = ({ items, startIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  
  const currentItem = items[currentIndex]
  const imageUrl = `local-resource://media/?path=${encodeURIComponent(currentItem.path)}`

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % items.length)
    setZoom(1)
    setRotation(0)
  }, [items.length])

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
    setZoom(1)
    setRotation(0)
  }, [items.length])

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5))
  const handleRotate = () => setRotation(prev => prev + 90)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'Escape') onClose()
      if (e.key === '+' || e.key === '=') handleZoomIn()
      if (e.key === '-' || e.key === '_') handleZoomOut()
      if (e.key === 'r' || e.key === 'R') handleRotate()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleNext, handlePrev, onClose])

  const handleSave = () => {
    // Open in folder as a placeholder for "Save"
    if ((window as any).electronAPI?.openPath) {
       (window as any).electronAPI.openPath(currentItem.path)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-3xl flex flex-col no-drag animate-in fade-in duration-300">
      <header className="h-16 flex items-center px-6 gap-4 text-white/90 border-b border-white/5 z-50 bg-black/40">
        <span className="font-medium truncate flex-1 text-base">
          {currentItem.name} 
          <span className="ml-3 text-xs opacity-50 font-normal">({currentIndex + 1} / {items.length})</span>
        </span>
        
        <div className="flex items-center gap-3 pr-[140px]">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/10">
            <button onClick={handleZoomIn} className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Zoom In ( + )"><ZoomIn size={16} /></button>
            <button onClick={handleZoomOut} className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Zoom Out ( - )"><ZoomOut size={16} /></button>
            <button onClick={handleRotate} className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Rotate ( R )"><RotateCw size={16} /></button>
          </div>
          
          <button 
            onClick={handleSave}
            className="p-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 transition-colors flex items-center gap-2 px-3 ml-1 shadow-lg shadow-primary-500/20"
          >
            <Download size={16} />
            <span className="text-xs font-semibold">Save</span>
          </button>

          <div className="w-px h-5 bg-white/10 mx-1" />

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500 transition-all duration-200 border border-white/10 hover:border-red-500"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative group">
        {/* Navigation Arrows */}
        {items.length > 1 && (
          <>
            <button 
              onClick={handlePrev}
              className="absolute left-6 z-50 p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition-all opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0"
            >
              <ChevronLeft size={32} />
            </button>
            <button 
              onClick={handleNext}
              className="absolute right-6 z-50 p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}

        <AnimatePresence mode="wait">
          <motion.img 
            key={currentItem.path}
            src={imageUrl} 
            alt={currentItem.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              scale: zoom, 
              rotate: rotation,
              transition: { duration: 0.2 }
            }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full h-full object-contain shadow-2xl select-none"
            onDragStart={(e) => e.preventDefault()}
          />
        </AnimatePresence>
        
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[600px] h-[600px] bg-primary-500/10 blur-[180px] rounded-full pointer-events-none" />
      </div>
    </div>
  )
}

export default ImageViewer
