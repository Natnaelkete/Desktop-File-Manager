import React from "react";
import { clsx } from "clsx";

export interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  color?: "emerald" | "amber" | "primary";
}

const Toggle: React.FC<ToggleProps> = ({ label, description, checked, onChange, color = "primary" }) => {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 hover:border-primary-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-all text-left outline-none group w-full"
    >
      <div
        className={clsx(
          "relative w-12 h-6 rounded-full transition-colors shrink-0",
          checked
            ? color === "emerald"
              ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              : color === "amber"
                ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                : "bg-primary-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
            : "bg-slate-200 dark:bg-slate-800",
        )}
      >
        <div
          className={clsx(
            "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked && "translate-x-6",
          )}
        />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span
          className={clsx(
            "text-sm font-bold transition-colors truncate",
            checked
              ? color === "emerald"
                ? "text-emerald-500 dark:text-emerald-400"
                : color === "amber"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-primary-600 dark:text-primary-400"
              : "text-slate-700 dark:text-slate-200",
          )}
        >
          {label}
        </span>
        {description && (
          <span className="text-[10px] text-slate-500 font-medium truncate">
            {description}
          </span>
        )}
      </div>
    </button>
  );
};

export default Toggle;
