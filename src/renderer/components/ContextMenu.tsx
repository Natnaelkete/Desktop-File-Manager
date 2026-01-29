import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { clsx } from "clsx";
import {
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  Info,
  Hash,
  LucideIcon,
  Type,
  ChevronRight,
} from "lucide-react";

export interface ContextMenuItem {
  label?: string;
  icon?: LucideIcon;
  action?: string;
  color?: string;
  separator?: boolean;
  submenu?: ContextMenuItem[];
}

interface ContextMenuProps {
  x: number;
  y: number;
  items?: ContextMenuItem[];
  onClose: () => void;
  onAction: (action: string) => void;
}

const MenuItem: React.FC<{
  item: ContextMenuItem;
  onAction: (action: string) => void;
}> = ({ item, onAction }) => {
  const [showSub, setShowSub] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowSub(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowSub(false);
    }, 200);
  };

  if (item.separator) {
    return (
      <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
    );
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => {
        if (item.action) {
          e.stopPropagation();
          onAction(item.action);
        }
      }}
      className={clsx(
        "relative flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors bg-transparent",
        item.color || "text-slate-700 dark:text-slate-200",
      )}
    >
      <div className="flex items-center gap-3">
        {item.icon && <item.icon size={16} />}
        <span>{item.label}</span>
      </div>
      {item.submenu && <ChevronRight size={14} className="opacity-50" />}

      {item.submenu && showSub && (
        <div
          className="absolute left-full top-0 ml-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 min-w-[150px] bg-white/95 dark:bg-slate-800/95 z-50 hover:block"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => e.stopPropagation()}
        >
          {item.submenu.map((sub, i) => (
            <MenuItem key={i} item={sub} onAction={onAction} />
          ))}
        </div>
      )}
    </div>
  );
};

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  items,
  onClose,
  onAction,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y, opacity: 0 });

  useEffect(() => {
    const handleClick = () => onClose();
    window.addEventListener("click", handleClick);
    window.addEventListener("blur", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("blur", handleClick);
    };
  }, [onClose]);

  useLayoutEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const { innerWidth, innerHeight } = window;

      let left = x;
      let top = y;

      if (x + rect.width > innerWidth) {
        left = x - rect.width;
      }

      if (y + rect.height > innerHeight) {
        top = Math.max(0, y - rect.height);
      }

      setPos({ left, top, opacity: 1 });
    }
  }, [x, y]);

  const defaultItems: ContextMenuItem[] = [
    { label: "Copy", icon: Copy, action: "copy" },
    { label: "Cut", icon: Scissors, action: "cut" },
    { label: "Paste", icon: Clipboard, action: "paste" },
    { label: "Rename", icon: Type, action: "rename" },
    { separator: true },
    { label: "Delete", icon: Trash2, action: "delete", color: "text-red-500" },
    { separator: true },
    { label: "Get MD5 Hash", icon: Hash, action: "hash-md5" },
    { label: "Properties", icon: Info, action: "properties" },
  ];

  const menuItems = items || defaultItems;

  return (
    <div
      ref={menuRef}
      className="fixed z-[1000] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl py-1 min-w-[180px] backdrop-blur-xl bg-white/90 dark:bg-slate-800/90 transition-opacity duration-75"
      style={{ left: pos.left, top: pos.top, opacity: pos.opacity }}
    >
      {menuItems.map((item, i) => (
        <MenuItem key={i} item={item} onAction={onAction} />
      ))}
    </div>
  );
};

export default ContextMenu;
