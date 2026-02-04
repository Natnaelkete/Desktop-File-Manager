import { create } from "zustand";

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: number;
  createdAt: number;
  error?: boolean;
  parentPath?: string;
}

export interface TabState {
  id: string;
  path: string;
  history: string[];
  historyIndex: number;
  files: FileItem[];
  loading: boolean;
}

export interface WorkspaceTask {
  id: string;
  text: string;
  done: boolean;
}

export interface WorkspaceSnapshotTab {
  id: string;
  path: string;
  history: string[];
  historyIndex: number;
}

export interface WorkspaceSnapshot {
  paneCount: 1 | 2 | 4;
  dualPane: boolean;
  activeLeftTabId: string;
  activeRightTabId: string;
  activeBottomLeftTabId: string;
  activeBottomRightTabId: string;
  leftTabs: WorkspaceSnapshotTab[];
  rightTabs: WorkspaceSnapshotTab[];
  bottomLeftTabs: WorkspaceSnapshotTab[];
  bottomRightTabs: WorkspaceSnapshotTab[];
  leftViewMode: "list" | "grid";
  rightViewMode: "list" | "grid";
  bottomLeftViewMode: "list" | "grid";
  bottomRightViewMode: "list" | "grid";
  leftGridSize: "small" | "medium" | "large" | "xl";
  rightGridSize: "small" | "medium" | "large" | "xl";
  bottomLeftGridSize: "small" | "medium" | "large" | "xl";
  bottomRightGridSize: "small" | "medium" | "large" | "xl";
  leftSortBy: "name" | "size" | "date" | "type";
  rightSortBy: "name" | "size" | "date" | "type";
  bottomLeftSortBy: "name" | "size" | "date" | "type";
  bottomRightSortBy: "name" | "size" | "date" | "type";
  leftSortOrder: "asc" | "desc";
  rightSortOrder: "asc" | "desc";
  bottomLeftSortOrder: "asc" | "desc";
  bottomRightSortOrder: "asc" | "desc";
  showHidden: boolean;
}

export interface WorkspaceState {
  id: string;
  name: string;
  createdAt: number;
  snapshot: WorkspaceSnapshot;
  notes: string;
  tasks: WorkspaceTask[];
}

const storageKey = "smartExplorer.workspaces";
const sessionKey = "smartExplorer.lastSession";

const loadWorkspaces = (): WorkspaceState[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as WorkspaceState[]) : [];
  } catch {
    return [];
  }
};

const persistWorkspaces = (workspaces: WorkspaceState[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(workspaces));
  } catch {
    // ignore storage errors
  }
};

const loadLastSession = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(sessionKey);
    return raw ? (JSON.parse(raw) as any) : null;
  } catch {
    return null;
  }
};

const persistLastSession = (state: AppState) => {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      paneCount: state.paneCount,
      dualPane: state.dualPane,
      activeLeftTabId: state.activeLeftTabId,
      activeRightTabId: state.activeRightTabId,
      activeBottomLeftTabId: state.activeBottomLeftTabId,
      activeBottomRightTabId: state.activeBottomRightTabId,
      leftTabs: state.leftTabs.map((t) => ({
        id: t.id,
        path: t.path,
        history: t.history,
        historyIndex: t.historyIndex,
      })),
      rightTabs: state.rightTabs.map((t) => ({
        id: t.id,
        path: t.path,
        history: t.history,
        historyIndex: t.historyIndex,
      })),
      bottomLeftTabs: state.bottomLeftTabs.map((t) => ({
        id: t.id,
        path: t.path,
        history: t.history,
        historyIndex: t.historyIndex,
      })),
      bottomRightTabs: state.bottomRightTabs.map((t) => ({
        id: t.id,
        path: t.path,
        history: t.history,
        historyIndex: t.historyIndex,
      })),
    };
    window.localStorage.setItem(sessionKey, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
};

