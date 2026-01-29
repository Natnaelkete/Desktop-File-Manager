import React from "react";
import { X, Plus } from "lucide-react";
import { useStore } from "../stores/store";
import { clsx } from "clsx";

interface TabBarProps {
  side: "left" | "right";
}

const TabBar: React.FC<TabBarProps> = ({ side }) => {
  const tabs = useStore((state) =>
    side === "left" ? state.leftTabs : state.rightTabs,
  );
  const activeTabId = useStore((state) =>
    side === "left" ? state.activeLeftTabId : state.activeRightTabId,
  );
  const { setActiveTab, closeTab, addTab } = useStore();

  return (
    <div className="flex items-center bg-slate-100 dark:bg-slate-950 px-2 gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-drag h-10 scrollbar-none">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(side, tab.id)}
          className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-medium cursor-pointer transition-all min-w-[120px] max-w-[200px] group border-x border-t",
            activeTabId === tab.id
              ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-primary-500 shadow-[0_-2px_0_0_#0ea5e9]"
              : "bg-transparent border-transparent text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800",
          )}
        >
          <span className="truncate flex-1">
            {tab.path.startsWith("library://")
              ? tab.path
                  .replace("library://", "")
                  .replace(/\/$/, "")
                  .charAt(0)
                  .toUpperCase() + tab.path.replace("library://", "").slice(1)
              : tab.path.split(/[\\/]/).filter(Boolean).pop() || "Root"}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeTab(side, tab.id);
            }}
            className="p-0.5 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <button
        onClick={() => addTab(side, "C:\\")}
        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors ml-2"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};

export default TabBar;
