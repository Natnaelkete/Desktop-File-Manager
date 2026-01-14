"use strict";
const electron = require("electron");
const node_url = require("node:url");
const path = require("node:path");
const fs = require("node:fs/promises");
const node_child_process = require("node:child_process");
const node_util = require("node:util");
const crypto = require("node:crypto");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
electron.ipcMain.handle("read-file", async (_event, filePath) => {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    return { error: error.message };
  }
});
electron.ipcMain.handle("write-file", async (_event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, "utf8");
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});
const execAsync = node_util.promisify(node_child_process.exec);
const __dirname$1 = path.dirname(node_url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("main.cjs", document.baseURI).href));
process.env.DIST = path.join(__dirname$1, "../dist");
process.env.VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
let win;
function createWindow() {
  win = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname$1, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    },
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#0f172a",
      symbolColor: "#f8fafc"
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    if (process.env.DIST) {
      win.loadFile(path.join(process.env.DIST, "index.html"));
    }
  }
}
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
    win = null;
  }
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
electron.app.whenReady().then(createWindow);
electron.ipcMain.handle("list-dir", async (_event, dirPath) => {
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    const stats = await Promise.all(
      files.map(async (file) => {
        try {
          const filePath = path.join(dirPath, file.name);
          const s = await fs.stat(filePath);
          return {
            name: file.name,
            path: filePath,
            isDirectory: file.isDirectory(),
            size: s.size,
            modifiedAt: s.mtime.getTime(),
            createdAt: s.birthtime.getTime()
          };
        } catch (e) {
          return {
            name: file.name,
            path: path.join(dirPath, file.name),
            isDirectory: file.isDirectory(),
            size: 0,
            error: true
          };
        }
      })
    );
    return stats;
  } catch (error) {
    throw new Error(error.message);
  }
});
electron.ipcMain.handle("get-drives", async () => {
  try {
    if (process.platform === "win32") {
      const { stdout } = await execAsync('powershell "Get-PSDrive -PSProvider FileSystem | Select-Object Name, Used, Free"');
      const lines = stdout.trim().split("\n").slice(2);
      return lines.map((line) => {
        const [name, used, free] = line.trim().split(/\s+/);
        const usedNum = parseInt(used) || 0;
        const freeNum = parseInt(free) || 0;
        return {
          name: `${name}:`,
          path: `${name}:\\`,
          used: usedNum,
          free: freeNum,
          total: usedNum + freeNum
        };
      });
    }
    return [];
  } catch (error) {
    return [];
  }
});
electron.ipcMain.handle("delete-items", async (_event, paths) => {
  try {
    for (const p of paths) {
      await electron.shell.trashItem(p);
    }
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});
electron.ipcMain.handle("rename-item", async (_event, oldPath, newPath) => {
  try {
    await fs.rename(oldPath, newPath);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});
electron.ipcMain.handle("create-folder", async (_event, folderPath) => {
  try {
    await fs.mkdir(folderPath, { recursive: true });
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});
electron.ipcMain.handle("open-path", async (_event, filePath) => {
  try {
    await electron.shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});
electron.ipcMain.handle("search-files", async (_event, dirPath, query) => {
  try {
    const results = [];
    const walk = async (currentDir) => {
      const files = await fs.readdir(currentDir, { withFileTypes: true });
      for (const file of files) {
        const fullPath = path.join(currentDir, file.name);
        if (file.name.toLowerCase().includes(query.toLowerCase())) {
          try {
            const s = await fs.stat(fullPath);
            results.push({
              name: file.name,
              path: fullPath,
              isDirectory: file.isDirectory(),
              size: s.size,
              modifiedAt: s.mtime.getTime(),
              createdAt: s.birthtime.getTime()
            });
          } catch (e) {
          }
        }
        if (file.isDirectory() && results.length < 50) {
          try {
            await walk(fullPath);
          } catch (e) {
          }
        }
        if (results.length >= 50) break;
      }
    };
    await walk(dirPath);
    return results;
  } catch (error) {
    return { error: error.message };
  }
});
electron.ipcMain.handle("get-file-hash", async (_event, filePath, algorithm) => {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash(algorithm);
    hashSum.update(fileBuffer);
    return hashSum.digest("hex");
  } catch (error) {
    return { error: error.message };
  }
});
electron.ipcMain.handle("get-dir-stats", async (_event, dirPath) => {
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    const stats = await Promise.all(
      files.map(async (file) => {
        const fullPath = path.join(dirPath, file.name);
        let size = 0;
        if (file.isDirectory()) {
          const getDirSize = async (d) => {
            let total = 0;
            try {
              const entries = await fs.readdir(d, { withFileTypes: true });
              for (const entry of entries) {
                const p = path.join(d, entry.name);
                if (entry.isDirectory()) {
                  total += await getDirSize(p);
                } else {
                  const s = await fs.stat(p);
                  total += s.size;
                }
              }
            } catch (e) {
            }
            return total;
          };
          size = await getDirSize(fullPath);
        } else {
          try {
            const s = await fs.stat(fullPath);
            size = s.size;
          } catch (e) {
          }
        }
        return { name: file.name, size, isDirectory: file.isDirectory() };
      })
    );
    return stats.sort((a, b) => b.size - a.size);
  } catch (error) {
    return { error: error.message };
  }
});
electron.ipcMain.handle("batch-rename", async (_event, paths, pattern, replacement) => {
  try {
    const results = [];
    for (const oldPath of paths) {
      const dir = path.dirname(oldPath);
      const name = path.basename(oldPath);
      const newName = name.replace(pattern, replacement);
      const newPath = path.join(dir, newName);
      await fs.rename(oldPath, newPath);
      results.push({ oldPath, newPath });
    }
    return { success: true, results };
  } catch (error) {
    return { error: error.message };
  }
});
