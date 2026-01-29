"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  listDir: (path) => electron.ipcRenderer.invoke("list-dir", path),
  getDrives: () => electron.ipcRenderer.invoke("get-drives"),
  deleteItems: (paths) => electron.ipcRenderer.invoke("delete-items", paths),
  renameItem: (oldPath, newPath) => electron.ipcRenderer.invoke("rename-item", oldPath, newPath),
  createFolder: (path) => electron.ipcRenderer.invoke("create-folder", path),
  openPath: (path) => electron.ipcRenderer.invoke("open-path", path),
  searchFiles: (dirPath, query) => electron.ipcRenderer.invoke("search-files", dirPath, query),
  getFileHash: (filePath, algorithm) => electron.ipcRenderer.invoke("get-file-hash", filePath, algorithm),
  getAdvancedStats: (path) => electron.ipcRenderer.invoke("get-advanced-stats", path),
  getDuplicatesPaginated: (page, pageSize) => electron.ipcRenderer.invoke("get-duplicates-paginated", page, pageSize),
  unzip: (filePath, targetDir) => electron.ipcRenderer.invoke("unzip", filePath, targetDir),
  batchRename: (paths, pattern, replacement) => electron.ipcRenderer.invoke("batch-rename", paths, pattern, replacement),
  readFile: (path) => electron.ipcRenderer.invoke("read-file", path),
  writeFile: (path, content) => electron.ipcRenderer.invoke("write-file", path, content),
  revealInExplorer: (path) => electron.ipcRenderer.invoke("reveal-in-explorer", path),
  deleteFilesBulk: (paths) => electron.ipcRenderer.invoke("delete-files-bulk", paths),
  getInstalledApps: () => electron.ipcRenderer.invoke("get-installed-apps"),
  runUninstaller: (uninstallString) => electron.ipcRenderer.invoke("run-uninstaller", uninstallString),
  findAppLeftovers: (appName, installLocation) => electron.ipcRenderer.invoke("find-app-leftovers", appName, installLocation),
  getUWPApps: () => electron.ipcRenderer.invoke("get-uwp-apps"),
  uninstallUWPApp: (packageFullName) => electron.ipcRenderer.invoke("uninstall-uwp-app", packageFullName),
  forceUninstall: (appName, installLocation) => electron.ipcRenderer.invoke("force-uninstall", appName, installLocation),
  findOrphanLeftovers: () => electron.ipcRenderer.invoke("find-orphan-leftovers"),
  getUserPaths: () => electron.ipcRenderer.invoke("get-user-paths"),
  getLibraryFiles: (type) => electron.ipcRenderer.invoke("get-library-files", type),
  getFileIcon: (path) => electron.ipcRenderer.invoke("get-file-icon", path),
  copyItems: (sourcePaths, destDir) => electron.ipcRenderer.invoke("copy-items", sourcePaths, destDir),
  moveItems: (sourcePaths, destDir) => electron.ipcRenderer.invoke("move-items", sourcePaths, destDir),
  onMainMessage: (callback) => electron.ipcRenderer.on("main-process-message", (_event, value) => callback(value))
});
console.log("Preload script loaded with advanced stats support");
