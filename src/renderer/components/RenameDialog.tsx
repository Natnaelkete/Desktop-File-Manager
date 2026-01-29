import React, { useState } from "react";
import { X, Type, Check } from "lucide-react";

interface RenameDialogProps {
  initialName: string;
  onClose: () => void;
  onRename: (newName: string) => Promise<void>;
}

const RenameDialog: React.FC<RenameDialogProps> = ({
  initialName,
  onClose,
  onRename,
}) => {
  const [newName, setNewName] = useState(initialName);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newName || newName === initialName) {
      onClose();
      return;
    }

    setBusy(true);
    try {
      await onRename(newName);
      onClose();
    } catch (error) {
      console.error("Rename failed:", error);
      // Ideally show error to user but for now we assume parent handles complex errors or we just close if successful
      // If we want to keep dialog open on error, onRename should throw or return status.
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 no-drag">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 glass">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-500/10 rounded-lg">
                  <Type className="text-primary-500" size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Rename Item
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 ml-1">
                  New Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !newName}
              className="flex items-center gap-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-primary-500/20 transition-all"
            >
              {busy ? (
                "Renaming..."
              ) : (
                <>
                  <Check size={18} /> Rename
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameDialog;
