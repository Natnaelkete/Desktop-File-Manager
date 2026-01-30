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

const getSideKeys = (side: "left" | "right" | "bottomLeft" | "bottomRight") => {
  const capitalized = side.charAt(0).toUpperCase() + side.slice(1);
  return {
    tabsKey: `${side}Tabs` as keyof AppState,
    activeKey: `active${capitalized}TabId` as keyof AppState,
    viewModeKey: `${side}ViewMode` as keyof AppState,
    selectionKey: `${side}Selection` as keyof AppState,
    gridSizeKey: `${side}GridSize` as keyof AppState,
    sortByKey: `${side}SortBy` as keyof AppState,
    sortOrderKey: `${side}SortOrder` as keyof AppState,
  };
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
  setViewMode: (side: "left" | "right" | "bottomLeft" | "bottomRight", mode: "list" | "grid") => void;
  setSelection: (side: "left" | "right" | "bottomLeft" | "bottomRight", selection: string[]) => void;
  setSearchQuery: (query: string) => void;
  setActiveView: (view: "explorer" | "analyzer" | "apps" | "network") => void;
  setInstalledApps: (apps: any[]) => void;
  setUwpApps: (apps: any[]) => void;
  setOrphans: (orphans: any[]) => void;
  
  addTab: (side: "left" | "right" | "bottomLeft" | "bottomRight", path: string) => void;
  closeTab: (side: "left" | "right" | "bottomLeft" | "bottomRight", id: string) => void;
  setActiveTab: (side: "left" | "right" | "bottomLeft" | "bottomRight", id: string) => void;
  updateTabFiles: (
    side: "left" | "right" | "bottomLeft" | "bottomRight",
    id: string,
    files: FileItem[],
  ) => void;
  navigateTo: (side: "left" | "right" | "bottomLeft" | "bottomRight", id: string, path: string) => void;
  goBack: (side: "left" | "right" | "bottomLeft" | "bottomRight", id: string) => void;
  goForward: (side: "left" | "right" | "bottomLeft" | "bottomRight", id: string) => void;
  setActiveSide: (side: "left" | "right" | "bottomLeft" | "bottomRight") => void;
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
  setSortOrder: (side: "left" | "right" | "bottomLeft" | "bottomRight", order: "asc" | "desc") => void;
  moveTab: (
    fromSide: "left" | "right" | "bottomLeft" | "bottomRight",
    toSide: "left" | "right" | "bottomLeft" | "bottomRight",
    tabId: string,
  ) => void;
  copySelection: (side: "left" | "right" | "bottomLeft" | "bottomRight") => void;
  cutSelection: (side: "left" | "right" | "bottomLeft" | "bottomRight") => void;
  clearClipboard: () => void;
}

export const useStore = create<AppState>((set) => ({
  leftTabs: [
    {
      id: "l1",
      path: "C:\\",
      history: ["C:\\"],
      historyIndex: 0,
      files: [],
      loading: false,
    },
  ],
  rightTabs: [
    {
      id: "r1",
      path: "C:\\",
      history: ["C:\\"],
      historyIndex: 0,
      files: [],
      loading: false,
    },
  ],
  bottomLeftTabs: [
    {
      id: "bl1",
      path: "C:\\",
      history: ["C:\\"],
      historyIndex: 0,
      files: [],
      loading: false,
    },
  ],
  bottomRightTabs: [
    {
      id: "br1",
      path: "C:\\",
      history: ["C:\\"],
      historyIndex: 0,
      files: [],
      loading: false,
    },
  ],
  activeLeftTabId: "l1",
  activeRightTabId: "r1",
  activeBottomLeftTabId: "bl1",
  activeBottomRightTabId: "br1",
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
  dualPane: true,
  paneCount: 2,
  clipboard: { paths: [], type: null },
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
      return { 
        [tabsKey]: [...(state[tabsKey] || []), newTab], 
        [activeKey]: id 
      } as any;
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

      return { [tabsKey]: newTabs, [activeKey]: newActiveId } as any;
    }),

  setActiveTab: (side, id) => {
    const { activeKey } = getSideKeys(side);
    set({ [activeKey]: id } as any);
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

      return {
        [tabsKey]: state[tabsKey].map((t) => {
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
        }),
      };
    }),

  goBack: (side, id) =>
    set((state) => {
      const { tabsKey } = getSideKeys(side);
      return {
        [tabsKey]: state[tabsKey].map((t) => {
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
        }),
      };
    }),

  goForward: (side, id) =>
    set((state) => {
      const { tabsKey } = getSideKeys(side);
      return {
        [tabsKey]: state[tabsKey].map((t) => {
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
        }),
      };
    }),

  setActiveSide: (side) => set({ activeSide: side }),

  toggleHidden: () => set((state: any) => ({ showHidden: !state.showHidden })),

  toggleDualPane: () => set((state: any) => ({ 
    dualPane: !state.dualPane,
    paneCount: state.dualPane ? 1 : 2
  })),

  toggleQuadPane: () => set((state: any) => ({ 
    paneCount: state.paneCount === 4 ? 2 : 4,
    dualPane: true
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

      return {
        [fromTabsKey]: newFromTabs,
        [fromActiveKey]: newFromActive,
        [toTabsKey]: newToTabs,
        [toActiveKey]: tabId,
      } as any;
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
}));
