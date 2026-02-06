import React, { useMemo, useState } from "react";
import { Rocket, RefreshCw, ShieldCheck, Zap } from "lucide-react";
import { clsx } from "clsx";

type StartupItem = {
  Name?: string;
  Command?: string;
  Location?: string;
  User?: string;
};

type ProcessInfo = {
  Id?: number;
  ProcessName?: string;
  CPU?: number;
  CPUPercent?: number | null;
  WS?: number;
  StartTime?: string;
  MainWindowTitle?: string;
};

type BoostReport = {
  tempDeleted: number;
  tempFailed: number;
  tempFailedItems: string[];
  startupDisabled: number;
  startupFailed: number;
  startupDisabledItems: string[];
  startupFailedItems: string[];
  processesStopped: number;
  processesFailed: number;
  processesStoppedItems: string[];
  processesFailedItems: string[];
  idleCandidates: number;
  healthScore: number;
  completedAt: string;
};

const BoosterPanel: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [boosting, setBoosting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("Idle");
  const [report, setReport] = useState<BoostReport | null>(null);
  const hasReport = !!report;
  const showBoostButton = !hasReport;
  const [lastBoostAt, setLastBoostAt] = useState<number | null>(null);
  const [boostMessage, setBoostMessage] = useState<string | null>(null);
  const [startupFilter, setStartupFilter] = useState<"completed" | "failed">(
    "completed",
  );
  const [idleFilter, setIdleFilter] = useState<"completed" | "failed">(
    "completed",
  );

  const healthLabel = useMemo(() => {
    if (!report) return "Ready";
    if (report.healthScore >= 90) return "Excellent";
    if (report.healthScore >= 75) return "Good";
    if (report.healthScore >= 60) return "Fair";
    return "Needs Attention";
  }, [report]);

  const runBoost = async () => {
    if (boosting) return;
    setError(null);
    setReport(null);
    setBoostMessage(null);
    setBoosting(true);
    setProgress(5);
    setStage("Scanning system");

    try {
      const getProcessList = async () =>
        (await (window as any).electronAPI.getProcessList())?.data || [];

      const startupResult = await (window as any).electronAPI.getStartupItems();
      const startupItems: StartupItem[] = startupResult?.data || [];

      await getProcessList();
      await new Promise((r) => setTimeout(r, 1200));
      const processes: ProcessInfo[] = await getProcessList();

      const idleCandidates = processes.filter((p) => isIdleProcess(p));

      setProgress(35);
      setStage("Cleaning temp files");
      const tempRes = await (window as any).electronAPI.cleanTemp();
      const tempDeleted = tempRes?.deletedCount || 0;
      const tempFailed = tempRes?.failedCount || 0;
      const tempFailedItems: string[] = tempRes?.failedItems || [];

      setProgress(60);
      setStage("Disabling startup items");
      const startupTargets = startupItems.filter((s) => canDisableStartup(s));
      const startupResults = await Promise.allSettled(
        startupTargets.map((s) =>
          (window as any).electronAPI.disableStartupItem(s),
        ),
      );
      const startupDisabledItems: string[] = [];
      const startupFailedItems: string[] = [];
      startupResults.forEach((res, idx) => {
        const label =
          startupTargets[idx]?.Name ||
          startupTargets[idx]?.Command ||
          "Unknown";
        if (res.status === "fulfilled" && !(res as any).value?.error) {
          startupDisabledItems.push(label);
        } else {
          startupFailedItems.push(label);
        }
      });
      const startupDisabled = startupDisabledItems.length;
      const startupFailed = startupFailedItems.length;

      setProgress(80);
      setStage("Stopping idle background apps");
      const killResults = await Promise.allSettled(
        idleCandidates.map((p) =>
          (window as any).electronAPI.killProcess(p.Id),
        ),
      );
      const processesStoppedItems: string[] = [];
      const processesFailedItems: string[] = [];
      killResults.forEach((res, idx) => {
        const proc = idleCandidates[idx];
        const label = `${proc?.ProcessName || "Unknown"} (PID ${proc?.Id})`;
        if (res.status === "fulfilled" && !(res as any).value?.error) {
          processesStoppedItems.push(label);
        } else {
          processesFailedItems.push(label);
        }
      });
      const processesStopped = processesStoppedItems.length;
      const processesFailed = processesFailedItems.length;

      const didAnything =
        tempDeleted > 0 || startupDisabled > 0 || processesStopped > 0;
      const now = Date.now();
      if (!didAnything) {
        if (lastBoostAt && now - lastBoostAt < 10 * 60 * 1000) {
          setBoostMessage("It already boosted.");
        } else {
          setBoostMessage("It already boosted.");
        }
        setStage("Already boosted");
        setProgress(100);
      }

      setProgress(100);
      setStage("Boost complete");

      const scoreBase = 60;
      const score =
        scoreBase +
        (tempDeleted > 0 ? 10 : 0) +
        (startupDisabled > 0 ? 10 : 0) +
        (processesStopped > 0 ? 10 : 0) +
        (tempFailed + startupFailed + processesFailed === 0 ? 10 : 0);

      setReport({
        tempDeleted,
        tempFailed,
        tempFailedItems,
        startupDisabled,
        startupFailed,
        startupDisabledItems,
        startupFailedItems,
        processesStopped,
        processesFailed,
        processesStoppedItems,
        processesFailedItems,
        idleCandidates: idleCandidates.length,
        healthScore: Math.min(100, score),
        completedAt: new Date().toLocaleString(),
      });
      setLastBoostAt(Date.now());
    } catch (e: any) {
      setError(e?.message || "Boost failed");
    } finally {
      setBoosting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden h-full">
      <div className="h-14 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <div className="p-2 bg-emerald-500/10 rounded-lg mr-3">
          <Rocket size={20} className="text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-100">Booster</h2>
        <div className="ml-auto flex items-center gap-2">
          {!hasReport && (
            <button
              onClick={runBoost}
              disabled={boosting}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2 transition-transform",
                boosting
                  ? "bg-slate-700 text-slate-300"
                  : "bg-emerald-500 text-white shadow-emerald-500/30 hover:scale-105",
              )}
            >
              <RefreshCw
                size={14}
                className={clsx(boosting && "animate-spin")}
              />
              Boost Now
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm font-semibold">
            {error}
          </div>
        )}

        <div
          className={clsx(
            "grid grid-cols-1 gap-8 items-center",
            hasReport ? "xl:grid-cols-[1fr]" : "xl:grid-cols-[1fr]",
          )}
        >
          {showBoostButton && (
            <div className="relative flex flex-col items-center justify-center min-h-[520px]">
              <div className="relative cursor-pointer">
                <div className="h-72 w-72 rounded-full bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 shadow-2xl flex items-center justify-center">
                  <div
                    className={clsx(
                      "h-60 w-60 rounded-full border-8  border-slate-800 flex items-center justify-center",
                      boosting && "animate-pulse",
                    )}
                  >
                    <button
                      onClick={runBoost}
                      disabled={boosting}
                      className={clsx(
                        "h-44 w-44 rounded-full flex flex-col items-center justify-center text-center transition-all cursor-pointer",
                        boosting
                          ? "bg-slate-700 text-slate-200"
                          : "bg-emerald-500 text-white shadow-[0_0_40px_rgba(16,185,129,0.6)] hover:scale-105",
                      )}
                    >
                      <div className="text-3xl font-black tracking-tight">
                        {boosting ? "BOOSTING" : "BOOST"}
                      </div>
                      <div className="text-xs uppercase tracking-[0.3em] mt-2">
                        {boosting ? `${progress}%` : "Ready"}
                      </div>
                    </button>
                  </div>
                </div>
                <div
                  className="absolute inset-0 rounded-full border-4 border-emerald-500/40 animate-spin pointer-events-none"
                  style={{ animationDuration: "8s" }}
                />
                <div className="absolute inset-4 rounded-full border-2 border-emerald-400/20 pointer-events-none" />
              </div>
              <div className="mt-6 text-center">
                {/* <div className="text-sm uppercase tracking-[0.3em] text-emerald-400">
                  {stage}
                </div> */}
                {boostMessage && (
                  <div className="mt-2 text-xs font-bold text-emerald-300">
                    {boostMessage}
                  </div>
                )}
              </div>
            </div>
          )}

          {hasReport && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-widest">
                    System Health
                  </div>
                  <div className="text-2xl font-black text-slate-100">
                    {report ? `${report.healthScore}%` : "--"} • {healthLabel}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="text-xs text-slate-400 uppercase tracking-widest">
                    Temp Cleanup
                  </div>
                  <div className="mt-2 text-lg font-bold text-slate-100">
                    {report ? report.tempDeleted : "--"} cleaned
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Failed: {report ? report.tempFailed : "--"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="text-xs text-slate-400 uppercase tracking-widest">
                    Startup Items
                  </div>
                  <div className="mt-2 text-lg font-bold text-slate-100">
                    {report ? report.startupDisabled : "--"} disabled
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Failed: {report ? report.startupFailed : "--"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="text-xs text-slate-400 uppercase tracking-widest">
                    Idle Apps
                  </div>
                  <div className="mt-2 text-lg font-bold text-slate-100">
                    {report ? report.processesStopped : "--"} stopped
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Candidates: {report ? report.idleCandidates : "--"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="text-xs text-slate-400 uppercase tracking-widest">
                    Status
                  </div>
                  <div className="mt-2 text-lg font-bold text-slate-100">
                    {boosting ? "Working" : report ? "Completed" : "Idle"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {report ? report.completedAt : "Run Booster to get report"}
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-slate-400 uppercase tracking-widest">
                      Startup Results
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <button
                        onClick={() => setStartupFilter("completed")}
                        className={clsx(
                          "px-2 py-0.5 rounded",
                          startupFilter === "completed"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "text-slate-400",
                        )}
                      >
                        Completed
                      </button>
                      <button
                        onClick={() => setStartupFilter("failed")}
                        className={clsx(
                          "px-2 py-0.5 rounded",
                          startupFilter === "failed"
                            ? "bg-rose-500/20 text-rose-300"
                            : "text-slate-400",
                        )}
                      >
                        Failed
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin text-[11px]">
                    {(startupFilter === "completed"
                      ? report?.startupDisabledItems
                      : report?.startupFailedItems
                    )?.map((item) => (
                      <div
                        key={item}
                        className="text-slate-300 bg-slate-900/60 rounded px-2 py-1 truncate"
                      >
                        {item}
                      </div>
                    ))}
                    {(
                      startupFilter === "completed"
                        ? report?.startupDisabledItems
                        : report?.startupFailedItems
                    )?.length === 0 && (
                      <div className="text-slate-500">No items.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-slate-400 uppercase tracking-widest">
                      Idle App Results
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <button
                        onClick={() => setIdleFilter("completed")}
                        className={clsx(
                          "px-2 py-0.5 rounded",
                          idleFilter === "completed"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "text-slate-400",
                        )}
                      >
                        Completed
                      </button>
                      <button
                        onClick={() => setIdleFilter("failed")}
                        className={clsx(
                          "px-2 py-0.5 rounded",
                          idleFilter === "failed"
                            ? "bg-rose-500/20 text-rose-300"
                            : "text-slate-400",
                        )}
                      >
                        Failed
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin text-[11px]">
                    {(idleFilter === "completed"
                      ? report?.processesStoppedItems
                      : report?.processesFailedItems
                    )?.map((item) => (
                      <div
                        key={item}
                        className="text-slate-300 bg-slate-900/60 rounded px-2 py-1 truncate"
                      >
                        {item}
                      </div>
                    ))}
                    {(
                      idleFilter === "completed"
                        ? report?.processesStoppedItems
                        : report?.processesFailedItems
                    )?.length === 0 && (
                      <div className="text-slate-500">No items.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="text-xs text-slate-400 uppercase tracking-widest mb-3">
                    Cleanup Failed
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin text-[11px]">
                    {report?.tempFailedItems?.map((item) => (
                      <div
                        key={item}
                        className="text-rose-300 bg-rose-500/10 rounded px-2 py-1 truncate"
                      >
                        {item}
                      </div>
                    ))}
                    {report?.tempFailedItems?.length === 0 && (
                      <div className="text-slate-500">No failed items.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoosterPanel;

const PROTECTED_PROCESSES = new Set(
  [
    "system",
    "system idle process",
    "registry",
    "smss",
    "csrss",
    "wininit",
    "winlogon",
    "services",
    "lsass",
    "svchost",
    "explorer",
    "dwm",
    "fontdrvhost",
    "audiodg",
    "wudfhost",
    "sihost",
    "searchindexer",
  ].map((p) => p.toLowerCase()),
);

const PROTECTED_KEYWORDS = [
  "antimalware",
  "defender",
  "security",
  "windows",
  "microsoft",
  "intel",
  "amd",
  "radeon",
  "nvidia",
  "graphics",
  "display",
  "audio",
  "realtek",
  "dolby",
  "touchpad",
  "synaptics",
  "elan",
  "hid",
  "bluetooth",
  "network",
  "vpn",
  "kernel",
  "service",
  "driver",
].map((k) => k.toLowerCase());

const isProtectedProcess = (name?: string) => {
  if (!name) return true;
  const lower = name.toLowerCase();
  if (PROTECTED_PROCESSES.has(lower)) return true;
  return PROTECTED_KEYWORDS.some((k) => lower.includes(k));
};

const parseProcessTime = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isIdleProcess = (p: ProcessInfo) => {
  if (!p) return false;
  if (isProtectedProcess(p.ProcessName)) return false;
  if (p.MainWindowTitle && p.MainWindowTitle.trim().length > 0) return false;
  if (typeof p.CPUPercent === "number" && p.CPUPercent > 1) return false;
  const mem = p.WS || 0;
  if (mem > 300 * 1024 * 1024) return false;
  const started = parseProcessTime(p.StartTime);
  if (!started) return false;
  const uptimeMs = Date.now() - started.getTime();
  return uptimeMs > 2 * 60 * 1000;
};

const canDisableStartup = (item: StartupItem) => {
  const location = (item.Location || "").toLowerCase();
  if (location.includes("\\microsoft\\windows\\currentversion\\run")) {
    return true;
  }
  if (location.includes("\\microsoft\\windows\\currentversion\\runonce")) {
    return true;
  }
  if (location.includes("startup")) {
    return true;
  }
  return false;
};
