import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  listDir: (path: string) => ipcRenderer.invoke("list-dir", path),
  getDrives: (forceRefresh?: boolean) => ipcRenderer.invoke("get-drives", forceRefresh),
  onDrivesChanged: (callback: () => void) => {
    const subscription = (_event: any) => callback();
    ipcRenderer.on("drives-changed", subscription);
    return () => ipcRenderer.removeListener("drives-changed", subscription);
  },
  deleteItems: (paths: string[]) => ipcRenderer.invoke("delete-items", paths),
  deleteItemsPermanently: (paths: string[]) =>
    ipcRenderer.invoke("delete-items-permanently", paths),
  renameItem: (oldPath: string, newPath: string) =>
    ipcRenderer.invoke("rename-item", oldPath, newPath),
  createFolder: (path: string) => ipcRenderer.invoke("create-folder", path),
  openPath: (path: string) => ipcRenderer.invoke("open-path", path),
  openWith: (path: string) => ipcRenderer.invoke("open-with", path),
  getOpenWithApps: (path: string) =>
    ipcRenderer.invoke("get-open-with-apps", path),
  openWithApp: (appPath: string, path: string) =>
    ipcRenderer.invoke("open-with-app", appPath, path),
  openTerminal: (path: string) => ipcRenderer.invoke("open-terminal", path),
  quickAction: (action: string, payload: any) =>
    ipcRenderer.invoke("quick-action", action, payload),
  searchFiles: (dirPath: string, query: string) =>
    ipcRenderer.invoke("search-files", dirPath, query),
  getFileHash: (filePath: string, algorithm: string) =>
    ipcRenderer.invoke("get-file-hash", filePath, algorithm),
  getAdvancedStats: (path: string) =>
    ipcRenderer.invoke("get-advanced-stats", path),
  getDuplicatesPaginated: (page: number, pageSize: number) =>
    ipcRenderer.invoke("get-duplicates-paginated", page, pageSize),
  unzip: (filePath: string, targetDir: string) =>
    ipcRenderer.invoke("unzip", filePath, targetDir),
  batchRename: (paths: string[], pattern: string, replacement: string) =>
    ipcRenderer.invoke("batch-rename", paths, pattern, replacement),
  readFile: (path: string) => ipcRenderer.invoke("read-file", path),
  writeFile: (path: string, content: string) =>
    ipcRenderer.invoke("write-file", path, content),
  revealInExplorer: (path: string) =>
    ipcRenderer.invoke("reveal-in-explorer", path),
  deleteFilesBulk: (paths: string[]) =>
    ipcRenderer.invoke("delete-files-bulk", paths),
  lockFolderOs: (path: string, options?: { hide?: boolean; deny?: boolean }) =>
    ipcRenderer.invoke("lock-folder-os", path, options),
  unlockFolderOs: (
    path: string,
    options?: { hide?: boolean; deny?: boolean },
  ) => ipcRenderer.invoke("unlock-folder-os", path, options),
  getDriverReport: () => ipcRenderer.invoke("get-driver-report"),
  getStartupItems: () => ipcRenderer.invoke("get-startup-items"),
  disableStartupItem: (item: any) =>
    ipcRenderer.invoke("disable-startup-item", item),
  getProcessList: () => ipcRenderer.invoke("get-process-list"),
  killProcess: (pid: number) => ipcRenderer.invoke("kill-process", pid),
  cleanTemp: () => ipcRenderer.invoke("clean-temp"),
  openWindowsUpdate: () => ipcRenderer.invoke("open-windows-update"),
  openStartupSettings: () => ipcRenderer.invoke("open-startup-settings"),
  getInstalledApps: (options?: { force?: boolean }) =>
    ipcRenderer.invoke("get-installed-apps", options),
  runUninstaller: (uninstallString: string) =>
    ipcRenderer.invoke("run-uninstaller", uninstallString),
  findAppLeftovers: (appName: string, installLocation?: string) =>
    ipcRenderer.invoke("find-app-leftovers", appName, installLocation),
  getUWPApps: () => ipcRenderer.invoke("get-uwp-apps"),
  uninstallUWPApp: (packageFullName: string) =>
    ipcRenderer.invoke("uninstall-uwp-app", packageFullName),
  forceUninstall: (appName: string, installLocation?: string) =>
    ipcRenderer.invoke("force-uninstall", appName, installLocation),
  findOrphanLeftovers: () => ipcRenderer.invoke("find-orphan-leftovers"),
  getUserPaths: () => ipcRenderer.invoke("get-user-paths"),
  getLibraryFiles: (type: string) =>
    ipcRenderer.invoke("get-library-files", type),
  getFileIcon: (path: string) => ipcRenderer.invoke("get-file-icon", path),
  copyItems: (sourcePaths: string[], destDir: string) =>
    ipcRenderer.invoke("copy-items", sourcePaths, destDir),
  moveItems: (sourcePaths: string[], destDir: string) =>
    ipcRenderer.invoke("move-items", sourcePaths, destDir),
  configureDiskCleanup: () => ipcRenderer.invoke("configure-disk-cleanup"),
  deepSearch: (query: string, searchId: string) => ipcRenderer.invoke("deep-search", query, searchId),
  pathDirname: (path: string) => ipcRenderer.invoke("path-dirname", path),
  onDeepSearchUpdate: (callback: any) => {
    const subscription = (_event: any, value: any) => callback(value);
    ipcRenderer.on("deep-search-update", subscription);
    return () => ipcRenderer.removeListener("deep-search-update", subscription);
  },
  showContextMenu: () => ipcRenderer.send("show-context-menu"),
  editAction: (action: string) => ipcRenderer.send("edit-action", action),
  onMainMessage: (callback: any) =>
    ipcRenderer.on("main-process-message", (_event, value) => callback(value)),
  
  // Auto Updater
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  quitAndInstall: () => ipcRenderer.invoke("quit-and-install"),
  onUpdateStatus: (callback: (status: any) => void) => {
    const subscription = (_event: any, value: any) => callback(value);
    ipcRenderer.on("update-status", subscription);
    return () => ipcRenderer.removeListener("update-status", subscription);
  },
});

console.log("Preload script loaded with advanced stats support");
