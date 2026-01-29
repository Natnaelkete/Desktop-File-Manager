import { app, BrowserWindow, ipcMain, shell, protocol, net } from "electron";
import { pathToFileURL, fileURLToPath } from "node:url";
import fs_native from "node:fs";
import path from "node:path";
import fs from "node:fs/promises";
import { exec } from "node:child_process";
// @ts-ignore
import regedit from "regedit";

// Set VBS location - crucial for Electron/Vite
const vbsPath = path.join(process.cwd(), "node_modules", "regedit", "vbs");
regedit.setExternalVBSLocation(vbsPath);

// Promisify regedit list
const regList = (keys: string[]) =>
  new Promise<any>((resolve, reject) => {
    regedit.list(keys, (err: any, result: any) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
import { promisify } from "node:util";
import crypto from "node:crypto";

// Register privileged schemes
protocol.registerSchemesAsPrivileged([
  {
    scheme: "local-resource",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true,
    },
  },
]);

const lastScanCache = {
  duplicateGroups: [] as string[][],
};
ipcMain.handle("read-file", async (_event, filePath: string) => {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle(
  "write-file",
  async (_event, filePath: string, content: string) => {
    try {
      await fs.writeFile(filePath, content, "utf8");
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  },
);

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#0f172a",
      symbolColor: "#f8fafc",
    },
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

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  // Register local-resource protocol (Modern API)
  protocol.handle("local-resource", async (request) => {
    try {
      const url = new URL(request.url);
      const decodedPath = url.searchParams.get("path");

      if (!decodedPath) {
        return new Response("Missing path parameter", { status: 400 });
      }

      // Use pathToFileURL to create a valid file:// URI for net.fetch
      // This supports streaming natively and is memory-efficient
      const fileUrl = pathToFileURL(decodedPath).toString();
      const response = await net.fetch(fileUrl);

      // We wrap the response to add CORS or custom headers if needed
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (e) {
      console.error("Protocol Error:", e);
      return new Response("Invalid path or read error", { status: 500 });
    }
  });

  createWindow();
});

ipcMain.handle("get-file-icon", async (_event, filePath: string) => {
  try {
    const cleanPath = filePath.split(",")[0].replace(/"/g, "");
    const icon = await app.getFileIcon(cleanPath, { size: "normal" });
    return icon.toDataURL();
  } catch (error: any) {
    return null;
  }
});

// --- IPC Handlers ---

// LRU Cache for directory listings
const dirCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds
const MAX_CACHE_SIZE = 50;

function getCachedDir(dirPath: string) {
  const cached = dirCache.get(dirPath);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedDir(dirPath: string, data: any[]) {
  // LRU eviction
  if (dirCache.size >= MAX_CACHE_SIZE) {
    const firstKey = dirCache.keys().next().value as string;
    dirCache.delete(firstKey);
  }
  dirCache.set(dirPath, { data, timestamp: Date.now() });
}

ipcMain.handle("list-dir", async (_event, dirPath: string) => {
  try {
    // Check cache first
    const cached = getCachedDir(dirPath);
    if (cached) return cached;

    const files = await fs.readdir(dirPath, { withFileTypes: true });

    // Parallel processing with batching for better performance
    const BATCH_SIZE = 100;
    const results: any[] = [];

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (file) => {
          try {
            const filePath = path.join(dirPath, file.name);
            const s = await fs.stat(filePath);
            return {
              name: file.name,
              path: filePath,
              isDirectory: file.isDirectory(),
              size: s.size,
              modifiedAt: s.mtime.getTime(),
              createdAt: s.birthtime.getTime(),
            };
          } catch (e) {
            return {
              name: file.name,
              path: path.join(dirPath, file.name),
              isDirectory: file.isDirectory(),
              size: 0,
              error: true,
            };
          }
        }),
      );
      results.push(...batchResults);
    }

    // Cache the results
    setCachedDir(dirPath, results);
    return results;
  } catch (error: any) {
    throw new Error(error.message);
  }
});

ipcMain.handle("get-drives", async () => {
  try {
    if (process.platform === "win32") {
      const { stdout } = await execAsync(
        'powershell "Get-PSDrive -PSProvider FileSystem | Select-Object Name, Used, Free"',
      );
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
          total: usedNum + freeNum,
        };
      });
    }
    return [];
  } catch (error: any) {
    return [];
  }
});