type Side = "left" | "right" | "bottomLeft" | "bottomRight";
type TabsKey = "leftTabs" | "rightTabs" | "bottomLeftTabs" | "bottomRightTabs";
type ActiveKey =
  | "activeLeftTabId"
  | "activeRightTabId"
  | "activeBottomLeftTabId"
  | "activeBottomRightTabId";
type ViewModeKey =
  | "leftViewMode"
  | "rightViewMode"
  | "bottomLeftViewMode"
  | "bottomRightViewMode";
type SelectionKey =
  | "leftSelection"
  | "rightSelection"
  | "bottomLeftSelection"
  | "bottomRightSelection";
type GridSizeKey =
  | "leftGridSize"
  | "rightGridSize"
  | "bottomLeftGridSize"
  | "bottomRightGridSize";
type SortByKey =
  | "leftSortBy"
  | "rightSortBy"
  | "bottomLeftSortBy"
  | "bottomRightSortBy";
type SortOrderKey =
  | "leftSortOrder"
  | "rightSortOrder"
  | "bottomLeftSortOrder"
  | "bottomRightSortOrder";

const getSideKeys = (side: Side) => {
  switch (side) {
    case "left":
      return {
        tabsKey: "leftTabs" as TabsKey,
        activeKey: "activeLeftTabId" as ActiveKey,
        viewModeKey: "leftViewMode" as ViewModeKey,
        selectionKey: "leftSelection" as SelectionKey,
        gridSizeKey: "leftGridSize" as GridSizeKey,
        sortByKey: "leftSortBy" as SortByKey,
        sortOrderKey: "leftSortOrder" as SortOrderKey,
      };
    case "right":
      return {
        tabsKey: "rightTabs" as TabsKey,
        activeKey: "activeRightTabId" as ActiveKey,
        viewModeKey: "rightViewMode" as ViewModeKey,
        selectionKey: "rightSelection" as SelectionKey,
        gridSizeKey: "rightGridSize" as GridSizeKey,
        sortByKey: "rightSortBy" as SortByKey,
        sortOrderKey: "rightSortOrder" as SortOrderKey,
      };
    case "bottomLeft":
      return {
        tabsKey: "bottomLeftTabs" as TabsKey,
        activeKey: "activeBottomLeftTabId" as ActiveKey,
        viewModeKey: "bottomLeftViewMode" as ViewModeKey,
        selectionKey: "bottomLeftSelection" as SelectionKey,
        gridSizeKey: "bottomLeftGridSize" as GridSizeKey,
        sortByKey: "bottomLeftSortBy" as SortByKey,
        sortOrderKey: "bottomLeftSortOrder" as SortOrderKey,
      };
    case "bottomRight":
    default:
      return {
        tabsKey: "bottomRightTabs" as TabsKey,
        activeKey: "activeBottomRightTabId" as ActiveKey,
        viewModeKey: "bottomRightViewMode" as ViewModeKey,
        selectionKey: "bottomRightSelection" as SelectionKey,
        gridSizeKey: "bottomRightGridSize" as GridSizeKey,
        sortByKey: "bottomRightSortBy" as SortByKey,
        sortOrderKey: "bottomRightSortOrder" as SortOrderKey,
      };
  }
};

interface AppState {
  leftTabs: TabState[];
  rightTabs: TabState[];
  bottomLeftTabs: TabState[];
  bottomRightTabs: TabState[];

  activeLeftTabId: string;
  activeRightTabId: string;
  activeBottomLeftTabId: string;
  activeBottomRightTabId: string;

  theme: "light" | "dark";

  leftViewMode: "list" | "grid";
  rightViewMode: "list" | "grid";
  bottomLeftViewMode: "list" | "grid";
  bottomRightViewMode: "list" | "grid";

  leftSelection: string[];
  rightSelection: string[];
  bottomLeftSelection: string[];
  bottomRightSelection: string[];

  searchQuery: string;
  activeView: "explorer" | "analyzer" | "apps" | "network";
  activeSide: "left" | "right" | "bottomLeft" | "bottomRight";
  showHidden: boolean;
  paneCount: 1 | 2 | 4; // Replaces dualPane logic
  dualPane: boolean; // Keep for backward compat temporarily
  clipboard: { paths: string[]; type: "copy" | "cut" | null };
  workspaces: WorkspaceState[];
  activeWorkspaceId: string | null;

