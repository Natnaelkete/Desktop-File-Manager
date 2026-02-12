import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./components/Sidebar";
import WorkspaceManager from "./components/WorkspaceManager";
import FilePanel from "./components/FilePanel";
import DiskAnalyzer from "./components/DiskAnalyzer";
import ImageViewer from "./components/ImageViewer";
import TextEditor from "./components/TextEditor";
import AppManager from "./components/AppManager";
import BoosterPanel from "./components/BoosterPanel";
import SettingsPanel from "./components/SettingsPanel";
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
  File,
  Folder as FolderIcon,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";
import hotkeys from "hotkeys-js";
import { FixedSizeList as List } from "react-window";
import { AutoSizer } from "react-virtualized-auto-sizer";

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
    searchResults,
    setSearchResults,
    appendSearchResults,
    isSearching,
    setIsSearching,
    navigateTo,
    leftTabs,
    rightTabs,
  } = useStore();
  const currentSearchIdRef = useRef<string | null>(null);
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

  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [visibleLimit, setVisibleLimit] = useState(100);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 200) {
      setVisibleLimit((prev) => Math.min(prev + 100, searchResults.length));
    }
  };

  // Deep search logic
  useEffect(() => {
    // Listen for streaming updates
    const removeListener = (window as any).electronAPI.onDeepSearchUpdate(
      (data: any) => {
        if (data.searchId !== currentSearchIdRef.current) return;

        if (data.results && data.results.length > 0) {
          appendSearchResults(data.results);
          // If we're at the bottom, auto-expand visible limit to show new results
          setVisibleLimit((prev) => {
            if (prev < 100) return 100;
            return prev;
          });
        }
        if (data.isComplete) {
          setIsSearching(false);
        }
      },
    );

    return () => {
      if (typeof removeListener === "function") removeListener();
    };
  }, [appendSearchResults, setIsSearching]);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setIsSearching(false);
      currentSearchIdRef.current = null;
      setVisibleLimit(100);
      return;
    }

    setShowSearchDropdown(true);
    const timer = setTimeout(async () => {
      const searchId = Date.now().toString();
      currentSearchIdRef.current = searchId;

      setIsSearching(true);
      setSearchResults([]); // Clear old results
      setVisibleLimit(100); // Reset limit
      setSelectedIndex(-1);

      // Trigger search - results will come via onDeepSearchUpdate
      await (window as any).electronAPI.deepSearch(searchQuery, searchId);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, setSearchResults, setIsSearching]);

  // Click outside search
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(e.target as Node) &&
        !(e.target instanceof HTMLInputElement)
      ) {
        setShowSearchDropdown(false);
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearchResultClick = async (result: any) => {
    setActiveView("explorer");
    const activeTabId =
      activeSide === "left" ? activeLeftTabId : activeRightTabId;
    // For navigation, we usually want to go to the parent folder and select the file
    // but the navigateTo currently takes a folder path.
    // If it's a directory, go there. If it's a file, go to its parent.
    const targetPath = result.isDirectory
      ? result.path
      : await (window as any).electronAPI.pathDirname(result.path);
    navigateTo(activeSide, activeTabId, targetPath, result.path);
    setShowSearchDropdown(false);
    setSearchQuery("");
  };

  useEffect(() => {
    // Disable hotkeys library in inputs to allow native Electron shortcuts (Ctrl+C, Ctrl+V, etc.)
    hotkeys.filter = function (event) {
      const target = (event.target || event.srcElement) as HTMLElement;
      const tagName = target.tagName;
      // If we are in an input or textarea, don't trigger hotkeys library logic
      return !(
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        target.isContentEditable
      );
    };

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement;

      // Handle Manual Shortcuts for Copy/Paste/etc. to bypass native issues
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        let action: string | null = null;

        if (key === "c") action = "copy";
        else if (key === "v") action = "paste";
        else if (key === "x") action = "cut";
        else if (key === "a") action = "selectAll";
        else if (key === "z") action = "undo";
        else if (key === "y") action = "redo";

        if (action) {
          // If we are in an input, we want to perform the action
          if (isInput) {
            // No e.preventDefault() here because we want the native action to also try to trigger
            // but we call the IPC action as a backup/guarantee
            (window as any).electronAPI.editAction(action);
          }
        }
      }

      // Prevent back navigation when typing in input fields
      if (isInput) {
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
    hotkeys("ctrl+5", () => setActiveView("booster"));
    hotkeys("ctrl+6", () => setActiveView("settings"));
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
                placeholder="Deep search files"
                value={searchQuery}
                onFocus={() => setShowSearchDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    setSelectedIndex((prev) =>
                      Math.min(prev + 1, searchResults.length - 1),
                    );
                  } else if (e.key === "ArrowUp") {
                    setSelectedIndex((prev) => Math.max(prev - 1, 0));
                  } else if (e.key === "Enter" && selectedIndex >= 0) {
                    handleSearchResultClick(searchResults[selectedIndex]);
                  } else if (e.key === "Escape") {
                    setShowSearchDropdown(false);
                  }
                }}
                onContextMenu={(e) => {
                  e.stopPropagation();
                  (window as any).electronAPI.showContextMenu();
                }}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500 transition-all outline-none"
              />

              <AnimatePresence>
                {showSearchDropdown && searchQuery.length >= 2 && (
                  <motion.div
                    ref={searchDropdownRef}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-[100]"
                  >
                    <div className="h-[400px]">
                      {isSearching && searchResults.length === 0 ? (
                        <div className="flex items-center justify-center h-full gap-3 text-slate-500">
                          <Loader2 className="animate-spin" size={18} />
                          <span className="text-sm font-medium">
                            Searching deep...
                          </span>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div
                          className="h-[400px] overflow-y-auto scrollbar-hide"
                          onScroll={handleScroll}
                        >
                          {searchResults
                            .slice(0, visibleLimit)
                            .map((result, index) => (
                              <div
                                key={result.path}
                                onClick={() => handleSearchResultClick(result)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={clsx(
                                  "px-3 py-2 flex items-center gap-4 cursor-pointer group border-b border-slate-100 dark:border-slate-800 last:border-0",
                                  selectedIndex === index
                                    ? "bg-primary-500 text-white"
                                    : "hover:bg-slate-100 dark:hover:bg-slate-800",
                                )}
                              >
                                <div className="flex items-center gap-3 w-full">
                                  {result.isDirectory ? (
                                    <FolderIcon
                                      size={18}
                                      className={
                                        selectedIndex === index
                                          ? "text-white"
                                          : "text-amber-500"
                                      }
                                    />
                                  ) : (
                                    <File
                                      size={18}
                                      className={
                                        selectedIndex === index
                                          ? "text-white"
                                          : "text-slate-400"
                                      }
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold truncate">
                                      {result.name}
                                    </div>
                                    <div
                                      className={clsx(
                                        "text-[10px] truncate opacity-60",
                                        selectedIndex === index
                                          ? "text-white"
                                          : "text-slate-500",
                                      )}
                                    >
                                      {result.path}
                                    </div>
                                  </div>
                                  <ChevronRight
                                    size={14}
                                    className="opacity-0 group-hover:opacity-100"
                                  />
                                </div>
                              </div>
                            ))}
                          {visibleLimit < searchResults.length && (
                            <div className="py-2 text-center text-xs text-slate-400">
                              Loading more...
                            </div>
                          )}
                        </div>
                      ) : !isSearching ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
                          <div className="text-sm">
                            No results found for "{searchQuery}"
                          </div>
                          <div className="text-[10px] mt-1">
                            Deep search covers Desktop, Documents and Drives.
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full gap-3 text-slate-500">
                          <Loader2 className="animate-spin" size={18} />
                          <span className="text-sm font-medium">
                            Found {searchResults.length} results...
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
            <button
              onClick={() => setActiveView("settings")}
              className={clsx(
                "p-2 rounded-lg transition-colors",
                activeView === "settings"
                  ? "bg-primary-500 text-white"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500",
              )}
            >
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
              {activeView === "settings" && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex-1"
                >
                  <SettingsPanel />
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
