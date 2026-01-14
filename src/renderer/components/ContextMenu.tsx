import React, { useEffect } from 'react'
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
  useEffect(() => {
    const handleClick = () => onClose()
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [onClose])

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
      className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 min-w-[160px] glass"
      style={{ left: x, top: y }}
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
