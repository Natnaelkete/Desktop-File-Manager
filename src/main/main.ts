import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  protocol,
  Menu,
  net,
} from "electron";
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

const initRegedit = () => {
  try {
    console.log(`Setting regedit VBS path to: ${vbsPath}`);
    regedit.setExternalVBSLocation(vbsPath);
  } catch (e) {
    console.error("Failed to set regedit VBS path:", e);
  }
};

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
      `HKCR\\Applications\\${exe}\\shell\\open\\command`,
    ];

    let appPath = "";
    try {
      const appResult = await regList(appKeys);
      for (const key of appKeys) {
        const result = appResult?.[key];
        if (!result) continue;

        // For "App Paths", the value is usually in the default value (empty string key)
        const defaultVal = result.values?.[""]?.value as string;
        if (defaultVal) {
          appPath = defaultVal;
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

      // Clean up app path - it might contain quotes or arguments like %1
      let cleanAppPath = appPath.trim();

      // If it starts with a quote, extract the part between quotes
      if (cleanAppPath.startsWith('"')) {
        const nextQuote = cleanAppPath.indexOf('"', 1);
        if (nextQuote !== -1) {
          cleanAppPath = cleanAppPath.substring(1, nextQuote);
        }
      } else {
        // If no quotes, it might still have arguments.
        // We assume the executable ends at .exe
        const exeIndex = cleanAppPath.toLowerCase().indexOf(".exe");
        if (exeIndex !== -1) {
          cleanAppPath = cleanAppPath.substring(0, exeIndex + 4);
        }
      }

      // Final validation of path existence
      if (!fs_native.existsSync(cleanAppPath)) {
        // Try one more thing: maybe it's just the exe name and we should search PATH
        // but for App Paths it should be absolute.
        return { error: `EXECUTABLE_NOT_FOUND: ${cleanAppPath}` };
      }

      const child = spawn(cleanAppPath, [filePath], {
        detached: true,
        stdio: "ignore",
      });

      child.on("error", (err) => {
        console.error("Failed to spawn app:", err);
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

ipcMain.handle(
  "disable-startup-item",
  async (_event, item: any, dryRun = false) => {
    try {
      if (!item?.Name || !item?.Location) {
        return { error: "INVALID_STARTUP_ITEM" };
      }

      if (dryRun) return { success: true };

      const location = String(item.Location).trim();
      const name = String(item.Name).trim();

      // Validate inputs to prevent command injection
      if (
        location.includes('"') ||
        location.includes("&") ||
        location.includes("|")
      ) {
        return { error: "INVALID_LOCATION_FORMAT" };
      }
      if (name.includes('"') || name.includes("&") || name.includes("|")) {
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
        await execAsync(
          `reg delete "${escapedLocation}" /v "${escapedName}" /f`,
        );
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
  },
);

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
      return {
        success: true,
        deletedCount: targets.length,
        failedCount: 0,
        failedItems: [],
      };
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
    await execAsync(
      'reg add "HKCU\\Control Panel\\Desktop" /v "UserPreferencesMask" /t REG_BINARY /d "9012038010000000" /f',
    );
    // Disable window animations
    await execAsync(
      'reg add "HKCU\\Control Panel\\Desktop\\WindowMetrics" /v "MinAnimate" /t REG_SZ /d "0" /f',
    );
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
    show: false, // Don't show the window until it's ready, improves perceived startup
    backgroundColor: "#0f172a", // Match app theme to avoid white flash
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

  win.once("ready-to-show", () => {
    if (win) {
      win.show();
      // After showing the window, perform non-critical initializations
      initRegedit();
      loadInstalledAppsCache().finally(() => {
        warmInstalledAppsCache();
      });
    }
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
    return;
  }

  const distDir = process.env.DIST || path.join(__dirname, "../dist");
  win.loadFile(path.join(distDir, "index.html"));

  // Listen for device changes (USB insertion/removal)
  // WM_DEVICECHANGE = 0x0219
  // DBT_DEVICEARRIVAL = 0x8000
  // DBT_DEVICEREMOVECOMPLETE = 0x8004
  if (process.platform === "win32") {
    win.hookWindowMessage(0x0219, (wParam, lParam) => {
      // wParam is a Buffer in Electron for hookWindowMessage, we need to read it
      // Actually, Electron docs say:
      // "The callback is called with (wParam, lParam). The types of these parameters depend on the OS."
      // On Windows, they are Integers? Or Buffers?
      // Recent Electron versions might return Buffers.
      // Let's check type safely.
      let wValue = 0;
      if (Buffer.isBuffer(wParam)) {
        wValue = wParam.readUInt32LE(0); // Assuming 32-bit LE for message params
      } else if (typeof wParam === "number") {
        wValue = wParam;
      }

      if (wValue === 0x8004) {
        // Device Removal: Immediate update
        drivesCache = null;
        win?.webContents.send("drives-changed");

        // Follow up update to ensure clean state
        setTimeout(() => {
          drivesCache = null;
          win?.webContents.send("drives-changed");
        }, 1000);
      } else if (wValue === 0x8000) {
        // Device Insertion: Poll multiple times to catch the drive as soon as it mounts
        // Windows needs time to assign a drive letter, so we check at increasing intervals
        drivesCache = null;
        [500, 1000, 2000, 4000].forEach((delay) => {
          setTimeout(() => {
            drivesCache = null;
            win?.webContents.send("drives-changed");
          }, delay);
        });
      }
    });
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
  // Create default menu for shortcuts (Copy, Paste, etc.)
  const template: any[] = [
    {
      label: "Edit",
      submenu: [
        { role: "undo", accelerator: "CmdOrCtrl+Z" },
        { role: "redo", accelerator: "CmdOrCtrl+Y" },
        { type: "separator" },
        { role: "cut", accelerator: "CmdOrCtrl+X" },
        { role: "copy", accelerator: "CmdOrCtrl+C" },
        { role: "paste", accelerator: "CmdOrCtrl+V" },
        { role: "delete" },
        { type: "separator" },
        { role: "selectAll", accelerator: "CmdOrCtrl+A" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  ipcMain.on("show-context-menu", (event) => {
    const template = [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "selectAll" },
    ];
    const menu = Menu.buildFromTemplate(template as any);
    menu.popup({
      window: BrowserWindow.fromWebContents(event.sender) || undefined,
    });
  });

  ipcMain.on("edit-action", (event, action) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;

    switch (action) {
      case "undo":
        win.webContents.undo();
        break;
      case "redo":
        win.webContents.redo();
        break;
      case "cut":
        win.webContents.cut();
        break;
      case "copy":
        win.webContents.copy();
        break;
      case "paste":
        win.webContents.paste();
        break;
      case "selectAll":
        win.webContents.selectAll();
        break;
    }
  });

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

const listMtpContent = async (deviceName: string, relativePath: string) => {
  const psScript = `
    $deviceName = "${deviceName.replace(/"/g, '`"')}"
    $relativePath = "${(relativePath || "").replace(/"/g, '`"')}"
    $shell = New-Object -ComObject Shell.Application
    $pc = $shell.NameSpace(17)
    $device = $pc.Items() | Where-Object { $_.Name -eq $deviceName } | Select-Object -First 1
    
    if (!$device) { return @() }
    
    $current = $device.GetFolder
    if ($relativePath) {
        $parts = $relativePath -split "[/\\\\]"
        foreach ($part in $parts) {
            if (!$part) { continue }
            $found = $current.Items() | Where-Object { $_.Name -eq $part } | Select-Object -First 1
            if ($found -and $found.IsFolder) {
                $current = $found.GetFolder
            } else {
               return @() 
            }
        }
    }
    
    $items = $current.Items()
    $data = @()
    foreach ($item in $items) {
        $data += @{
            name = $item.Name
            isDirectory = $item.IsFolder
            size = 0
            modifiedAt = 0
            createdAt = 0
        }
    }
    $data | ConvertTo-Json -Compress
  `;

  try {
    const encodedCommand = Buffer.from(psScript, "utf16le").toString("base64");
    const { stdout } = await execAsync(
      `powershell -NoProfile -EncodedCommand ${encodedCommand}`,
    );
    if (!stdout || !stdout.trim()) return [];
    const parsed = JSON.parse(stdout);
    return (Array.isArray(parsed) ? parsed : [parsed]).map((item: any) => ({
      name: item.name,
      path: `mtp://${deviceName}/${relativePath ? relativePath + "/" : ""}${item.name}`,
      isDirectory: item.isDirectory,
      size: item.size || 0,
      modifiedAt: Date.now(),
      createdAt: Date.now(),
    }));
  } catch (e) {
    console.error("MTP List Error:", e);
    return [];
  }
};

ipcMain.handle("list-dir", async (_event, dirPath: string) => {
  try {
    // Handle MTP devices - In-app listing via PowerShell/COM
    if (dirPath.startsWith("mtp://")) {
      const raw = dirPath.replace(/\\/g, "/");
      const match = raw.match(/^mtp:\/\/([^\/]+)(?:\/(.*))?$/);
      if (match) {
        const deviceName = decodeURIComponent(match[1]);
        const relativePath = match[2] ? decodeURIComponent(match[2]) : "";
        return await listMtpContent(deviceName, relativePath);
      }
      return [];
    }

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

let drivesCache: { data: any[]; ts: number } | null = null;
const DRIVES_CACHE_TTL = 30000; // 30 seconds

const fetchDrives = async () => {
  if (process.platform !== "win32") return [];

  let formattedDrives: any[] = [];

  // Parallel execution for speed
  const [psStdout, wpdStdout] = await Promise.all([
    (async () => {
      try {
        const cmd = `Get-PSDrive -PSProvider FileSystem | Select-Object Name, Used, Free, Root, Description, DisplayRoot | ConvertTo-Json -Compress`;
        const { stdout } = await execAsync(
          `powershell -NoProfile -Command "${cmd}"`,
        );
        return stdout;
      } catch (e) {
        console.error("PSDrive error:", e);
        return "";
      }
    })(),
    (async () => {
      try {
        const cmd = `Get-PnpDevice -PresentOnly | Where-Object { $_.Class -eq 'WPD' } | Select-Object FriendlyName, InstanceId, Class | ConvertTo-Json -Compress`;
        const { stdout } = await execAsync(
          `powershell -NoProfile -Command "${cmd}"`,
        );
        return stdout;
      } catch (e) {
        console.error("WPD error:", e);
        return "";
      }
    })(),
  ]);

  // Process Fixed Drives (PSDrive)
  if (psStdout && psStdout.trim()) {
    try {
      const parsed = JSON.parse(psStdout);
      const drives = Array.isArray(parsed) ? parsed : [parsed];
      formattedDrives = drives
        .map((d: any) => {
          const name = d.Name;
          const used = d.Used || 0;
          const free = d.Free || 0;
          const total = used + free;
          return {
            name: `${name}:`,
            path: d.Root || `${name}:\\`,
            volumeName: d.Description || d.DisplayRoot || "Local Disk",
            used,
            free,
            total,
            type: "Fixed",
            isRemovable: false,
          };
        })
        .filter(Boolean);
    } catch (e) {
      console.error("JSON parse error for Get-PSDrive:", e);
    }
  }

  // Process WPD/MTP Drives
  if (wpdStdout && wpdStdout.trim()) {
    try {
      const parsed = JSON.parse(wpdStdout);
      const wpdDevices = Array.isArray(parsed) ? parsed : [parsed];

      const existingNames = new Set(
        formattedDrives.map((d) => d.volumeName.toLowerCase()),
      );
      const existingLetters = new Set(
        formattedDrives.map((d) => d.name.replace(/[\\:]/g, "").toLowerCase()),
      );

      const mtpDrives = wpdDevices
        .filter((d: any) => {
          if (!d.FriendlyName) return false;
          const nameLower = d.FriendlyName.toLowerCase();
          if (/^[a-z]:\\?$/.test(nameLower)) return false;
          if (existingNames.has(nameLower)) return false;
          if (existingLetters.has(nameLower.replace(/[\\:]/g, "")))
            return false;
          return true;
        })
        .map((d: any) => ({
          name: d.FriendlyName || "Portable Device",
          path: `mtp://${d.FriendlyName}`,
          volumeName: d.FriendlyName || "Portable Device",
          used: 0,
          free: 0,
          total: 0,
          type: "MTP",
          isRemovable: true,
          isMTP: true,
        }));

      if (mtpDrives.length > 0) {
        formattedDrives = [...formattedDrives, ...mtpDrives];
      }
    } catch (e) {
      console.error("WPD/MTP detection failed:", e);
    }
  }

  return formattedDrives;
};

// Polling for drive changes to ensure UI updates even if hook misses
setInterval(async () => {
  if (!win || win.isDestroyed()) return;

  try {
    const currentDrives = await fetchDrives();
    const currentStr = JSON.stringify(currentDrives);
    const cacheStr = drivesCache ? JSON.stringify(drivesCache.data) : "";

    if (currentStr !== cacheStr) {
      drivesCache = { data: currentDrives, ts: Date.now() };
      win.webContents.send("drives-changed");
    }
  } catch (e) {
    console.error("Drive polling error:", e);
  }
}, 3000); // Check every 3 seconds

ipcMain.handle("get-drives", async (_event, forceRefresh: boolean = false) => {
  try {
    if (
      !forceRefresh &&
      drivesCache &&
      Date.now() - drivesCache.ts < DRIVES_CACHE_TTL
    ) {
      return drivesCache.data;
    }

    const drives = await fetchDrives();
    if (drives.length > 0) {
      drivesCache = { data: drives, ts: Date.now() };
    }
    return drives;
  } catch (error: any) {
    console.error("Error getting drives:", error);
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

ipcMain.handle("path-dirname", async (_event, p: string) => {
  return path.dirname(p);
});

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
ipcMain.handle(
  "deep-search",
  async (_event, query: string, searchId: string) => {
    if (!query || query.trim().length < 2) return;
    let results: any[] = [];
    const chunkSize = 50;

    // Sanitize query for different search methods
    const sanitizedQuery = query.trim();
    // For SQL/Everything, replace spaces with wildcards or handle multiple terms
    const wildQuery = sanitizedQuery.replace(/\s+/g, "%");
    const esQuery = sanitizedQuery.replace(/\s+/g, "*");

    const sendBatch = () => {
      if (results.length > 0) {
        _event.sender.send("deep-search-update", {
          results: [...results],
          isComplete: false,
          searchId,
        });
        results = [];
      }
    };

    // TIER 0: Direct check for common paths and Desktop/Documents
    try {
      const home = os.homedir();
      const quickCheckPaths = [
        path.join(home, "Desktop"),
        path.join(home, "Documents"),
        path.join(home, "Downloads"),
      ];

      for (const base of quickCheckPaths) {
        if (!fs_native.existsSync(base)) continue;
        const items = await fs.readdir(base);
        for (const item of items) {
          // Case-insensitive match for the query in the name
          if (
            item.toLowerCase().includes(sanitizedQuery.toLowerCase()) ||
            item
              .toLowerCase()
              .includes(sanitizedQuery.replace(/\s+/g, "_").toLowerCase())
          ) {
            const fullPath = path.join(base, item);
            results.push({
              name: item,
              path: fullPath,
              isDirectory: fs_native.statSync(fullPath).isDirectory(),
              size: 0,
              modifiedAt: Date.now(),
            });
          }
        }
      }
      if (results.length > 0) sendBatch();
    } catch (e) {}

    // 1. Try "Everything" CLI (es.exe) if available
    try {
      const { stdout: esPath } = await execAsync("where es.exe").catch(() => ({
        stdout: "",
      }));
      if (esPath) {
        // Use *wildcards* for spaces to handle things like "Web Development" -> "Web_Development"
        const esProcess = spawn("es.exe", ["-n", "5000", `*${esQuery}*`]);
        let buffer = "";
        esProcess.stdout.on("data", (data) => {
          buffer += data.toString();
          const lines = buffer.split("\r\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const fullPath = line.trim();
            if (!fullPath) continue;
            results.push({
              name: path.basename(fullPath),
              path: fullPath,
              isDirectory: !path.extname(fullPath),
              size: 0,
              modifiedAt: Date.now(),
            });
            if (results.length >= chunkSize) sendBatch();
          }
        });

        await new Promise((resolve) => esProcess.on("close", resolve));
        sendBatch();
      }
    } catch (e) {}

    // 2. Try Windows Search Indexer via PowerShell
    try {
      const psCommand = `
        $query = "${wildQuery}"
        $sql = "SELECT TOP 5000 System.ItemName, System.ItemPathDisplay, System.Size, System.DateModified FROM SystemIndex WHERE (System.ItemName LIKE '%$query%' OR System.ItemPathDisplay LIKE '%$query%') ORDER BY System.DateModified DESC"
        $conn = New-Object -ComObject ADODB.Connection
        $rs = New-Object -ComObject ADODB.Recordset
        $conn.Open("Provider=Search.CollatorDSO;Extended Properties='Application=Windows';")
        $rs.Open($sql, $conn)
        while(-not $rs.EOF) {
          $item = @{
            name = $rs.Fields.Item("System.ItemName").Value
            path = $rs.Fields.Item("System.ItemPathDisplay").Value
            size = $rs.Fields.Item("System.Size").Value
            modified = $rs.Fields.Item("System.DateModified").Value
          }
          $item | ConvertTo-Json -Compress
          $rs.MoveNext()
        }
      `;
      const ps = spawn("powershell", ["-Command", psCommand]);
      let buffer = "";
      ps.stdout.on("data", (data) => {
        buffer += data.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          try {
            const trimmed = line.trim();
            if (!trimmed) continue;
            const item = JSON.parse(trimmed);
            results.push({
              name: item.name,
              path: item.path,
              isDirectory: !path.extname(item.path),
              size: item.size || 0,
              modifiedAt: item.modified ? new Date(item.modified).getTime() : 0,
            });
            if (results.length >= chunkSize) sendBatch();
          } catch (e) {}
        }
      });

      await new Promise((resolve) => ps.on("close", resolve));
      sendBatch();
    } catch (e) {}

    // 3. Fallback to fast DIR command with flexible matching across all drives and user folders
    let drives: string[] = ["C"];
    let userPaths: string[] = [];
    try {
      const { stdout: driveOut } = await execAsync(
        'powershell "Get-PSDrive -PSProvider FileSystem | Select-Object Name"',
      ).catch(() => ({ stdout: "Name\n----\nC" }));
      const lines = driveOut.trim().split("\n").slice(2);
      drives = lines
        .map((l) => l.trim())
        .filter((d) => d.length === 1 && d !== "A" && d !== "B");
      if (drives.length === 0) drives = ["C"];

      // Explicitly target user library paths
      const home = os.homedir();
      userPaths = [
        path.join(home, "Desktop"),
        path.join(home, "Documents"),
        path.join(home, "Downloads"),
      ].filter((p) => {
        try {
          return fs_native.existsSync(p);
        } catch (e) {
          return false;
        }
      });
    } catch (e) {}

    const searchPoints = [
      ...userPaths.map((p) => ({ path: p, isDrive: false })),
      ...drives.map((d) => ({ path: `${d}:\\`, isDrive: true })),
    ];

    const seenPaths = new Set<string>();

    const searchPromises = searchPoints.map(async (point) => {
      return new Promise<void>((resolve) => {
        const dirQuery = sanitizedQuery.replace(/\s+/g, "*");
        const cmd = point.isDrive
          ? spawn("cmd.exe", [
              "/c",
              `cd /d ${point.path} && dir /s /b /a *${dirQuery}*`,
            ])
          : spawn("cmd.exe", [
              "/c",
              `dir /s /b /a "${path.join(point.path, `*${dirQuery}*`)}"`,
            ]);

        let buffer = "";
        cmd.stdout.on("data", (data) => {
          buffer += data.toString();
          const lines = buffer.split("\r\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const fullPath = line.trim();
            if (!fullPath || seenPaths.has(fullPath.toLowerCase())) continue;

            seenPaths.add(fullPath.toLowerCase());
            results.push({
              name: path.basename(fullPath),
              path: fullPath,
              isDirectory: !path.extname(fullPath),
              size: 0,
              modifiedAt: Date.now(),
            });
            if (results.length >= chunkSize) sendBatch();
          }
        });
        cmd.on("close", () => resolve());
        setTimeout(() => {
          cmd.kill();
          resolve();
        }, 20000);
      });
    });

    await Promise.all(searchPromises);
    sendBatch();
    _event.sender.send("deep-search-update", {
      results: [],
      isComplete: true,
      searchId,
    });
  },
);
