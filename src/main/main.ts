import { app, BrowserWindow, ipcMain, shell, protocol, net } from "electron";
import { pathToFileURL, fileURLToPath } from "node:url";
import fs_native from "node:fs";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { exec, spawn } from "node:child_process";
// @ts-ignore
import regedit from "regedit";

// Set VBS location - crucial for Electron/Vite
let vbsPath: string;
if (app.isPackaged) {
  // In production, electron-builder unpacks the VBS files to resources/app.asar.unpacked
  vbsPath = path.join(
    process.resourcesPath,
    "app.asar.unpacked",
    "node_modules",
    "regedit",
    "vbs",
  );
} else {
  // In development, they are in node_modules
  vbsPath = path.join(process.cwd(), "node_modules", "regedit", "vbs");
}

console.log(`Setting regedit VBS path to: ${vbsPath}`);
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
let lastProcessSample = new Map<number, { cpu: number; ts: number }>();

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

ipcMain.handle("get-driver-report", async () => {
  try {
    const data = await runPowerShellJson(
      "Get-CimInstance Win32_PnPSignedDriver | Select-Object DeviceName,DriverVersion,Manufacturer,DriverDate,DriverProviderName,InfName | ConvertTo-Json -Compress",
    );
    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle("get-startup-items", async () => {
  try {
    const data = await runPowerShellJson(
      "Get-CimInstance Win32_StartupCommand | Select-Object Name,Command,Location,User | ConvertTo-Json -Compress",
    );
    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle("disable-startup-item", async (_event, item: any, dryRun = false) => {
  try {
    if (!item?.Name || !item?.Location) {
      return { error: "INVALID_STARTUP_ITEM" };
    }

    if (dryRun) return { success: true };

    const location = String(item.Location).trim();
    const name = String(item.Name).trim();

    // Validate inputs to prevent command injection
    if (location.includes('"') || location.includes('&') || location.includes('|')) {
      return { error: "INVALID_LOCATION_FORMAT" };
    }
    if (name.includes('"') || name.includes('&') || name.includes('|')) {
      return { error: "INVALID_NAME_FORMAT" };
    }

    const isRunKey = /\\Microsoft\\Windows\\CurrentVersion\\Run/i.test(
      location,
    );
    const isRunOnce = /\\Microsoft\\Windows\\CurrentVersion\\RunOnce/i.test(
      location,
    );

    if (isRunKey || isRunOnce) {
      // Escape quotes for registry command
      const escapedLocation = location.replace(/"/g, '""');
      const escapedName = name.replace(/"/g, '""');
      await execAsync(`reg delete "${escapedLocation}" /v "${escapedName}" /f`);
      return { success: true };
    }

    const isStartupFolder = /startup/i.test(location);
    if (isStartupFolder) {
      const cmdPathRaw = extractCommandPath(String(item.Command || ""));
      const cmdPath = cmdPathRaw ? expandEnvVars(cmdPathRaw) : null;
      const resolvedCmd = cmdPath
        ? fs_native.existsSync(cmdPath)
          ? cmdPath
          : fs_native.existsSync(path.resolve(cmdPath))
            ? path.resolve(cmdPath)
            : null
        : null;

      const startupDirs = [
        path.join(
          process.env.APPDATA || "",
          "Microsoft",
          "Windows",
          "Start Menu",
          "Programs",
          "Startup",
        ),
        path.join(
          process.env.PROGRAMDATA || "C:\\ProgramData",
          "Microsoft",
          "Windows",
          "Start Menu",
          "Programs",
          "StartUp",
        ),
      ].filter((p) => p && p.length > 0);

      const candidates = [] as string[];
      if (resolvedCmd) candidates.push(resolvedCmd);
      const name = String(item.Name || "").trim();
      if (name) {
        const fileName = name.toLowerCase().endsWith(".lnk")
          ? name
          : `${name}.lnk`;
        for (const dir of startupDirs) {
          candidates.push(path.join(dir, fileName));
        }
      }

      const target = candidates.find((p) => fs_native.existsSync(p)) || null;
      if (!target) return { error: "STARTUP_PATH_NOT_FOUND" };
      await fs.rename(target, `${target}.disabled`);
      return { success: true };
    }

    return { error: "UNSUPPORTED_STARTUP_LOCATION" };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle("get-process-list", async () => {
  try {
    const now = Date.now();
    const data = await runPowerShellJson(
      "Get-Process | Select-Object Id,ProcessName,CPU,WS,StartTime,MainWindowTitle | ConvertTo-Json -Compress",
    );
    const cpuCount = os.cpus().length || 1;
    const nextSample = new Map<number, { cpu: number; ts: number }>();
    const enriched = (data || []).map((p: any) => {
      const pid = Number(p.Id);
      const cpu = typeof p.CPU === "number" ? p.CPU : 0;
      let cpuPercent: number | null = null;
      const prev = lastProcessSample.get(pid);
      if (prev && now > prev.ts) {
        const deltaSeconds = (now - prev.ts) / 1000;
        const deltaCpu = Math.max(0, cpu - prev.cpu);
        cpuPercent = (deltaCpu / deltaSeconds) * (100 / cpuCount);
      }
      nextSample.set(pid, { cpu, ts: now });
      return { ...p, CPUPercent: cpuPercent };
    });
    lastProcessSample = nextSample;
    return { data: enriched };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle("kill-process", async (_event, pid: number, dryRun = false) => {
  try {
    // Strict validation to prevent command injection
    const numericPid = Number(pid);
    if (!Number.isInteger(numericPid) || numericPid <= 0) {
      return { error: "INVALID_PID" };
    }
    
    if (dryRun) return { success: true };

    // Use validated numeric PID
    await execAsync(`taskkill /PID ${numericPid} /F`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle("clean-temp", async (_event, dryRun = false) => {
  try {
    const tempDir = os.tmpdir();
    const entries = await fs.readdir(tempDir, { withFileTypes: true });
    let deletedCount = 0;
    let failedCount = 0;
    const failedItems: string[] = [];
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    const MAX_SAFE_SIZE = 100 * 1024 * 1024; // 100MB

    const targets: string[] = [];
    
    // Filter files by age and size
    for (const entry of entries) {
      const fullPath = path.join(tempDir, entry.name);
      try {
        const stats = await fs.stat(fullPath);
        const age = now - stats.mtime.getTime();
        
        // Only delete files older than 1 hour and smaller than 100MB
        if (age > ONE_HOUR && stats.size < MAX_SAFE_SIZE) {
          targets.push(fullPath);
        }
      } catch (e) {
        // Skip files we can't access
      }
    }

    if (dryRun) {
      return { success: true, deletedCount: targets.length, failedCount: 0, failedItems: [] };
    }

    const results = await Promise.allSettled(
      targets.map(async (target) => {
        await fs.rm(target, { recursive: true, force: true });
        deletedCount += 1;
      }),
    );

    for (let i = 0; i < results.length; i += 1) {
      if (results[i].status === "rejected") {
        failedCount += 1;
        failedItems.push(targets[i]);
      }
    }

    return { success: true, deletedCount, failedCount, failedItems };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle("open-windows-update", async () => {
  try {
    await shell.openExternal("ms-settings:windowsupdate");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle("configure-disk-cleanup", async () => {
  try {
    // sageset:1 allows the user to configure the flags for cleaner
    await execAsync("cleanmgr /sageset:1");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle("optimize-power-plan", async () => {
  try {
    // Set to High Performance power plan
    // This GUID is consistent across Windows versions for High Performance
    await execAsync("powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle("optimize-visual-effects", async () => {
  try {
    // Adjust visual effects for best performance
    // Disable menu animations
    await execAsync('reg add "HKCU\\Control Panel\\Desktop" /v "UserPreferencesMask" /t REG_BINARY /d "9012038010000000" /f');
    // Disable window animations
    await execAsync('reg add "HKCU\\Control Panel\\Desktop\\WindowMetrics" /v "MinAnimate" /t REG_SZ /d "0" /f');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle("run-disk-cleanup", async () => {
  try {
    // Run standard Windows Disk Cleanup
    await execAsync("cleanmgr /sagerun:1");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle("optimize-services", async () => {
  try {
    const servicesToDisable = [
      "DiagTrack", // Connected User Experiences and Telemetry
      "dmwappushservice", // WAP Push Message Routing Service (telemetry)
      "MapsBroker", // Downloaded Maps Manager
      "lfsvc", // Geolocation Service
    ];
    
    for (const service of servicesToDisable) {
      // Check if service exists first to avoid errors
      try {
        await execAsync(`sc config "${service}" start= disabled`);
        await execAsync(`sc stop "${service}"`);
      } catch (e) {
        // Service might not exist or access denied, ignore
      }
    }
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle("open-startup-settings", async () => {
  try {
    await shell.openExternal("ms-settings:startupapps");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
});

const applyHiddenAttributes = async (targetPath: string) => {
  await execAsync(`attrib +h +s "${targetPath}"`);
};

const removeHiddenAttributes = async (targetPath: string) => {
  await execAsync(`attrib -h -s "${targetPath}"`);
};

const denyUserAccess = async (targetPath: string) => {
  const user = process.env.USERNAME;
  if (!user) throw new Error("USERNAME_NOT_FOUND");
  await execAsync(`icacls "${targetPath}" /deny ${user}:(OI)(CI)F`);
};

const removeDenyAccess = async (targetPath: string) => {
  const user = process.env.USERNAME;
  if (!user) throw new Error("USERNAME_NOT_FOUND");
  await execAsync(`icacls "${targetPath}" /remove:d ${user}`);
  await execAsync(`icacls "${targetPath}" /inheritance:e`);
};

ipcMain.handle(
  "lock-folder-os",
  async (
    _event,
    targetPath: string,
    options?: { hide?: boolean; deny?: boolean },
  ) => {
    try {
      if (process.platform !== "win32") {
        return { error: "UNSUPPORTED_PLATFORM" };
      }
      if (!targetPath) {
        return { error: "PATH_NOT_FOUND" };
      }

      if (options?.hide !== false) {
        await applyHiddenAttributes(targetPath);
      }
      if (options?.deny !== false) {
        await denyUserAccess(targetPath);
      }
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  },
);

ipcMain.handle(
  "unlock-folder-os",
  async (
    _event,
    targetPath: string,
    options?: { hide?: boolean; deny?: boolean },
  ) => {
    try {
      if (process.platform !== "win32") {
        return { error: "UNSUPPORTED_PLATFORM" };
      }
      if (!targetPath) {
        return { error: "PATH_NOT_FOUND" };
      }

      if (options?.deny !== false) {
        await removeDenyAccess(targetPath);
      }
      if (options?.hide !== false) {
        await removeHiddenAttributes(targetPath);
      }
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  },
);

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

const runPowerShellJson = async (command: string) => {
  const escaped = command.replace(/"/g, '\\"');
  const ps = ["$ProgressPreference='SilentlyContinue'", escaped].join("; ");
  const { stdout } = await execAsync(
    `powershell -NoProfile -NonInteractive -Command "${ps}"`,
  );
  const text = (stdout || "").trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    const start = Math.min(
      ...[text.indexOf("["), text.indexOf("{")].filter((i) => i >= 0),
    );
    const end = Math.max(text.lastIndexOf("]"), text.lastIndexOf("}"));
    if (start >= 0 && end > start) {
      const slice = text.slice(start, end + 1);
      const parsed = JSON.parse(slice);
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    throw new Error("POWER_SHELL_JSON_PARSE_FAILED");
  }
};

const expandEnvVars = (input: string) =>
  input.replace(/%([^%]+)%/g, (match, key) => {
    const val = process.env[String(key).toUpperCase()];
    return val || match;
  });

const extractCommandPath = (command?: string) => {
  if (!command) return null;
  const trimmed = command.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('"')) {
    const end = trimmed.indexOf('"', 1);
    if (end > 1) return trimmed.slice(1, end);
  }
  const first = trimmed.split(/\s+/)[0];
  return first || null;
};

process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];

let win: BrowserWindow | null;
const isDev = !app.isPackaged && !!process.env.VITE_DEV_SERVER_URL;

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

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
    return;
  }

  const distDir = process.env.DIST || path.join(__dirname, "../dist");
  win.loadFile(path.join(distDir, "index.html"));
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
    const scanStartTime = Date.now();
    const SCAN_TIMEOUT = 45000; // 45 seconds
    let scanAborted = false;

    // Determine max depth based on drive
    const isCDrive = dirPath.toLowerCase().startsWith("c:");
    const maxDepth = isCDrive ? 5 : 7;

    // Folders to skip entirely
    const skipFolders = new Set([
      "$recycle.bin",
      "system volume information",
      "recovery",
      "node_modules",
      "windows.old",
    ]);

    const scan = async (d: string, depth = 0) => {
      // Check timeout
      if (Date.now() - scanStartTime > SCAN_TIMEOUT) {
        scanAborted = true;
        return;
      }

      // Check depth limit
      if (depth >= maxDepth) {
        return;
      }

      try {
        const entries = await fs.readdir(d, { withFileTypes: true });

        // Skip directories with too many files (likely system cache)
        if (entries.length > 10000) {
          return;
        }
        for (const entry of entries) {
          if (scanAborted) break;

          const fullPath = path.join(d, entry.name);
          const entryNameLower = entry.name.toLowerCase();

          if (entry.isDirectory()) {
            // Skip specific folders
            if (skipFolders.has(entryNameLower)) {
              continue;
            }

            // Skip hidden system folders starting with $
            if (entry.name.startsWith("$")) {
              continue;
            }

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
  } catch (e: any) {
    console.error("Failed to get installed apps:", e);
    return [];
  }
};

ipcMain.handle(
  "get-installed-apps",
  async (_event, options?: { force?: boolean }) => {
    const force = options?.force === true;
    const cacheFresh =
      installedAppsCache.data.length > 0 &&
      Date.now() - installedAppsCache.ts < 5 * 60 * 1000;

    if (!force && cacheFresh) {
      return installedAppsCache.data;
    }

    if (!force && installedAppsCache.data.length > 0) {
      warmInstalledAppsCache();
      return installedAppsCache.data;
    }

    if (!installedAppsInFlight) {
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
  },
);

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
        console.error("UWP detection error:", error);
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
