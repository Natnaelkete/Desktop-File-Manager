import React, { useEffect, useState } from "react";
import {
  HardDrive,
  Folder,
  FileText,
  Download,
  Monitor,
  PieChart,
  Clock,
  Settings,
  Image as ImageIcon,
  Film,
  Music,
  FileCode,
  Smartphone,
  Globe,
  Package,
  Rocket,
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
  onOpenWorkspaceManager: () => void;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onOpenAnalyzer,
  onOpenWorkspaceManager,
  collapsed = false,
  setCollapsed,
}) => {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [userPaths, setUserPaths] = useState<any>(null);
  const {
    navigateTo,
    activeLeftTabId,
    activeRightTabId,
    activeSide,
    activeView,
    setActiveView,
    workspaces,
    loadWorkspace,
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
    { label: "Booster", view: "booster", icon: Rocket },
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
      else if (activeSide === "bottomLeft")
        activeTabId = state.activeBottomLeftTabId;
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
      <div
        className={clsx(
          "flex items-center p-2 shrink-0 h-10",
          collapsed ? "justify-center" : "justify-end",
        )}
      >
        <button
          onClick={() => setCollapsed?.(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div
        className={clsx(
          "flex-1 overflow-y-auto overflow-x-hidden p-4 pt-0 no-scrollbar",
          collapsed && "px-2",
        )}
      >
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
                  collapsed && "justify-center",
                )}
                onClick={() => {
                  setActiveView("explorer");
                  const state = useStore.getState();
                  let activeTabId;
                  if (activeSide === "left")
                    activeTabId = state.activeLeftTabId;
                  else if (activeSide === "right")
                    activeTabId = state.activeRightTabId;
                  else if (activeSide === "bottomLeft")
                    activeTabId = state.activeBottomLeftTabId;
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
                  collapsed && "justify-center",
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} />
                <span
                  className={clsx("text-sm font-medium", collapsed && "hidden")}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Workspaces */}
        <section className="mb-6">
          {!collapsed && (
            <div className="flex items-center justify-between mb-2 px-2">
              <h2 className="text-xs font-bold text-slate-400 uppercase">
                Workspaces
              </h2>
              <button
                onClick={onOpenWorkspaceManager}
                className="text-[10px] text-primary-500 hover:text-primary-600"
              >
                Manage
              </button>
            </div>
          )}
          <div className="space-y-1">
            {workspaces.slice(0, 5).map((ws) => (
              <div
                key={ws.id}
                onClick={() => loadWorkspace(ws.id)}
                className={clsx(
                  "flex items-center gap-3 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors text-slate-500",
                  collapsed && "justify-center",
                )}
                title={collapsed ? ws.name : undefined}
              >
                <Folder size={18} />
                <span
                  className={clsx(
                    "text-sm font-medium truncate",
                    collapsed && "hidden",
                  )}
                >
                  {ws.name}
                </span>
              </div>
            ))}
            {workspaces.length === 0 && !collapsed && (
              <div className="text-[11px] text-slate-400 px-2">
                No workspaces yet
              </div>
            )}
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
                  collapsed && "justify-center",
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} />
                <span
                  className={clsx("text-sm font-medium", collapsed && "hidden")}
                >
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
                  collapsed && "justify-center",
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} />
                <span
                  className={clsx("text-sm font-medium", collapsed && "hidden")}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
};

export default Sidebar;
