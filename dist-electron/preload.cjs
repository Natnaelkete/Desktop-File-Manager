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
  getDirStats: (path) => electron.ipcRenderer.invoke("get-dir-stats", path),
  unzip: (filePath, targetDir) => electron.ipcRenderer.invoke("unzip", filePath, targetDir),
  batchRename: (paths, pattern, replacement) => electron.ipcRenderer.invoke("batch-rename", paths, pattern, replacement),
  readFile: (path) => electron.ipcRenderer.invoke("read-file", path),
  writeFile: (path, content) => electron.ipcRenderer.invoke("write-file", path, content),
  onMainMessage: (callback) => electron.ipcRenderer.on("main-process-message", (_event, value) => callback(value))
});
