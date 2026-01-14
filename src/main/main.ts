import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import fs_native from 'node:fs'
import path from 'node:path'
import fs from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import crypto from 'node:crypto'
ipcMain.handle('read-file', async (_event, filePath: string) => {
  try {
    return await fs.readFile(filePath, 'utf8')
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle('write-file', async (_event, filePath: string, content: string) => {
  try {
    await fs.writeFile(filePath, content, 'utf8')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#f8fafc',
    }
  })

    if (process.env.VITE_DEV_SERVER_URL) {
      win.loadURL(process.env.VITE_DEV_SERVER_URL)
      win.webContents.openDevTools()
    } else {
if (process.env.DIST) {
    win.loadFile(path.join(process.env.DIST, 'index.html'))
    }
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)

// --- IPC Handlers ---

ipcMain.handle('list-dir', async (_event, dirPath: string) => {
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true })
    const stats = await Promise.all(
      files.map(async (file) => {
        try {
          const filePath = path.join(dirPath, file.name)
          const s = await fs.stat(filePath)
          return {
            name: file.name,
            path: filePath,
            isDirectory: file.isDirectory(),
            size: s.size,
            modifiedAt: s.mtime.getTime(),
            createdAt: s.birthtime.getTime(),
          }
        } catch (e) {
          return {
            name: file.name,
            path: path.join(dirPath, file.name),
            isDirectory: file.isDirectory(),
            size: 0,
            error: true
          }
        }
      })
    )
    return stats
  } catch (error: any) {
    throw new Error(error.message)
  }
})

ipcMain.handle('get-drives', async () => {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execAsync('powershell "Get-PSDrive -PSProvider FileSystem | Select-Object Name, Used, Free"')
      const lines = stdout.trim().split('\n').slice(2)
      return lines.map(line => {
        const [name, used, free] = line.trim().split(/\s+/)
        const usedNum = parseInt(used) || 0
        const freeNum = parseInt(free) || 0
        return {
          name: `${name}:`,
          path: `${name}:\\`,
          used: usedNum,
          free: freeNum,
          total: usedNum + freeNum
        }
      })
    }
    return []
  } catch (error: any) {
    return []
  }
})

