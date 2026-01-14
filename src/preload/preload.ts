import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  listDir: (path: string) => ipcRenderer.invoke('list-dir', path),
  getDrives: () => ipcRenderer.invoke('get-drives'),
  deleteItems: (paths: string[]) => ipcRenderer.invoke('delete-items', paths),
  renameItem: (oldPath: string, newPath: string) => ipcRenderer.invoke('rename-item', oldPath, newPath),
  createFolder: (path: string) => ipcRenderer.invoke('create-folder', path),
  openPath: (path: string) => ipcRenderer.invoke('open-path', path),
  searchFiles: (dirPath: string, query: string) => ipcRenderer.invoke('search-files', dirPath, query),
  getFileHash: (filePath: string, algorithm: string) => ipcRenderer.invoke('get-file-hash', filePath, algorithm),
  getDirStats: (path: string) => ipcRenderer.invoke('get-dir-stats', path),
  unzip: (filePath: string, targetDir: string) => ipcRenderer.invoke('unzip', filePath, targetDir),
  batchRename: (paths: string[], pattern: string, replacement: string) => ipcRenderer.invoke('batch-rename', paths, pattern, replacement),
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content),
  onMainMessage: (callback: any) => ipcRenderer.on('main-process-message', (_event, value) => callback(value)),
})
