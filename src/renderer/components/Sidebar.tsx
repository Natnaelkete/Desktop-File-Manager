import React, { useEffect, useState } from "react";
import {
  HardDrive,
  Folder,
  FileText,
  Download,
  Monitor,
  PieChart,
  Clock,
  Star,
  Settings,
  Image as ImageIcon,
  Film,
  Music,
  FileCode,
  Smartphone,
  Globe,
  Package,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useStore } from "../stores/store";
import { clsx } from "clsx";

interface Drive {
  name: string;
  path: string;
  used: number;
  free: number;
  total: number;
}

interface SidebarProps {
  onOpenAnalyzer: (path: string) => void;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenAnalyzer, collapsed = false, setCollapsed }) => {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [userPaths, setUserPaths] = useState<any>(null);
  const {
    navigateTo,
    activeLeftTabId,
    activeRightTabId,
    activeSide,
    activeView,
    setActiveView,
    showHidden,
    toggleHidden,
  } = useStore();

  useEffect(() => {
    const init = async () => {
      const [d, paths] = await Promise.all([
        (window as any).electronAPI.getDrives(),
        (window as any).electronAPI.getUserPaths(),
      ]);
      setDrives(d);
      setUserPaths(paths);
    };
    init();
  }, []);

  const quickAccess = userPaths
    ? [
        { label: "Documents", path: userPaths.documents, icon: FileText },
        { label: "Downloads", path: userPaths.downloads, icon: Download },
        { label: "Desktop", path: userPaths.desktop, icon: Monitor },
      ]
    : [];

  const tools = [
    { label: "Apps", view: "apps", icon: Package },
    { label: "Network", view: "network", icon: Globe },
  ];

  const library = [
    { label: "Images", path: "library://images", icon: ImageIcon },
    { label: "Videos", path: "library://videos", icon: Film },
    { label: "Music", path: "library://music", icon: Music },
  ];

  const handleItemClick = (item: any) => {
    if (item.action === "analyzer") {
      onOpenAnalyzer("C:\\");
      setActiveView("analyzer");
    } else if (item.view) {
      setActiveView(item.view);
    } else if (item.path) {
      setActiveView("explorer");
      const state = useStore.getState();
      let activeTabId;
      if (activeSide === "left") activeTabId = state.activeLeftTabId;
      else if (activeSide === "right") activeTabId = state.activeRightTabId;
      else if (activeSide === "bottomLeft") activeTabId = state.activeBottomLeftTabId;
      else activeTabId = state.activeBottomRightTabId;

      navigateTo(activeSide, activeTabId, item.path);
    }
  };

  return (
    <aside
      className={clsx(
        "border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-950 no-drag transition-all",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className={clsx("flex items-center p-2 shrink-0 h-10", collapsed ? "justify-center" : "justify-end")}>
        <button
          onClick={() => setCollapsed?.(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className={clsx("flex-1 overflow-y-auto p-4 pt-0", collapsed && "px-2")}>
        {/* Drives */}
        <section className="mb-6">
          {!collapsed && (
            <h2 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2">
              Drives
            </h2>
          )}
          <div className="space-y-1">
            {drives.map((drive) => (
              <div
                key={drive.name}
                className={clsx(
                  "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group relative",
                  activeView === "explorer" &&
                    activeLeftTabId === "l1" &&
                    drives[0]?.path === drive.path
                    ? "bg-slate-200 dark:bg-slate-800"
                    : "hover:bg-slate-200 dark:hover:bg-slate-800",
                  collapsed && "justify-center"
                )}
                onClick={() => {
                  setActiveView("explorer");
                  const state = useStore.getState();
                  let activeTabId;
                  if (activeSide === "left") activeTabId = state.activeLeftTabId;
                  else if (activeSide === "right") activeTabId = state.activeRightTabId;
                  else if (activeSide === "bottomLeft") activeTabId = state.activeBottomLeftTabId;
                  else activeTabId = state.activeBottomRightTabId;
                  navigateTo(activeSide, activeTabId, drive.path);
                }}
                title={collapsed ? drive.name : undefined}
              >
                <HardDrive size={18} className="text-primary-500" />
                <div className={clsx("flex-1 min-w-0", collapsed && "hidden")}>
                  <div className="text-sm font-medium truncate">
                    {drive.name}
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full mt-1 overflow-hidden">
                    <div
                      className="bg-primary-500 h-full"
                      style={{ width: `${(drive.used / drive.total) * 100}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAnalyzer(drive.path);
                  }}
                  title="Analyze partition"
                  className={clsx(
                    "p-1.5 rounded-md hover:bg-primary-500 hover:text-white text-slate-400 transition-all ml-1 z-10",
                    collapsed && "hidden",
                  )}
                >
                  <PieChart size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Tools */}
        <section className="mb-6">
          {!collapsed && (
            <h2 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2">
              Tools
            </h2>
          )}
          <div className="space-y-1">
            {tools.map((item) => (
              <div
                key={item.label}
                onClick={() => handleItemClick(item)}
                className={clsx(
                  "flex items-center gap-3 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors",
                  activeView === item.view ||
                    (item.view === "analyzer" && activeView === "analyzer")
                    ? "bg-primary-500/10 text-primary-500 font-bold"
                    : "text-slate-500",
                  collapsed && "justify-center"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} />
                <span className={clsx("text-sm font-medium", collapsed && "hidden")}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Access */}
        <section className="mb-6">
          {!collapsed && (
            <h2 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2">
              Quick Access
            </h2>
          )}
          <div className="space-y-1">
            {quickAccess.map((item) => (
              <div
                key={item.label}
                onClick={() => handleItemClick(item)}
                className={clsx(
                  "flex items-center gap-3 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors text-slate-500",
                  collapsed && "justify-center"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} />
                <span className={clsx("text-sm font-medium", collapsed && "hidden")}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Library */}
        <section>
          {!collapsed && (
            <h2 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2">
              Library
            </h2>
          )}
          <div className="space-y-1">
            {library.map((item) => (
              <div
                key={item.label}
                onClick={() => handleItemClick(item)}
                className={clsx(
                  "flex items-center gap-3 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors text-slate-500",
                  collapsed && "justify-center"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} />
                <span className={clsx("text-sm font-medium", collapsed && "hidden")}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sidebar Footer / Settings */}
      <div className={clsx("p-4 border-t border-slate-200 dark:border-slate-800 mt-auto shrink-0", collapsed && "px-2")}>
        <div
          onClick={toggleHidden}
          className={clsx(
            "flex items-center gap-3 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors text-slate-500",
            showHidden && "text-primary-500 bg-primary-500/5",
            collapsed && "justify-center"
          )}
          title={collapsed ? (showHidden ? "Hide Hidden" : "Show Hidden") : undefined}
        >
          {showHidden ? <Eye size={18} /> : <EyeOff size={18} />}
          <span className={clsx("text-sm font-medium", collapsed && "hidden")}>
            {showHidden ? "Hide Hidden" : "Show Hidden"}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