  // View Settings
  leftGridSize: "small" | "medium" | "large" | "xl";
  rightGridSize: "small" | "medium" | "large" | "xl";
  bottomLeftGridSize: "small" | "medium" | "large" | "xl";
  bottomRightGridSize: "small" | "medium" | "large" | "xl";

  leftSortBy: "name" | "size" | "date" | "type";
  rightSortBy: "name" | "size" | "date" | "type";
  bottomLeftSortBy: "name" | "size" | "date" | "type";
  bottomRightSortBy: "name" | "size" | "date" | "type";

  leftSortOrder: "asc" | "desc";
  rightSortOrder: "asc" | "desc";
  bottomLeftSortOrder: "asc" | "desc";
  bottomRightSortOrder: "asc" | "desc";

  // Persistence for App Manager
  installedApps: any[];
  uwpApps: any[];
  orphans: any[];

  // Actions
  setTheme: (theme: "light" | "dark") => void;
  setLeftViewMode: (mode: "list" | "grid") => void;
  setRightViewMode: (mode: "list" | "grid") => void;
  setViewMode: (
    side: "left" | "right" | "bottomLeft" | "bottomRight",
    mode: "list" | "grid",
  ) => void;
  setSelection: (
    side: "left" | "right" | "bottomLeft" | "bottomRight",
    selection: string[],
  ) => void;
  setSearchQuery: (query: string) => void;
  setActiveView: (view: "explorer" | "analyzer" | "apps" | "network") => void;
  setInstalledApps: (apps: any[]) => void;
  setUwpApps: (apps: any[]) => void;
  setOrphans: (orphans: any[]) => void;

  addTab: (
    side: "left" | "right" | "bottomLeft" | "bottomRight",
    path: string,
  ) => void;
  closeTab: (
    side: "left" | "right" | "bottomLeft" | "bottomRight",
    id: string,
  ) => void;
  setActiveTab: (
    side: "left" | "right" | "bottomLeft" | "bottomRight",
    id: string,
  ) => void;
  updateTabFiles: (
    side: "left" | "right" | "bottomLeft" | "bottomRight",
    id: string,
    files: FileItem[],
  ) => void;
  navigateTo: (
    side: "left" | "right" | "bottomLeft" | "bottomRight",
    id: string,
    path: string,
  ) => void;
  goBack: (
    side: "left" | "right" | "bottomLeft" | "bottomRight",
    id: string,
  ) => void;
  goForward: (
    side: "left" | "right" | "bottomLeft" | "bottomRight",
    id: string,
  ) => void;
  setActiveSide: (
    side: "left" | "right" | "bottomLeft" | "bottomRight",
  ) => void;
  toggleHidden: () => void;
  toggleDualPane: () => void; // Will verify
  toggleQuadPane: () => void; // New

  setGridSize: (
    side: "left" | "right" | "bottomLeft" | "bottomRight",
    size: "small" | "medium" | "large" | "xl",
  ) => void;
  setSortBy: (
    side: "left" | "right" | "bottomLeft" | "bottomRight",
    sortBy: "name" | "size" | "date" | "type",
  ) => void;
  setSortOrder: (
    side: "left" | "right" | "bottomLeft" | "bottomRight",
    order: "asc" | "desc",
  ) => void;
  moveTab: (
    fromSide: "left" | "right" | "bottomLeft" | "bottomRight",
    toSide: "left" | "right" | "bottomLeft" | "bottomRight",
    tabId: string,
  ) => void;
  copySelection: (
    side: "left" | "right" | "bottomLeft" | "bottomRight",
  ) => void;
  cutSelection: (side: "left" | "right" | "bottomLeft" | "bottomRight") => void;
  clearClipboard: () => void;
  saveWorkspace: (name: string) => void;
  loadWorkspace: (id: string) => void;
  deleteWorkspace: (id: string) => void;
  updateWorkspaceNotes: (id: string, notes: string) => void;
  addWorkspaceTask: (id: string, text: string) => void;
  toggleWorkspaceTask: (id: string, taskId: string) => void;
  removeWorkspaceTask: (id: string, taskId: string) => void;
}

