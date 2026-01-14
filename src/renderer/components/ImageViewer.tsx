import React from 'react'
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react'

interface ImageViewerProps {
  src: string
  name: string
  onClose: () => void
}

const ImageViewer: React.FC<ImageViewerProps> = ({ src, name, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col no-drag">
      <header className="h-16 flex items-center px-6 gap-4 text-white">
        <span className="font-medium truncate flex-1">{name}</span>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors"><ZoomIn size={20} /></button>
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors"><ZoomOut size={20} /></button>
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors"><RotateCw size={20} /></button>
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors ml-4"><Download size={20} /></button>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-red-500 transition-colors ml-2"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        <img 
          src={`file://${src}`} 
          alt={name}
          className="max-w-full max-h-full object-contain shadow-2xl rounded-sm transition-transform duration-300"
        />
      </div>
    </div>
  )
}

export default ImageViewer
