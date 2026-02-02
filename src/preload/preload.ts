import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  listDir: (path: string) => ipcRenderer.invoke("list-dir", path),
  getDrives: () => ipcRenderer.invoke("get-drives"),
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
  onMainMessage: (callback: any) =>
    ipcRenderer.on("main-process-message", (_event, value) => callback(value)),
});

console.log("Preload script loaded with advanced stats support");
