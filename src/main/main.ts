import { app, BrowserWindow, ipcMain, shell, protocol, net } from "electron";
import { pathToFileURL, fileURLToPath } from "node:url";
import fs_native from "node:fs";
import path from "node:path";
import fs from "node:fs/promises";
import { exec, spawn } from "node:child_process";
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
import { PDFDocument } from "pdf-lib";

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
const installedAppsCache = {
  data: [] as any[],
  ts: 0,
};
let installedAppsInFlight: Promise<any[]> | null = null;
let installedAppsCacheLoaded = false;

const getInstalledAppsCachePath = () =>
  path.join(app.getPath("userData"), "installedAppsCache.json");

const loadInstalledAppsCache = async () => {
  if (installedAppsCacheLoaded) return;
  installedAppsCacheLoaded = true;
  try {
    const raw = await fs.readFile(getInstalledAppsCachePath(), "utf8");
    const payload = JSON.parse(raw);
    if (Array.isArray(payload?.data)) {
      installedAppsCache.data = payload.data;
      installedAppsCache.ts = Number(payload.ts || 0);
    }
  } catch {
    // ignore cache read errors
  }
};

const saveInstalledAppsCache = async () => {
  try {
    const payload = {
      data: installedAppsCache.data,
      ts: installedAppsCache.ts,
    };
    await fs.writeFile(getInstalledAppsCachePath(), JSON.stringify(payload));
  } catch {
    // ignore cache write errors
  }
};

const warmInstalledAppsCache = () => {
  if (installedAppsInFlight) return;
  installedAppsInFlight = getInstalledAppsInternal()
    .then((apps) => {
      installedAppsCache.data = apps;
      installedAppsCache.ts = Date.now();
      saveInstalledAppsCache();
      return apps;
    })
    .finally(() => {
      installedAppsInFlight = null;
    });
};

const withTimeout = async <T>(promise: Promise<T>, ms: number) => {
  let timeoutId: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<"__timeout__">((resolve) => {
    timeoutId = setTimeout(() => resolve("__timeout__"), ms);
  });
  const result = await Promise.race([promise, timeoutPromise]);
  if (timeoutId) clearTimeout(timeoutId);
  return result;
};
ipcMain.handle("read-file", async (_event, filePath: string) => {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error: any) {
    return { error: error.message };
  }
});

const getOpenWithApps = async (filePath: string) => {
  if (process.platform !== "win32") return [];
  const ext = path.extname(filePath).toLowerCase();
  if (!ext) return [];

  const openWithKey = `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FileExts\\${ext}\\OpenWithList`;

  let values: Record<string, any> = {};
  try {
    const listResult = await regList([openWithKey]);
    values = listResult?.[openWithKey]?.values || {};
  } catch (e) {
    values = {};
  }

  const mru = (values.MRUList?.value as string) || "";
  const exeKeys = Object.keys(values).filter(
    (k) => k.length === 1 && typeof values[k]?.value === "string",
  );

  const orderedExeNames = mru
    ? mru
        .split("")
        .map((k) => values[k]?.value)
        .filter(Boolean)
    : exeKeys.map((k) => values[k]?.value).filter(Boolean);

  const uniqueExeNames = Array.from(
    new Set(orderedExeNames.map((v) => String(v))),
  );

  const resolvedApps = [] as { name: string; path: string }[];

  for (const exe of uniqueExeNames) {
    const appKeys = [
      `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\${exe}`,
      `HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\${exe}`,
      `HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\App Paths\\${exe}`,
    ];

    let appPath = "";
    try {
      const appResult = await regList(appKeys);
      for (const key of appKeys) {
        const val = appResult?.[key]?.values?.[""]?.value as string;
        if (val) {
          appPath = val;
          break;
        }
      }
    } catch (e) {
      // ignore
    }

    if (!appPath) continue;
    resolvedApps.push({
      name: exe.replace(/\.exe$/i, ""),
      path: appPath,
    });

    if (resolvedApps.length >= 5) break;
  }

  return resolvedApps;
};

