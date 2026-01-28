import React, { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { clsx } from 'clsx'
import { Copy, Scissors, Clipboard, Trash2, Info, Hash, LucideIcon, Type } from 'lucide-react'

interface ContextMenuItem {
  label?: string
  icon?: LucideIcon
  action?: string
  color?: string
  separator?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
  onAction: (action: string) => void
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, onAction }) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: x, top: y, opacity: 0 })

  useEffect(() => {
    const handleClick = () => onClose()
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [onClose])

  useLayoutEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const { innerWidth, innerHeight } = window
      
      let left = x
      let top = y
      
      if (x + rect.width > innerWidth) {
        left = x - rect.width
      }
      
      if (y + rect.height > innerHeight) {
        top = Math.max(0, y - rect.height)
      }
      
      setPos({ left, top, opacity: 1 })
    }
  }, [x, y])

  const menuItems: ContextMenuItem[] = [
    { label: 'Copy', icon: Copy, action: 'copy' },
    { label: 'Cut', icon: Scissors, action: 'cut' },
    { label: 'Paste', icon: Clipboard, action: 'paste' },
    { label: 'Rename', icon: Type, action: 'rename' },
    { separator: true },
    { label: 'Delete', icon: Trash2, action: 'delete', color: 'text-red-500' },
    { separator: true },
    { label: 'Get MD5 Hash', icon: Hash, action: 'hash-md5' },
    { label: 'Properties', icon: Info, action: 'properties' },
  ]

  return (
    <div 
      ref={menuRef}
      className="fixed z-[1000] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl py-1 min-w-[180px] backdrop-blur-xl bg-white/90 dark:bg-slate-800/90 transition-opacity duration-75"
      style={{ left: pos.left, top: pos.top, opacity: pos.opacity }}
    >
      {menuItems.map((item, i) => (
        item.separator ? (
          <div key={i} className="my-1 border-t border-slate-100 dark:border-slate-700" />
        ) : (
          <div
            key={i}
            onClick={() => item.action && onAction(item.action)}
            className={clsx(
              "flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors",
              item.color || "text-slate-700 dark:text-slate-200"
            )}
          >
            {item.icon && <item.icon size={16} />}
            <span>{item.label}</span>
          </div>
        )
      ))}
    </div>
  )
}

export default ContextMenu