const lastSession = loadLastSession();

const initTabs = (
  tabs: WorkspaceSnapshotTab[] | undefined,
  fallbackId: string,
) =>
  tabs && tabs.length > 0
    ? tabs.map((t) => ({
        id: t.id,
        path: t.path,
        history: t.history?.length ? t.history : [t.path],
        historyIndex: typeof t.historyIndex === "number" ? t.historyIndex : 0,
        files: [],
        loading: true,
      }))
    : [
        {
          id: fallbackId,
          path: "C:\\",
          history: ["C:\\"],
          historyIndex: 0,
          files: [],
          loading: false,
        },
      ];

export const useStore = create<AppState>((set, get) => ({
  leftTabs: initTabs(lastSession?.leftTabs, "l1"),
  rightTabs: initTabs(lastSession?.rightTabs, "r1"),
  bottomLeftTabs: initTabs(lastSession?.bottomLeftTabs, "bl1"),
  bottomRightTabs: initTabs(lastSession?.bottomRightTabs, "br1"),
  activeLeftTabId: lastSession?.activeLeftTabId || "l1",
  activeRightTabId: lastSession?.activeRightTabId || "r1",
  activeBottomLeftTabId: lastSession?.activeBottomLeftTabId || "bl1",
  activeBottomRightTabId: lastSession?.activeBottomRightTabId || "br1",
  theme: "dark",
  leftViewMode: "grid",
  rightViewMode: "grid",
  bottomLeftViewMode: "grid",
  bottomRightViewMode: "grid",
  leftSelection: [],
  rightSelection: [],
  bottomLeftSelection: [],
  bottomRightSelection: [],
  searchQuery: "",
  activeView: "explorer",
  installedApps: [],
  uwpApps: [],
  orphans: [],
  activeSide: "left",
  showHidden: false,
  dualPane: lastSession?.dualPane ?? true,
  paneCount: lastSession?.paneCount ?? 2,
  clipboard: { paths: [], type: null },
  workspaces: loadWorkspaces(),
  activeWorkspaceId: null,
  leftGridSize: "medium",
  rightGridSize: "medium",
  bottomLeftGridSize: "medium",
  bottomRightGridSize: "medium",
  leftSortBy: "name",
  rightSortBy: "name",
  bottomLeftSortBy: "name",
  bottomRightSortBy: "name",
  leftSortOrder: "asc",
  rightSortOrder: "asc",
  bottomLeftSortOrder: "asc",
  bottomRightSortOrder: "asc",

  setTheme: (theme) => set({ theme }),
  setLeftViewMode: (mode) => set({ leftViewMode: mode }),
  setRightViewMode: (mode) => set({ rightViewMode: mode }),
  setSelection: (side, selection) => {
    const { selectionKey } = getSideKeys(side);
    set({ [selectionKey]: selection } as any);
  },
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveView: (view) => set({ activeView: view }),
  setInstalledApps: (installedApps) => set({ installedApps }),
  setUwpApps: (uwpApps) => set({ uwpApps }),
  setOrphans: (orphans) => set({ orphans }),

  addTab: (side, path) =>
    set((state) => {
      const { tabsKey, activeKey } = getSideKeys(side);
      const id = `${side[0]}${Date.now()}`;
      const newTab = {
        id,
        path,
        history: [path],
        historyIndex: 0,
        files: [],
        loading: false,
      };
      const nextState = {
        ...state,
        [tabsKey]: [...(state[tabsKey] || []), newTab],
        [activeKey]: id,
      } as AppState;
      persistLastSession(nextState);
      return nextState as any;
    }),

  closeTab: (side, id) =>
    set((state) => {
      const { tabsKey, activeKey } = getSideKeys(side);
      const newTabs = state[tabsKey].filter((t) => t.id !== id);
      if (newTabs.length === 0) return {} as any;

      let newActiveId = state[activeKey];
      if (newActiveId === id) {
        newActiveId = newTabs[newTabs.length - 1].id;
      }

      const nextState = {
        ...state,
        [tabsKey]: newTabs,
        [activeKey]: newActiveId,
      } as AppState;
      persistLastSession(nextState);
      return nextState as any;
    }),

  setActiveTab: (side, id) => {
    const { activeKey } = getSideKeys(side);
    set((state) => {
      const nextState = { ...state, [activeKey]: id } as AppState;
      persistLastSession(nextState);
      return nextState as any;
    });
  },

  updateTabFiles: (side, id, files) =>
    set((state) => {
      const { tabsKey } = getSideKeys(side);
      return {
        [tabsKey]: state[tabsKey].map((t) =>
          t.id === id ? { ...t, files, loading: false } : t,
        ),
      } as any;
    }),

  navigateTo: (side, id, path) =>
    set((state) => {
      const { tabsKey } = getSideKeys(side);

      const targetTab = state[tabsKey].find((t) => t.id === id);
      // If already on this path, do nothing
      if (targetTab && targetTab.path === path) return {} as any;

      const nextTabs = state[tabsKey].map((t) => {
        if (t.id === id) {
          const newHistory = t.history.slice(0, t.historyIndex + 1);
          newHistory.push(path);
          return {
            ...t,
            path,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            loading: true,
            files: [],
          };
        }
        return t;
      });

      const nextState = { ...state, [tabsKey]: nextTabs } as AppState;
      persistLastSession(nextState);
      return nextState as any;
    }),

  goBack: (side, id) =>
    set((state) => {
      const { tabsKey } = getSideKeys(side);
      const nextTabs = state[tabsKey].map((t) => {
        if (t.id === id && t.historyIndex > 0) {
          const newIndex = t.historyIndex - 1;
          return {
            ...t,
            path: t.history[newIndex],
            historyIndex: newIndex,
            loading: true,
            files: [],
          };
        }
        return t;
      });

      const nextState = { ...state, [tabsKey]: nextTabs } as AppState;
      persistLastSession(nextState);
      return nextState as any;
    }),

  goForward: (side, id) =>
    set((state) => {
      const { tabsKey } = getSideKeys(side);
      const nextTabs = state[tabsKey].map((t) => {
        if (t.id === id && t.historyIndex < t.history.length - 1) {
          const newIndex = t.historyIndex + 1;
          return {
            ...t,
            path: t.history[newIndex],
            historyIndex: newIndex,
            loading: true,
            files: [],
          };
        }
        return t;
      });

      const nextState = { ...state, [tabsKey]: nextTabs } as AppState;
      persistLastSession(nextState);
      return nextState as any;
    }),

  setActiveSide: (side) => set({ activeSide: side }),

  toggleHidden: () => set((state: any) => ({ showHidden: !state.showHidden })),

  toggleDualPane: () =>
    set((state: any) => ({
      dualPane: !state.dualPane,
      paneCount: state.dualPane ? 1 : 2,
    })),

  toggleQuadPane: () =>
    set((state: any) => ({
      paneCount: state.paneCount === 4 ? 2 : 4,
      dualPane: true,
    })),

  setViewMode: (side, mode) => {
    const { viewModeKey } = getSideKeys(side);
    set({ [viewModeKey]: mode } as any);
  },

  setGridSize: (side, size) => {
    const { gridSizeKey } = getSideKeys(side);
    set({ [gridSizeKey]: size } as any);
  },
  setSortBy: (side, sortBy) => {
    const { sortByKey } = getSideKeys(side);
    set({ [sortByKey]: sortBy } as any);
  },
  setSortOrder: (side, order) => {
    const { sortOrderKey } = getSideKeys(side);
    set({ [sortOrderKey]: order } as any);
  },

  moveTab: (fromSide, toSide, tabId) =>
    set((state: any) => {
      if (fromSide === toSide) return {};

      const { tabsKey: fromTabsKey, activeKey: fromActiveKey } =
        getSideKeys(fromSide);
      const { tabsKey: toTabsKey, activeKey: toActiveKey } =
        getSideKeys(toSide);

      const fromTabs = state[fromTabsKey] as TabState[];
      const toTabs = state[toTabsKey] as TabState[];
      const tabToMove = fromTabs.find((t) => t.id === tabId);

      if (!tabToMove) return {};

      const newFromTabs = fromTabs.filter((t) => t.id !== tabId);
      if (newFromTabs.length === 0) return {};

      const newToTabs = [...toTabs, tabToMove];

      let newFromActive = state[fromActiveKey];
      if (newFromActive === tabId) {
        newFromActive = newFromTabs[newFromTabs.length - 1].id;
      }

      const nextState = {
        ...state,
        [fromTabsKey]: newFromTabs,
        [fromActiveKey]: newFromActive,
        [toTabsKey]: newToTabs,
        [toActiveKey]: tabId,
      } as AppState;
      persistLastSession(nextState);
      return nextState as any;
    }),

  copySelection: (side) =>
    set((state: any) => {
      const { selectionKey } = getSideKeys(side);
      return {
        clipboard: {
          paths: state[selectionKey],
          type: "copy",
        },
      };
    }),

  cutSelection: (side) =>
    set((state: any) => {
      const { selectionKey } = getSideKeys(side);
      return {
        clipboard: {
          paths: state[selectionKey],
          type: "cut",
        },
      };
    }),

  clearClipboard: () => set({ clipboard: { paths: [], type: null } }),

  saveWorkspace: (name) =>
    set((state) => {
      const snapshot: WorkspaceSnapshot = {
        paneCount: state.paneCount,
        dualPane: state.dualPane,
        activeLeftTabId: state.activeLeftTabId,
        activeRightTabId: state.activeRightTabId,
        activeBottomLeftTabId: state.activeBottomLeftTabId,
        activeBottomRightTabId: state.activeBottomRightTabId,
        leftTabs: state.leftTabs.map((t) => ({
          id: t.id,
          path: t.path,
          history: t.history,
          historyIndex: t.historyIndex,
        })),
        rightTabs: state.rightTabs.map((t) => ({
          id: t.id,
          path: t.path,
          history: t.history,
          historyIndex: t.historyIndex,
        })),
        bottomLeftTabs: state.bottomLeftTabs.map((t) => ({
          id: t.id,
          path: t.path,
          history: t.history,
          historyIndex: t.historyIndex,
        })),
        bottomRightTabs: state.bottomRightTabs.map((t) => ({
          id: t.id,
          path: t.path,
          history: t.history,
          historyIndex: t.historyIndex,
        })),
        leftViewMode: state.leftViewMode,
        rightViewMode: state.rightViewMode,
        bottomLeftViewMode: state.bottomLeftViewMode,
        bottomRightViewMode: state.bottomRightViewMode,
        leftGridSize: state.leftGridSize,
        rightGridSize: state.rightGridSize,
        bottomLeftGridSize: state.bottomLeftGridSize,
        bottomRightGridSize: state.bottomRightGridSize,
        leftSortBy: state.leftSortBy,
        rightSortBy: state.rightSortBy,
        bottomLeftSortBy: state.bottomLeftSortBy,
        bottomRightSortBy: state.bottomRightSortBy,
        leftSortOrder: state.leftSortOrder,
        rightSortOrder: state.rightSortOrder,
        bottomLeftSortOrder: state.bottomLeftSortOrder,
        bottomRightSortOrder: state.bottomRightSortOrder,
        showHidden: state.showHidden,
      };

      const workspace: WorkspaceState = {
        id: `ws_${Date.now()}`,
        name: name.trim() || "Untitled Workspace",
        createdAt: Date.now(),
        snapshot,
        notes: "",
        tasks: [],
      };

      const workspaces = [workspace, ...state.workspaces];
      persistWorkspaces(workspaces);

      return {
        workspaces,
        activeWorkspaceId: workspace.id,
      } as any;
    }),

  loadWorkspace: (id) =>
    set((state) => {
      const workspace = state.workspaces.find((w) => w.id === id);
      if (!workspace) return {} as any;

      const s = workspace.snapshot;
      const makeTabs = (tabs: WorkspaceSnapshotTab[]) =>
        tabs.map((t) => ({
          id: t.id,
          path: t.path,
          history: t.history,
          historyIndex: t.historyIndex,
          files: [],
          loading: true,
        }));

      const nextState: AppState = {
        ...state,
        paneCount: s.paneCount,
        dualPane: s.dualPane,
        activeLeftTabId: s.activeLeftTabId,
        activeRightTabId: s.activeRightTabId,
        activeBottomLeftTabId: s.activeBottomLeftTabId,
        activeBottomRightTabId: s.activeBottomRightTabId,
        leftTabs: makeTabs(s.leftTabs),
        rightTabs: makeTabs(s.rightTabs),
        bottomLeftTabs: makeTabs(s.bottomLeftTabs),
        bottomRightTabs: makeTabs(s.bottomRightTabs),
        leftViewMode: s.leftViewMode,
        rightViewMode: s.rightViewMode,
        bottomLeftViewMode: s.bottomLeftViewMode,
        bottomRightViewMode: s.bottomRightViewMode,
        leftGridSize: s.leftGridSize,
        rightGridSize: s.rightGridSize,
        bottomLeftGridSize: s.bottomLeftGridSize,
        bottomRightGridSize: s.bottomRightGridSize,
        leftSortBy: s.leftSortBy,
        rightSortBy: s.rightSortBy,
        bottomLeftSortBy: s.bottomLeftSortBy,
        bottomRightSortBy: s.bottomRightSortBy,
        leftSortOrder: s.leftSortOrder,
        rightSortOrder: s.rightSortOrder,
        bottomLeftSortOrder: s.bottomLeftSortOrder,
        bottomRightSortOrder: s.bottomRightSortOrder,
        showHidden: s.showHidden,
        activeView: "explorer",
        activeSide: "left",
        activeWorkspaceId: workspace.id,
      };

      persistLastSession(nextState);
      return nextState as any;
    }),

  deleteWorkspace: (id) =>
    set((state) => {
      const workspaces = state.workspaces.filter((w) => w.id !== id);
      persistWorkspaces(workspaces);
      return {
        workspaces,
        activeWorkspaceId:
          state.activeWorkspaceId === id ? null : state.activeWorkspaceId,
      } as any;
    }),

  updateWorkspaceNotes: (id, notes) =>
    set((state) => {
      const workspaces = state.workspaces.map((w) =>
        w.id === id ? { ...w, notes } : w,
      );
      persistWorkspaces(workspaces);
      return { workspaces } as any;
    }),

  addWorkspaceTask: (id, text) =>
    set((state) => {
      const workspaces = state.workspaces.map((w) =>
        w.id === id
          ? {
              ...w,
              tasks: [
                ...w.tasks,
                { id: `task_${Date.now()}`, text, done: false },
              ],
            }
          : w,
      );
      persistWorkspaces(workspaces);
      return { workspaces } as any;
    }),

  toggleWorkspaceTask: (id, taskId) =>
    set((state) => {
      const workspaces = state.workspaces.map((w) =>
        w.id === id
          ? {
              ...w,
              tasks: w.tasks.map((t) =>
                t.id === taskId ? { ...t, done: !t.done } : t,
              ),
            }
          : w,
      );
      persistWorkspaces(workspaces);
      return { workspaces } as any;
    }),

  removeWorkspaceTask: (id, taskId) =>
    set((state) => {
      const workspaces = state.workspaces.map((w) =>
        w.id === id
          ? { ...w, tasks: w.tasks.filter((t) => t.id !== taskId) }
          : w,
      );
      persistWorkspaces(workspaces);
      return { workspaces } as any;
    }),
}));