ipcMain.handle("open-with", async (_event, filePath: string) => {
  try {
    if (process.platform === "win32") {
      const child = spawn(
        "rundll32.exe",
        ["shell32.dll,OpenAs_RunDLL", filePath],
        { detached: true, stdio: "ignore" },
      );
      child.unref();
      return { success: true };
    }

    await shell.openPath(filePath);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle("get-open-with-apps", async (_event, filePath: string) => {
  try {
    const apps = await getOpenWithApps(filePath);
    return { apps };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle(
  "open-with-app",
  async (_event, appPath: string, filePath: string) => {
    try {
      if (!appPath) return { error: "APP_NOT_FOUND" };
      const child = spawn(appPath, [filePath], {
        detached: true,
        stdio: "ignore",
      });
      child.unref();
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  },
);

ipcMain.handle("open-terminal", async (_event, dirPath: string) => {
  try {
    const targetDir = fs_native.existsSync(dirPath)
      ? dirPath
      : path.dirname(dirPath);
    if (process.platform === "win32") {
      const child = spawn(
        "cmd.exe",
        ["/c", "start", "", "/D", targetDir, "cmd.exe", "/K"],
        {
          windowsHide: false,
          detached: true,
          stdio: "ignore",
        },
      );
      child.unref();
      return { success: true };
    }

    await shell.openPath(targetDir);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle("quick-action", async (_event, action: string, payload: any) => {
  try {
    const filePath = payload?.filePath as string;
    if (!filePath) return { error: "NO_FILE" };

    const dir = path.dirname(filePath);
    const parsed = path.parse(filePath);

    if (action === "convert-image") {
        let sharp: any;
        try {
          ({ default: sharp } = await import("sharp"));
        } catch (e: any) {
          return { error: "SHARP_NOT_AVAILABLE" };
        }
      const format = String(payload?.format || "png").toLowerCase();
      const allowed = ["png", "jpg", "jpeg", "webp"];
      if (!allowed.includes(format)) return { error: "INVALID_FORMAT" };
      const targetExt = format === "jpeg" ? "jpg" : format;
      const basePath = path.join(dir, `${parsed.name}_converted.${targetExt}`);
      const outputPath = ensureUniquePath(basePath);

      const img = sharp(filePath);
      if (targetExt === "png") await img.png().toFile(outputPath);
      else if (targetExt === "webp") await img.webp().toFile(outputPath);
      else await img.jpeg({ quality: 90 }).toFile(outputPath);

      return { success: true, outputPath };
    }

    if (action === "resize-image") {
        let sharp: any;
        try {
          ({ default: sharp } = await import("sharp"));
        } catch (e: any) {
          return { error: "SHARP_NOT_AVAILABLE" };
        }
      const scale = Number(payload?.scale || 1);
      if (!scale || scale <= 0 || scale >= 1.01) {
        return { error: "INVALID_SCALE" };
      }
      const meta = await sharp(filePath).metadata();
      const width = meta.width || 1024;
      const height = meta.height || 1024;
      const nextWidth = Math.max(1, Math.round(width * scale));
      const nextHeight = Math.max(1, Math.round(height * scale));

      const basePath = path.join(
        dir,
        `${parsed.name}_resized_${Math.round(scale * 100)}${parsed.ext}`,
      );
      const outputPath = ensureUniquePath(basePath);
      await sharp(filePath)
        .resize({ width: nextWidth, height: nextHeight })
        .toFile(outputPath);
      return { success: true, outputPath };
    }

    if (action === "optimize-pdf") {
      const data = await fs.readFile(filePath);
      const pdf = await PDFDocument.load(data);
      const outputBytes = await pdf.save({ useObjectStreams: true });
      const basePath = path.join(dir, `${parsed.name}_optimized.pdf`);
      const outputPath = ensureUniquePath(basePath);
      await fs.writeFile(outputPath, outputBytes);
      return { success: true, outputPath };
    }

    return { error: "UNKNOWN_ACTION" };
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

const ensureUniquePath = (targetPath: string) => {
  if (!fs_native.existsSync(targetPath)) return targetPath;
  const parsed = path.parse(targetPath);
  let counter = 1;
  let nextPath = path.join(
    parsed.dir,
    `${parsed.name} (${counter})${parsed.ext}`,
  );
  while (fs_native.existsSync(nextPath)) {
    counter += 1;
    nextPath = path.join(
      parsed.dir,
      `${parsed.name} (${counter})${parsed.ext}`,
    );
  }
  return nextPath;
};

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

  loadInstalledAppsCache().finally(() => {
    warmInstalledAppsCache();
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

ipcMain.handle("delete-files-bulk", async (_event, paths: string[]) => {
  try {
    const parentDirs = new Set<string>();
    const results = await Promise.allSettled(
      (paths || []).map(async (p) => {
        await fs.rm(p, { recursive: true, force: true });
        parentDirs.add(path.dirname(p));
      }),
    );

    for (const dir of parentDirs) {
      dirCache.delete(dir);
    }

    const failed = results
      .map((r, i) => ({ r, i }))
      .filter((x) => x.r.status === "rejected")
      .map((x) => ({ path: paths[x.i], error: (x.r as any).reason?.message }));

    if (failed.length > 0) {
      return { error: "SOME_FAILED", failed };
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
    let totalSize = 0;

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const scan = async (d: string, depth = 0) => {
      try {
        const entries = await fs.readdir(d, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(d, entry.name);
          if (entry.isDirectory()) {
            await scan(fullPath, depth + 1);
          } else {
            try {
              const s = await fs.stat(fullPath);
              totalSize += s.size;
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
      totalSize,
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

ipcMain.handle("get-installed-apps", async (_event, options?: { force?: boolean }) => {
  const force = options?.force === true;
  const cacheFresh = installedAppsCache.data.length > 0 &&
    Date.now() - installedAppsCache.ts < 5 * 60 * 1000;

  if (!force && cacheFresh) {
    return installedAppsCache.data;
  }

  if (!force && installedAppsCache.data.length > 0) {
    warmInstalledAppsCache();
    return installedAppsCache.data;
  }

  if (!installedAppsInFlight) {
    installedAppsInFlight = getInstalledAppsInternal().then((apps) => {
      installedAppsCache.data = apps;
      installedAppsCache.ts = Date.now();
      saveInstalledAppsCache();
      return apps;
    }).finally(() => {
      installedAppsInFlight = null;
    });
  }

  const inFlight = installedAppsInFlight;
  const result = await withTimeout(inFlight, 12000);
  if (result === "__timeout__") {
    if (installedAppsCache.data.length > 0) {
      return installedAppsCache.data;
    }
    try {
      return inFlight ? await inFlight : [];
    } catch {
      return [];
    }
  }
  return result;
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
