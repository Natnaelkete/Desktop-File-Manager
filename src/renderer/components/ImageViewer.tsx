import React from 'react'
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react'

interface ImageViewerProps {
  src: string
  name: string
  onClose: () => void
}

const ImageViewer: React.FC<ImageViewerProps> = ({ src, name, onClose }) => {
  // Use a query parameter to safely pass the absolute path to our custom protocol.
  // This avoids all hostname parsing issues with Windows drive letters.
  const imageUrl = `local-resource://media/?path=${encodeURIComponent(src)}`

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-3xl flex flex-col no-drag animate-in fade-in duration-300">
      <header className="h-16 flex items-center px-6 gap-4 text-white/90 border-b border-white/5 z-50">
        <span className="font-medium truncate flex-1 text-base">{name}</span>
        
        <div className="flex items-center gap-3 pr-32"> {/* Increased padding to avoid window controls */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/10">
            <button className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Zoom In"><ZoomIn size={16} /></button>
            <button className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Zoom Out"><ZoomOut size={16} /></button>
            <button className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Rotate"><RotateCw size={16} /></button>
          </div>
          
          <button className="p-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 transition-colors flex items-center gap-2 px-3 ml-1 shadow-lg shadow-primary-500/20">
            <Download size={16} />
            <span className="text-xs font-semibold">Save</span>
          </button>

          <div className="w-px h-5 bg-white/10 mx-1" />

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500 transition-all duration-200 border border-white/10 hover:border-red-500"
            title="Close Viewer"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative group">
        <img 
          src={imageUrl} 
          alt={name}
          className="w-full h-full object-contain shadow-2xl transition-all duration-500 select-none animate-in zoom-in-95"
          onDragStart={(e) => e.preventDefault()}
        />
        
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[500px] h-[500px] bg-primary-500/10 blur-[150px] rounded-full pointer-events-none" />
      </div>
    </div>
  )
}

export default ImageViewer
