import React, { useMemo, useState } from "react";
import { X, Wand2, Image, FileText } from "lucide-react";
import { FileItem } from "../stores/store";
import { clsx } from "clsx";

interface QuickActionsModalProps {
  file: FileItem;
  onClose: () => void;
}

const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];

const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
  file,
  onClose,
}) => {
  const [busy, setBusy] = useState(false);

  const ext = useMemo(() => {
    const parts = file.name.split(".");
    return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
  }, [file.name]);

  const isImage = imageExts.includes(ext);
  const isPdf = ext === "pdf";

  const runAction = async (action: string, payload: any) => {
    setBusy(true);
    const result = await (window as any).electronAPI.quickAction(action, {
      filePath: file.path,
      ...payload,
    });
    setBusy(false);

    if (result?.error) {
      alert(`Action failed: ${result.error}`);
      return;
    }

    if (result?.outputPath) {
      alert(`Saved to: ${result.outputPath}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 font-semibold">
            <Wand2 size={18} className="text-primary-500" />
            <span>Quick Actions</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-sm text-slate-500 dark:text-slate-300">
            {file.name}
          </div>

          {isImage && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase">
                <Image size={12} /> Convert
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "PNG", format: "png" },
                  { label: "JPG", format: "jpg" },
                  { label: "WEBP", format: "webp" },
                ].map((opt) => (
                  <button
                    key={opt.format}
                    disabled={busy}
                    onClick={() =>
                      runAction("convert-image", { format: opt.format })
                    }
                    className={clsx(
                      "px-3 py-2 rounded-lg text-sm border",
                      busy
                        ? "text-slate-400 border-slate-200 dark:border-slate-800"
                        : "text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase">
                <Image size={12} /> Resize
              </div>
              <div className="flex flex-wrap gap-2">
                {[75, 50, 25].map((percent) => (
                  <button
                    key={percent}
                    disabled={busy}
                    onClick={() =>
                      runAction("resize-image", { scale: percent / 100 })
                    }
                    className={clsx(
                      "px-3 py-2 rounded-lg text-sm border",
                      busy
                        ? "text-slate-400 border-slate-200 dark:border-slate-800"
                        : "text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800",
                    )}
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {isPdf && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase">
                <FileText size={12} /> PDF
              </div>
              <button
                disabled={busy}
                onClick={() => runAction("optimize-pdf", {})}
                className={clsx(
                  "px-3 py-2 rounded-lg text-sm border",
                  busy
                    ? "text-slate-400 border-slate-200 dark:border-slate-800"
                    : "text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800",
                )}
              >
                Compress / Optimize PDF
              </button>
            </div>
          )}

          {!isImage && !isPdf && (
            <div className="text-sm text-slate-400">
              No quick actions available for this file type.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickActionsModal;