ipcMain.handle('delete-items', async (_event, paths: string[]) => {
  try {
    for (const p of paths) {
      await shell.trashItem(p)
    }
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle('rename-item', async (_event, oldPath: string, newPath: string) => {
  try {
    await fs.rename(oldPath, newPath)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle('create-folder', async (_event, folderPath: string) => {
  try {
    await fs.mkdir(folderPath, { recursive: true })
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle('open-path', async (_event, filePath: string) => {
  try {
    await shell.openPath(filePath)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle('search-files', async (_event, dirPath: string, query: string) => {
  try {
    const results: any[] = []
    const walk = async (currentDir: string) => {
      const files = await fs.readdir(currentDir, { withFileTypes: true })
      for (const file of files) {
        const fullPath = path.join(currentDir, file.name)
        if (file.name.toLowerCase().includes(query.toLowerCase())) {
          try {
            const s = await fs.stat(fullPath)
            results.push({
              name: file.name,
              path: fullPath,
              isDirectory: file.isDirectory(),
              size: s.size,
              modifiedAt: s.mtime.getTime(),
              createdAt: s.birthtime.getTime(),
            })
          } catch (e) {}
        }
        if (file.isDirectory() && results.length < 50) {
          try {
            await walk(fullPath)
          } catch (e) {}
        }
        if (results.length >= 50) break
      }
    }
    await walk(dirPath)
    return results
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle('get-file-hash', async (_event, filePath: string, algorithm: 'md5' | 'sha1') => {
  try {
    const fileBuffer = await fs.readFile(filePath)
    const hashSum = crypto.createHash(algorithm)
    hashSum.update(fileBuffer)
    return hashSum.digest('hex')
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle('get-advanced-stats', async (_event, dirPath: string) => {
  try {
    const categories: Record<string, { size: number; count: number; exts: string[] }> = {
      images: { size: 0, count: 0, exts: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'] },
      videos: { size: 0, count: 0, exts: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'] },
      audio: { size: 0, count: 0, exts: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'] },
      docs: { size: 0, count: 0, exts: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md'] },
      apps: { size: 0, count: 0, exts: ['exe', 'msi', 'appx', 'dmg'] },
      others: { size: 0, count: 0, exts: [] }
    }

    const largeFiles: any[] = []
    const recentFiles: any[] = []
    const redundantFiles: any[] = []
    const hashes = new Map<string, string[]>() // hash -> paths[] (for duplicate detection)
    
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000

    const scan = async (d: string, depth = 0) => {
      if (depth > 8) return // Increase depth for better analysis but still keep limit
      try {
        const entries = await fs.readdir(d, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = path.join(d, entry.name)
          if (entry.isDirectory()) {
            await scan(fullPath, depth + 1)
          } else {
            try {
              const s = await fs.stat(fullPath)
              const ext = path.extname(entry.name).toLowerCase().slice(1)
              
              // Categorize
              let categorized = false
              const catKeys = Object.keys(categories)
              for (const key of catKeys) {
                const cat = categories[key]
                if (cat.exts.includes(ext)) {
                  cat.size += s.size
                  cat.count++
                  categorized = true
                  break
                }
              }
              if (!categorized) {
                categories.others.size += s.size
                categories.others.count++
              }

              // Potential Duplicates (Same name & size)
              const dupeKey = `${s.size}-${entry.name}`
              if (!hashes.has(dupeKey)) {
                hashes.set(dupeKey, [fullPath])
              } else {
                hashes.get(dupeKey)!.push(fullPath)
              }

              // Large Files (> 100MB)
              if (s.size > 100 * 1024 * 1024) {
                largeFiles.push({ name: entry.name, path: fullPath, size: s.size })
              }

              // Recent Files (Last 24h)
              if (now - s.mtime.getTime() < oneDay) {
                recentFiles.push({ name: entry.name, path: fullPath, modifiedAt: s.mtime.getTime() })
              }

              // Redundant (.tmp, .log, .cache)
              if (ext === 'tmp' || ext === 'log' || ext === 'cache' || s.size === 0) {
                redundantFiles.push({ name: entry.name, path: fullPath, size: s.size })
              }

            } catch (e) {}
          }
        }
      } catch (e) {}
    }

    await scan(dirPath)

    const duplicateGroups = Array.from(hashes.values()).filter(paths => paths.length > 1)
    const duplicateCount = duplicateGroups.reduce((acc, curr) => acc + curr.length, 0)
    const duplicateSize = duplicateGroups.reduce((acc, curr) => {
      const stats = fs_native.statSync(curr[0])
      return acc + (stats.size * (curr.length - 1))
    }, 0)

    return {
      categories,
      largeFiles: largeFiles.sort((a, b) => b.size - a.size).slice(0, 20),
      recentFiles: recentFiles.sort((a, b) => b.modifiedAt - a.modifiedAt).slice(0, 20),
      redundantFiles: redundantFiles.map(f => f.path),
      redundantCount: redundantFiles.length,
      redundantSize: redundantFiles.reduce((acc, curr) => acc + curr.size, 0),
      duplicateGroups,
      duplicateCount,
      duplicateSize
    }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle('reveal-in-explorer', (_event, filePath: string) => {
  shell.showItemInFolder(filePath)
})

ipcMain.handle('delete-files-bulk', async (_event, filePaths: string[]) => {
  try {
    for (const p of filePaths) {
      await fs.unlink(p)
    }
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle('batch-rename', async (_event, paths: string[], pattern: string, replacement: string) => {
  try {
    const results = []
    for (const oldPath of paths) {
      const dir = path.dirname(oldPath)
      const name = path.basename(oldPath)
      const newName = name.replace(pattern, replacement)
      const newPath = path.join(dir, newName)
      await fs.rename(oldPath, newPath)
      results.push({ oldPath, newPath })
    }
    return { success: true, results }
  } catch (error: any) {
    return { error: error.message }
  }
})