ipcMain.handle("get-user-paths", async () => {
  const paths = {
    desktop: app.getPath("desktop"),
    documents: app.getPath("documents"),
    downloads: app.getPath("downloads"),
    pictures: app.getPath("pictures"),
    videos: app.getPath("videos"),
    music: app.getPath("music"),
    home: app.getPath("home"),
  };
  return paths;
});

ipcMain.handle("delete-items", async (_event, paths: string[]) => {
  try {
    const parentDirs = new Set<string>();
    for (const p of paths) {
      await shell.trashItem(p);
      parentDirs.add(path.dirname(p));
    }
    // Invalidate cache for affected directories
    for (const dir of parentDirs) {
      dirCache.delete(dir);
    }
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle("delete-items-permanently", async (_event, paths: string[]) => {
  try {
    const parentDirs = new Set<string>();
    for (const p of paths) {
      await fs.rm(p, { recursive: true, force: true });
      parentDirs.add(path.dirname(p));
    }
    // Invalidate cache for affected directories
    for (const dir of parentDirs) {
      dirCache.delete(dir);
    }
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle(
  "rename-item",
  async (_event, oldPath: string, newPath: string) => {
    try {
      await fs.rename(oldPath, newPath);
      dirCache.delete(path.dirname(oldPath));
      dirCache.delete(path.dirname(newPath));
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  },
);

ipcMain.handle(
  "copy-items",
  async (_event, sourcePaths: string[], destDir: string) => {
    try {
      for (const src of sourcePaths) {
        const fileName = path.basename(src);
        const dest = path.join(destDir, fileName);

        if (fs_native.existsSync(dest)) {
          return { error: "ALREADY_EXISTS", details: fileName };
        }

        await fs.cp(src, dest, { recursive: true });
      }
      dirCache.delete(destDir);
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  },
);

ipcMain.handle(
  "move-items",
  async (_event, sourcePaths: string[], destDir: string) => {
    try {
      const sourceParents = new Set<string>();
      for (const src of sourcePaths) {
        const fileName = path.basename(src);
        const dest = path.join(destDir, fileName);

        if (fs_native.existsSync(dest)) {
          return { error: "ALREADY_EXISTS", details: fileName };
        }

        try {
          await fs.rename(src, dest);
          sourceParents.add(path.dirname(src));
        } catch (e: any) {
          if (e.code === "EXDEV") {
            await fs.cp(src, dest, { recursive: true });
            await fs.rm(src, { recursive: true, force: true });
            sourceParents.add(path.dirname(src));
          } else {
            throw e;
          }
        }
      }
      dirCache.delete(destDir);
      for (const dir of sourceParents) {
        dirCache.delete(dir);
      }
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  },
);

ipcMain.handle("create-folder", async (_event, folderPath: string) => {
  try {
    await fs.mkdir(folderPath, { recursive: true });
    dirCache.delete(path.dirname(folderPath));
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle("open-path", async (_event, filePath: string) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle(
  "search-files",
  async (_event, dirPath: string, query: string) => {
    try {
      const results: any[] = [];
      const walk = async (currentDir: string) => {
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
                createdAt: s.birthtime.getTime(),
              });
            } catch (e) {}
          }
          if (file.isDirectory() && results.length < 50) {
            try {
              await walk(fullPath);
            } catch (e) {}
          }
          if (results.length >= 50) break;
        }
      };
      await walk(dirPath);
      return results;
    } catch (error: any) {
      return { error: error.message };
    }
  },
);

ipcMain.handle(
  "get-file-hash",
  async (_event, filePath: string, algorithm: "md5" | "sha1") => {
    return new Promise((resolve) => {
      try {
        console.log(`Hashing file: ${filePath} (${algorithm})`);
        const hash = crypto.createHash(algorithm);
        const stream = fs_native.createReadStream(filePath);

        stream.on("data", (data) => hash.update(data));
        stream.on("end", () => {
          const result = hash.digest("hex");
          console.log(`Hash success: ${result.substring(0, 8)}...`);
          resolve(result);
        });
        stream.on("error", (err) => {
          console.error(`Hash stream error: ${err.message}`);
          resolve({ error: err.message });
        });
      } catch (error: any) {
        console.error(`Hash catch error: ${error.message}`);
        resolve({ error: error.message });
      }
    });
  },
);

ipcMain.handle("get-advanced-stats", async (_event, dirPath: string) => {
  try {
    const categories: Record<
      string,
      { size: number; count: number; exts: string[] }
    > = {
      images: {
        size: 0,
        count: 0,
        exts: ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"],
      },
      videos: {
        size: 0,
        count: 0,
        exts: ["mp4", "mkv", "avi", "mov", "wmv", "flv", "webm"],
      },
      audio: {
        size: 0,
        count: 0,
        exts: ["mp3", "wav", "flac", "aac", "ogg", "m4a"],
      },
      docs: {
        size: 0,
        count: 0,
        exts: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "md"],
      },
      apps: { size: 0, count: 0, exts: ["exe", "msi", "appx", "dmg"] },
      others: { size: 0, count: 0, exts: [] },
    };

    const largeFiles: any[] = [];
    const recentFiles: any[] = [];
    const redundantFiles: any[] = [];
    const hashes = new Map<string, string[]>(); // hash -> paths[] (for duplicate detection)

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const scan = async (d: string, depth = 0) => {
      // Limit scan depth to avoid excessive time/memory usage, but allow enough to be useful
      if (depth > 6) return;
      try {
        const entries = await fs.readdir(d, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(d, entry.name);
          if (entry.isDirectory()) {
            await scan(fullPath, depth + 1);
          } else {
            try {
              const s = await fs.stat(fullPath);
              const ext = path.extname(entry.name).toLowerCase().slice(1);

              // Categorize
              let categorized = false;
              const catKeys = Object.keys(categories);
              for (const key of catKeys) {
                const cat = categories[key];
                if (cat.exts.includes(ext)) {
                  cat.size += s.size;
                  cat.count++;
                  categorized = true;
                  break;
                }
              }
              if (!categorized) {
                categories.others.size += s.size;
                categories.others.count++;
              }

              // Potential Duplicates (Same name & size)
              const dupeKey = `${s.size}-${entry.name}`;
              if (!hashes.has(dupeKey)) {
                hashes.set(dupeKey, [fullPath]);
              } else {
                hashes.get(dupeKey)!.push(fullPath);
              }

              // Large Files (> 100MB)
              if (s.size > 100 * 1024 * 1024) {
                largeFiles.push({
                  name: entry.name,
                  path: fullPath,
                  size: s.size,
                });
              }

              // Recent Files (Last 24h)
              if (now - s.mtime.getTime() < oneDay) {
                recentFiles.push({
                  name: entry.name,
                  path: fullPath,
                  modifiedAt: s.mtime.getTime(),
                });
              }

              // Redundant (.tmp, .log, .cache)
              if (
                ext === "tmp" ||
                ext === "log" ||
                ext === "cache" ||
                s.size === 0
              ) {
                redundantFiles.push({
                  name: entry.name,
                  path: fullPath,
                  size: s.size,
                });
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    };

    await scan(dirPath);

    const duplicateGroups: string[][] = [];
    let duplicateCount = 0;
    let duplicateSize = 0;

    for (const [key, paths] of hashes.entries()) {
      if (paths.length > 1) {
        duplicateGroups.push(paths);
        duplicateCount += paths.length;
        // Parse size from key "${s.size}-${entry.name}"
        const size = parseInt(key) || 0;
        duplicateSize += size * (paths.length - 1);
      }
    }

    // Cache for pagination
    lastScanCache.duplicateGroups = duplicateGroups;

    return {
      categories,
      largeFiles: largeFiles.sort((a, b) => b.size - a.size).slice(0, 20),
      recentFiles: recentFiles
        .sort((a, b) => b.modifiedAt - a.modifiedAt)
        .slice(0, 20),
      redundantFiles: redundantFiles.map((f) => f.path),
      redundantCount: redundantFiles.length,
      redundantSize: redundantFiles.reduce((acc, curr) => acc + curr.size, 0),
      duplicateGroups: duplicateGroups.slice(0, 50), // Return only top 50 for preview
      duplicateCount,
      duplicateSize,
    };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle("reveal-in-explorer", (_event, filePath: string) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle(
  "get-duplicates-paginated",
  (_event, page: number, pageSize: number) => {
    const start = page * pageSize;
    const end = start + pageSize;
    return {
      groups: lastScanCache.duplicateGroups.slice(start, end),
      total: lastScanCache.duplicateGroups.length,
    };
  },
);

// Internal helper for scanning installed apps
const getInstalledAppsInternal = async () => {
  const keys = [
    "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
    "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
    "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
  ];

  const apps: any[] = [];
  try {
    for (const key of keys) {
      const rootsResult = await regList([key]);
      const subkeys = rootsResult[key]?.keys || [];
      const fullSubkeys = subkeys.map((sk: string) => `${key}\\${sk}`);
      const chunkSize = 40;
      const chunks = [];
      for (let i = 0; i < fullSubkeys.length; i += chunkSize) {
        chunks.push(fullSubkeys.slice(i, i + chunkSize));
      }

      const chunkResults = await Promise.all(
        chunks.map(async (chunk) => {
          try {
            const details = await regList(chunk);
            const chunkApps: any[] = [];
            for (const sk of chunk) {
              const data = details[sk]?.values;
              if (data && (data.DisplayName || data.UninstallString)) {
                chunkApps.push({
                  name: data.DisplayName?.value || sk.split("\\").pop(),
                  version: data.DisplayVersion?.value || "Unknown",
                  publisher: data.Publisher?.value || "Unknown",
                  uninstallString:
                    data.UninstallString?.value ||
                    data.QuietUninstallString?.value,
                  installLocation: data.InstallLocation?.value,
                  icon: data.DisplayIcon?.value,
                  size: data.EstimatedSize?.value
                    ? data.EstimatedSize.value * 1024
                    : 0,
                  installDate: data.InstallDate?.value,
                  registryPath: sk,
                });
              }
            }
            return chunkApps;
          } catch (e) {
            return [];
          }
        }),
      );
      for (const chunkApps of chunkResults) apps.push(...chunkApps);
    }
    return apps.sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) {
    return [];
  }
};

ipcMain.handle("get-installed-apps", async () => {
  return await getInstalledAppsInternal();
});

ipcMain.handle("run-uninstaller", async (_event, uninstallString: string) => {
  return new Promise((resolve) => {
    // We use exec because uninstall strings often contain quotes and arguments
    exec(uninstallString, (error) => {
      if (error) resolve({ error: error.message });
      else resolve({ success: true });
    });
  });
});

// Helper for finding leftovers
const findLeftoversInternal = async (
  appName: string,
  installLocation?: string,
) => {
  const leftovers: { files: string[]; registry: string[] } = {
    files: [],
    registry: [],
  };

  const searchDirs = [
    process.env.APPDATA,
    process.env.LOCALAPPDATA,
    "C:\\Program Files",
    "C:\\Program Files (x86)",
  ].filter(Boolean) as string[];

  for (const dir of searchDirs) {
    try {
      const entries = await fs.readdir(dir);
      const matches = entries.filter((e) =>
        e.toLowerCase().includes(appName.toLowerCase()),
      );
      for (const match of matches) {
        leftovers.files.push(path.join(dir, match));
      }
    } catch (e) {}
  }

  if (installLocation && fs_native.existsSync(installLocation)) {
    leftovers.files.push(installLocation);
  }

  const regKeys = [
    `HKCU\\Software\\${appName}`,
    `HKLM\\Software\\${appName}`,
    `HKLM\\Software\\WOW6432Node\\${appName}`,
  ];

  for (const rk of regKeys) {
    try {
      const res = await regList([rk]);
      if (res[rk]?.exists) {
        leftovers.registry.push(rk);
      }
    } catch (e) {}
  }

  return leftovers;
};

ipcMain.handle(
  "find-app-leftovers",
  async (_event, appName: string, installLocation?: string) => {
    return await findLeftoversInternal(appName, installLocation);
  },
);

ipcMain.handle("find-orphan-leftovers", async () => {
  const leftovers: { name: string; path: string; size: number }[] = [];
  try {
    const apps = await getInstalledAppsInternal();
    const installedLocations = new Set(
      apps.map((a) => a.installLocation?.toLowerCase()).filter(Boolean),
    );
    const installedNames = new Set(apps.map((a) => a.name.toLowerCase()));

    const searchDirs = [
      "C:\\Program Files",
      "C:\\Program Files (x86)",
      process.env.APPDATA,
      process.env.LOCALAPPDATA,
    ].filter(Boolean) as string[];

    for (const dir of searchDirs) {
      try {
        const entries = await fs.readdir(dir);
        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const entryLower = entry.toLowerCase();

          // Simple heuristic: If folder name doesn't match any installed app name
          // and its path isn't a known install location, it's a potential orphan.
          // We exclude common system folders.
          const commonDirs = [
            "microsoft",
            "windows",
            "common files",
            "desktop",
            "temp",
          ];
          if (commonDirs.includes(entryLower)) continue;

          let isKnown = false;
          if (installedLocations.has(fullPath.toLowerCase())) isKnown = true;
          if (installedNames.has(entryLower)) isKnown = true;

          if (!isKnown) {
            const stats = await fs.stat(fullPath);
            if (stats.isDirectory()) {
              leftovers.push({ name: entry, path: fullPath, size: 0 }); // Size calculation is expensive, skip for overview
            }
          }
        }
      } catch (e) {}
    }
    return leftovers.slice(0, 100);
  } catch (e) {
    return { error: "Orphan scan failed" };
  }
});

ipcMain.handle(
  "get-library-files",
  async (_event, type: "images" | "videos" | "music") => {
    const exts: Record<string, string[]> = {
      images: ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"],
      videos: [
        "mp4",
        "mkv",
        "avi",
        "mov",
        "wmv",
        "flv",
        "webm",
        "m4v",
        "mpg",
        "mpeg",
        "3gp",
        "ogv",
      ],
      music: ["mp3", "wav", "flac", "aac", "ogg", "m4a", "wma", "aiff", "opus"],
    };
    const activeType = type || "images";
    const targetExts = new Set(exts[activeType] || []);
    const results: any[] = [];
    const seenPaths = new Set<string>();

    const userPaths = [
      app.getPath("pictures"),
      app.getPath("videos"),
      app.getPath("music"),
      app.getPath("desktop"),
      app.getPath("documents"),
      app.getPath("downloads"),
    ].map((p) => path.normalize(p));

    // Start with user folders (high priority)
    const libraryPaths = [...userPaths];

    // Aggressive: Also add root of all drives, but avoid rescanning user folders
    try {
      const drives = await new Promise<string[]>((resolve) => {
        exec("wmic logicaldisk get name", (error, stdout) => {
          if (error) resolve([]);
          else {
            const names = stdout
              .split("\n")
              .map((s) => s.trim())
              .filter((s) => s && s.length === 2 && s.endsWith(":"))
              .map((s) => path.normalize(s + "\\"));
            resolve(names);
          }
        });
      });

      for (const drive of drives) {
        if (!libraryPaths.includes(drive)) {
          libraryPaths.push(drive);
        }
      }
    } catch (e) {}

    const scan = async (dir: string, depth = 0, maxDepth = 5) => {
      if (depth > maxDepth) return;
      try {
        const files = await fs.readdir(dir, { withFileTypes: true });
        for (const file of files) {
          try {
            const fullPath = path.join(dir, file.name);
            const normalizedPath = fullPath
              .toLowerCase()
              .replace(/[/\\]+$/, "");

            if (seenPaths.has(normalizedPath)) continue;
            seenPaths.add(normalizedPath);

            if (file.isDirectory()) {
              const name = file.name.toLowerCase();
              // Skip system/junk folders explicitly
              if (
                file.name.startsWith(".") ||
                name === "windows" ||
                name === "program files" ||
                name === "program files (x86)" ||
                name === "programdata" ||
                name === "appdata" ||
                name === "node_modules" ||
                name === "temp" ||
                name === "cache" ||
                name === "$recycle.bin" ||
                name === "system volume information" ||
                name === "microsoft"
              ) {
                continue;
              }
              await scan(fullPath, depth + 1, maxDepth);
            } else {
              const ext = file.name.split(".").pop()?.toLowerCase() || "";
              if (targetExts.has(ext)) {
                try {
                  const s = fs_native.statSync(fullPath);
                  results.push({
                    name: file.name,
                    path: fullPath,
                    isDirectory: false,
                    size: s.size,
                    modifiedAt: s.mtime.getTime(),
                    createdAt: s.birthtime.getTime(),
                    parentPath: dir,
                  });
                  if (results.length >= 10000) return; // Increased limit
                } catch (e) {}
              }
            }
          } catch (e) {}
        }
      } catch (e) {}
    };

    // Priority: User's own media folders (Depth 8 for deep organization)
    const priorityPaths = [
      app.getPath("pictures"),
      app.getPath("videos"),
      app.getPath("music"),
      app.getPath("downloads"),
      app.getPath("desktop"),
      app.getPath("documents"),
    ].map((p) => path.normalize(p));

    for (const p of priorityPaths) {
      if (fs_native.existsSync(p)) {
        await scan(p, 0, 8);
      }
    }

    // Expansion: Roots of all drives (Depth 3 for broad coverage)
    try {
      const drives = await new Promise<string[]>((resolve) => {
        exec("wmic logicaldisk get name", (error, stdout) => {
          if (error) resolve([]);
          else
            resolve(
              stdout
                .split("\n")
                .map((s) => s.trim())
                .filter((s) => s.length === 2 && s.endsWith(":"))
                .map((s) => s + "\\"),
            );
        });
      });
      for (const drive of drives) {
        if (fs_native.existsSync(drive)) {
          await scan(drive, 0, 3);
        }
      }
    } catch (e) {}

    return results;
  },
);

ipcMain.handle("get-uwp-apps", async () => {
  return new Promise((resolve) => {
    // Optimization: Filter for Main packages and exclude framework ones for speed
    const psCommand =
      "Get-AppxPackage -PackageTypeFilter Main | Where-Object { $_.InstallLocation -ne $null } | Select-Object Name, PackageFullName, Version, Publisher, InstallLocation | ConvertTo-Json";
    exec(`powershell -Command "${psCommand}"`, (error, stdout) => {
      if (error) {
        resolve({ error: error.message });
        return;
      }
      try {
        if (!stdout || stdout.trim() === "") {
          resolve([]);
          return;
        }
        const apps = JSON.parse(stdout);
        const appsArray = Array.isArray(apps) ? apps : [apps];
        resolve(
          appsArray.map((app: any) => ({
            name: app.Name,
            fullName: app.PackageFullName,
            version: app.Version,
            publisher: app.Publisher,
            installLocation: app.InstallLocation,
            isUWP: true,
          })),
        );
      } catch (e: any) {
        resolve({ error: "Failed to parse UWP apps: " + e.message });
      }
    });
  });
});

ipcMain.handle("uninstall-uwp-app", async (_event, packageFullName: string) => {
  return new Promise((resolve) => {
    exec(
      `powershell -Command "Remove-AppxPackage -Package ${packageFullName}"`,
      (error) => {
        if (error) resolve({ error: error.message });
        else resolve({ success: true });
      },
    );
  });
});

ipcMain.handle(
  "force-uninstall",
  async (_event, appName: string, installLocation?: string) => {
    return await findLeftoversInternal(appName, installLocation);
  },
);

ipcMain.handle(
  "batch-rename",
  async (_event, paths: string[], pattern: string, replacement: string) => {
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
    } catch (error: any) {
      return { error: error.message };
    }
  },
);
