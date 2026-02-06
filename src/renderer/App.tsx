import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./components/Sidebar";
import WorkspaceManager from "./components/WorkspaceManager";
import FilePanel from "./components/FilePanel";
import DiskAnalyzer from "./components/DiskAnalyzer";
import ImageViewer from "./components/ImageViewer";
import TextEditor from "./components/TextEditor";
import AppManager from "./components/AppManager";
import NetworkPanel from "./components/NetworkPanel";
import BoosterPanel from "./components/BoosterPanel";
import { useStore } from "./stores/store";
import {
  Search,
  Moon,
  Sun,
  Settings,
  LayoutDashboard,
  Bell,
  Columns,
  Grid,
  Briefcase,
} from "lucide-react";
import { clsx } from "clsx";
import hotkeys from "hotkeys-js";

const App: React.FC = () => {
  console.log("App Component Rendering");
  const {
    theme,
    setTheme,
    searchQuery,
    setSearchQuery,
    activeView,
    setActiveView,
    activeSide,
    activeLeftTabId,
    activeRightTabId,
    goBack,
    goForward,
    dualPane,
    toggleDualPane,
    toggleQuadPane,
    paneCount,
    clearUnlockedPaths,
  } = useStore();
  const [analyzerPath, setAnalyzerPath] = useState<string | null>(null);
  const [viewerData, setViewerData] = useState<{
    items: any[];
    index: number;
  } | null>(null);
  const [editingFile, setEditingFile] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showWorkspaceManager, setShowWorkspaceManager] = useState(false);
  const explorerContainerRef = useRef<HTMLDivElement | null>(null);
  const leftColRef = useRef<HTMLDivElement | null>(null);
  const rightColRef = useRef<HTMLDivElement | null>(null);
  const [gridSplit, setGridSplit] = useState({
    col: 50,
    leftRow: 50,
    rightRow: 50,
  });
  const dragAxisRef = useRef<"col" | "leftRow" | "rightRow" | null>(null);

  const handleGridPointerMove = useCallback((e: PointerEvent) => {
    if (!dragAxisRef.current) return;

    if (dragAxisRef.current === "col") {
      const container = explorerContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const next = ((e.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(80, Math.max(20, next));
      setGridSplit((prev) => ({ ...prev, col: clamped }));
      return;
    }

    if (dragAxisRef.current === "leftRow") {
      const col = leftColRef.current;
      if (!col) return;
      const rect = col.getBoundingClientRect();
      const next = ((e.clientY - rect.top) / rect.height) * 100;
      const clamped = Math.min(80, Math.max(20, next));
      setGridSplit((prev) => ({ ...prev, leftRow: clamped }));
      return;
    }

    if (dragAxisRef.current === "rightRow") {
      const col = rightColRef.current;
      if (!col) return;
      const rect = col.getBoundingClientRect();
      const next = ((e.clientY - rect.top) / rect.height) * 100;
      const clamped = Math.min(80, Math.max(20, next));
      setGridSplit((prev) => ({ ...prev, rightRow: clamped }));
    }
  }, []);

  const handleGridPointerUp = useCallback(() => {
    dragAxisRef.current = null;
    window.removeEventListener("pointermove", handleGridPointerMove);
    window.removeEventListener("pointerup", handleGridPointerUp);
  }, [handleGridPointerMove]);

  useEffect(() => {
    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent back navigation when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const activeTabId =
        activeSide === "left" ? activeLeftTabId : activeRightTabId;

      if (e.key === "Backspace") {
        e.preventDefault();
        goBack(activeSide, activeTabId);
      } else if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        goForward(activeSide, activeTabId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    hotkeys("ctrl+t", (e) => {
      e.preventDefault();
      setTheme(useStore.getState().theme === "dark" ? "light" : "dark");
    });
    hotkeys("ctrl+f", (e) => {
      e.preventDefault();
      document.querySelector("input")?.focus();
    });
    hotkeys("ctrl+1", () => setActiveView("explorer"));
    hotkeys("ctrl+2", () => setActiveView("analyzer"));
    hotkeys("ctrl+3", () => setActiveView("apps"));
    hotkeys("ctrl+4", () => setActiveView("network"));
    hotkeys("ctrl+5", () => setActiveView("booster"));
    hotkeys("ctrl+w", (e) => {
      e.preventDefault();
      const {
        closeTab,
        activeSide,
        activeLeftTabId,
        activeRightTabId,
        leftTabs,
        rightTabs,
      } = useStore.getState();
      const activeTabId =
        activeSide === "left" ? activeLeftTabId : activeRightTabId;
      const tabs = activeSide === "left" ? leftTabs : rightTabs;
      // Don't close if it's the last tab
      if (tabs.length > 1) {
        closeTab(activeSide, activeTabId);
      }
    });

    const handleOpenImage = (e: any) => setViewerData(e.detail);
    const handleOpenText = (e: any) => setEditingFile(e.detail);

    window.addEventListener("open-image", handleOpenImage);
    window.addEventListener("open-text", handleOpenText);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      hotkeys.unbind("ctrl+t,ctrl+f,ctrl+1,ctrl+2,ctrl+3,ctrl+4,ctrl+5");
      window.removeEventListener("open-image", handleOpenImage);
      window.removeEventListener("open-text", handleOpenText);
    };
  }, []);

  useEffect(() => {
    const AUTO_LOCK_MS = 5 * 60 * 1000;
    let timer: number | null = null;

    const resetTimer = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        clearUnlockedPaths();
      }, AUTO_LOCK_MS);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        clearUnlockedPaths();
      } else {
        resetTimer();
      }
    };

    resetTimer();

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("mousedown", resetTimer);
    window.addEventListener("touchstart", resetTimer);
    window.addEventListener("blur", clearUnlockedPaths);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("mousedown", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      window.removeEventListener("blur", clearUnlockedPaths);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [clearUnlockedPaths]);

  return (
    <div
      className={clsx(
        "h-screen flex flex-col overflow-hidden select-none",
        theme,
      )}
    >
      <div className="flex-1 flex overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {/* Custom Title Bar / Header */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md drag">
          <div className="flex items-center gap-3 no-drag">
            <div
              className="bg-primary-500 p-1.5 rounded-lg shadow-lg shadow-primary-500/20 cursor-pointer"
              onClick={() => setActiveView("explorer")}
            >
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">
              Smart<span className="text-primary-500 ml-0.5">Explorer</span>
            </h1>
          </div>

          <div className="mx-12 flex-1 max-w-xl no-drag">
            <div className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors"
                size={18}
              />
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
              onClick={() => setShowWorkspaceManager(true)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              title="Project Workspaces"
            >
              <Briefcase size={20} />
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={toggleDualPane}
              className={clsx(
                "p-2 rounded-lg transition-all",
                dualPane && paneCount !== 4
                  ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500",
              )}
              title={dualPane ? "Switch to Single Pane" : "Switch to Dual Pane"}
            >
              <Columns size={20} />
            </button>
            <button
              onClick={toggleQuadPane}
              className={clsx(
                "p-2 rounded-lg transition-all",
                paneCount === 4
                  ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500",
              )}
              title="Toggle Quad View"
            >
              <Grid size={20} />
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 flex mt-14 overflow-hidden">
          <Sidebar
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            onOpenAnalyzer={(path) => {
              setAnalyzerPath(path);
              setActiveView("analyzer");
            }}
            onOpenWorkspaceManager={() => setShowWorkspaceManager(true)}
          />

          <main className="flex-1 flex min-w-0 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 relative">
            <AnimatePresence mode="wait">
              {activeView === "explorer" && (
                <motion.div
                  key="explorer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={clsx(
                    "flex-1 min-w-0 overflow-hidden",
                    paneCount === 4
                      ? "flex gap-1 bg-slate-200 dark:bg-slate-800 relative"
                      : "flex",
                  )}
                  ref={paneCount === 4 ? explorerContainerRef : undefined}
                >
                  {paneCount !== 4 && (
                    <>
                      <FilePanel side="left" />
                      {dualPane && <FilePanel side="right" />}
                    </>
                  )}
                  {paneCount === 4 && (
                    <>
                      <div
                        ref={leftColRef}
                        className="relative grid min-w-0"
                        style={{
                          gridTemplateRows: `${gridSplit.leftRow}% ${100 - gridSplit.leftRow}%`,
                          width: `${gridSplit.col}%`,
                          minHeight: 0,
                        }}
                      >
                        <FilePanel side="left" />
                        <FilePanel side="bottomLeft" />
                        <div
                          className="absolute left-0 right-0 h-2 bg-transparent hover:bg-primary-500/50 cursor-row-resize z-20"
                          style={{
                            top: `${gridSplit.leftRow}%`,
                            transform: "translateY(-50%)",
                            touchAction: "none",
                          }}
                          onPointerDown={(e) => {
                            dragAxisRef.current = "leftRow";
                            e.preventDefault();
                            window.addEventListener(
                              "pointermove",
                              handleGridPointerMove,
                            );
                            window.addEventListener(
                              "pointerup",
                              handleGridPointerUp,
                            );
                          }}
                        />
                      </div>
                      <div
                        ref={rightColRef}
                        className="relative grid min-w-0"
                        style={{
                          gridTemplateRows: `${gridSplit.rightRow}% ${100 - gridSplit.rightRow}%`,
                          width: `${100 - gridSplit.col}%`,
                          minHeight: 0,
                        }}
                      >
                        <FilePanel side="right" />
                        <FilePanel side="bottomRight" />
                        <div
                          className="absolute left-0 right-0 h-2 bg-transparent hover:bg-primary-500/50 cursor-row-resize z-20"
                          style={{
                            top: `${gridSplit.rightRow}%`,
                            transform: "translateY(-50%)",
                            touchAction: "none",
                          }}
                          onPointerDown={(e) => {
                            dragAxisRef.current = "rightRow";
                            e.preventDefault();
                            window.addEventListener(
                              "pointermove",
                              handleGridPointerMove,
                            );
                            window.addEventListener(
                              "pointerup",
                              handleGridPointerUp,
                            );
                          }}
                        />
                      </div>
                      <div
                        className="absolute top-0 bottom-0 w-2 bg-transparent hover:bg-primary-500/50 cursor-col-resize z-30"
                        style={{
                          left: `${gridSplit.col}%`,
                          transform: "translateX(-50%)",
                          touchAction: "none",
                        }}
                        onPointerDown={(e) => {
                          dragAxisRef.current = "col";
                          e.preventDefault();
                          window.addEventListener(
                            "pointermove",
                            handleGridPointerMove,
                          );
                          window.addEventListener(
                            "pointerup",
                            handleGridPointerUp,
                          );
                        }}
                      />
                    </>
                  )}
                </motion.div>
              )}
              {activeView === "analyzer" && analyzerPath && (
                <motion.div
                  key="analyzer"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  className="absolute inset-0 z-40 bg-white dark:bg-slate-950"
                >
                  <DiskAnalyzer
                    path={analyzerPath}
                    onClose={() => setActiveView("explorer")}
                  />
                </motion.div>
              )}
              {activeView === "apps" && (
                <motion.div
                  key="apps"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex-1 min-w-0 overflow-hidden"
                >
                  <AppManager />
                </motion.div>
              )}
              {activeView === "network" && (
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
              {activeView === "booster" && (
                <motion.div
                  key="booster"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex-1"
                >
                  <BoosterPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      <AnimatePresence>
        {viewerData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100]"
          >
            <ImageViewer
              items={viewerData.items}
              startIndex={viewerData.index}
              onClose={() => setViewerData(null)}
            />
          </motion.div>
        )}

        {editingFile && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
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

      {showWorkspaceManager && (
        <WorkspaceManager onClose={() => setShowWorkspaceManager(false)} />
      )}

      <footer className="h-6 bg-primary-600 text-white flex items-center px-4 text-[10px] font-medium tracking-wide">
        <div className="flex items-center gap-4">
          <span>{searchQuery ? `Searching for: ${searchQuery}` : "Ready"}</span>
          <div className="h-3 w-[1px] bg-white/20" />
          <span>
            Items Selected:{" "}
            {useStore.getState().leftSelection.length +
              useStore.getState().rightSelection.length}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span>Win64 v1.0.0</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
