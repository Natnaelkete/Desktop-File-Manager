import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Rocket,
  Palette,
  Trash2,
  Lock,
  Check,
  ChevronRight,
  Monitor,
  HardDrive,
  UserCheck,
  Zap,
  Clock,
  ShieldAlert,
  Fingerprint,
  RefreshCw,
  Download,
  RotateCcw,
} from "lucide-react";
import { useStore } from "../stores/store";
import { clsx } from "clsx";
import Toggle from "./ui/Toggle";
import PinModal from "./PinModal";

const SettingsPanel: React.FC = () => {
  const {
    theme,
    setTheme,
    showHidden,
    toggleHidden,
    pinHash,
    setPinCredentials,
    confirmOnDelete,
    setConfirmOnDelete,
    autoRenameConflicts,
    setAutoRenameConflicts,
    aggressiveCleanup,
    setAggressiveCleanup,
    weeklyAutoBoost,
    setWeeklyAutoBoost,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    "general" | "security" | "booster"
  >("general");
  const [showPinModal, setShowPinModal] = useState(false);

  const tabs = [
    { id: "general", label: "General", icon: Palette },
    { id: "security", label: "Security", icon: Shield },
    { id: "booster", label: "Booster", icon: Rocket },
  ] as const;

  const handleRunDiskCleanupConfig = async () => {
    try {
      await (window as any).electronAPI.configureDiskCleanup();
    } catch (e: any) {
      console.error("Failed to run configure-disk-cleanup", e);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden h-full select-none">
      {/* Refined Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10 transition-all">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-500/10 rounded-lg">
            <Settings size={18} className="text-primary-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              Settings
            </h2>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full border border-emerald-500/10">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
            Active System
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar (Compact) */}
        <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/10 p-4 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                "w-full group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 relative",
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 text-primary-500"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60",
              )}
            >
              <div
                className={clsx(
                  "p-2 rounded-lg transition-colors",
                  activeTab === tab.id
                    ? "bg-primary-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800",
                )}
              >
                <tab.icon size={16} />
              </div>
              <div className="flex flex-col items-start min-w-0">
                <span className="text-xs font-bold leading-none">
                  {tab.label}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Dense Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-8 space-y-8">
            {activeTab === "general" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <section>
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                    Environment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Theme Switcher */}
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          Theme Mode
                        </span>
                        <Palette size={14} className="text-slate-400" />
                      </div>
                      <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-lg">
                        <button
                          onClick={() => setTheme("light")}
                          className={clsx(
                            "flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all",
                            theme === "light"
                              ? "bg-white text-primary-500 shadow-sm"
                              : "text-slate-500",
                          )}
                        >
                          Light
                        </button>
                        <button
                          onClick={() => setTheme("dark")}
                          className={clsx(
                            "flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all",
                            theme === "dark"
                              ? "bg-slate-800 text-primary-400 shadow-sm border border-slate-700"
                              : "text-slate-500",
                          )}
                        >
                          Dark
                        </button>
                      </div>
                    </div>
                    <Toggle
                      label="Hidden Artifacts"
                      description="Display system & dotted files"
                      checked={showHidden}
                      onChange={toggleHidden}
                    />
                  </div>
                </section>

                <section>
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                    Safeguards
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Toggle
                      label="Delete Confirmation"
                      description="Dialog before moving to trash"
                      checked={confirmOnDelete}
                      onChange={setConfirmOnDelete}
                    />
                    <Toggle
                      label="Confict Auto-Resolve"
                      description="Smart renaming for duplicates"
                      checked={autoRenameConflicts}
                      onChange={setAutoRenameConflicts}
                    />
                  </div>
                </section>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <section>
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                    Privacy Core
                  </h3>

                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                      <div
                        className={clsx(
                          "p-4 rounded-2xl transition-all duration-300",
                          pinHash
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-rose-500/10 text-rose-500",
                        )}
                      >
                        <ShieldAlert size={32} />
                      </div>

                      <div className="flex-1 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            Security PIN Control
                          </h4>
                          {pinHash && (
                            <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-tighter border border-emerald-500/10">
                              Active
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        onClick={() => setShowPinModal(true)}
                        className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold text-xs hover:opacity-90 transition-all flex items-center gap-2"
                      >
                        <Lock size={14} />
                        {pinHash ? "Update PIN" : "Setup PIN"}
                      </button>

                      {pinHash && (
                        <button
                          onClick={() => setPinCredentials("", "")}
                          className="px-4 py-2 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 rounded-lg font-bold text-xs transition-all flex items-center gap-2"
                        >
                          <Trash2 size={14} />
                          Disable PIN
                        </button>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === "booster" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <section>
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                    Engine Preferences
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Toggle
                      label="Deep System Sweep"
                      description="Aggressive log & cache removal"
                      checked={aggressiveCleanup}
                      onChange={setAggressiveCleanup}
                      color="amber"
                    />
                    <Toggle
                      label="Autonomous Pulse"
                      description="Scheduled background optimization"
                      checked={weeklyAutoBoost}
                      onChange={setWeeklyAutoBoost}
                      color="amber"
                    />
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                    Windows Hub
                  </h3>
                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                        <HardDrive size={24} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          Native Disk Cleanup
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          Coordinate Booster targets with Windows core cleanmgr.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleRunDiskCleanupConfig}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-amber-500/50 transition-all group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Settings
                          size={14}
                          className="text-slate-400 group-hover:rotate-90 transition-transform duration-500"
                        />
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          Configure Native Flags
                        </span>
                      </div>
                      <ChevronRight size={14} className="text-slate-400" />
                    </button>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPinModal && (
        <PinModal
          mode="set"
          pinHash={pinHash}
          onClose={() => setShowPinModal(false)}
          onSetPin={(hash, salt) => setPinCredentials(hash, salt)}
          onUnlockSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default SettingsPanel;
