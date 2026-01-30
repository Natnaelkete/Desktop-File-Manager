import React from "react";
import { motion } from "framer-motion";
import { X, Info, Calendar, HardDrive, FileText, Folder } from "lucide-react";
import { FileItem } from "../stores/store";

interface PropertiesModalProps {
  file?: FileItem;
  items?: FileItem[];
  onClose: () => void;
}

const PropertiesModal: React.FC<PropertiesModalProps> = ({
  file,
  items,
  onClose,
}) => {
  const isMulti = !!items && items.length > 1;
  const displayName = isMulti ? `${items!.length} items` : file?.name || "";
  const displayPath = isMulti ? "Multiple locations" : file?.path || "";
  const [size, setSize] = React.useState<number>(file?.size ?? 0);
  const [calculating, setCalculating] = React.useState(false);
  const [errorCount, setErrorCount] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    const fetchSingleSize = async () => {
      if (!file) return;
      if (!file.isDirectory) {
        setSize(file.size || 0);
        return;
      }
      setCalculating(true);
      try {
        const stats = await (window as any).electronAPI.getAdvancedStats(
          file.path,
        );
        if (!cancelled) {
          if (stats && !stats.error) {
            setSize(stats.totalSize || 0);
          }
        }
      } catch (e) {
        if (!cancelled) console.error(e);
      } finally {
        if (!cancelled) setCalculating(false);
      }
    };

    const fetchMultiSize = async () => {
      if (!items || items.length <= 1) return;
      setCalculating(true);
      setErrorCount(0);
      let total = 0;
      let errors = 0;

      await Promise.all(
        items.map(async (item) => {
          if (item.isDirectory) {
            try {
              const stats = await (window as any).electronAPI.getAdvancedStats(
                item.path,
              );
              if (
                stats &&
                !stats.error &&
                typeof stats.totalSize === "number"
              ) {
                total += stats.totalSize;
              } else {
                errors += 1;
              }
            } catch (e) {
              errors += 1;
            }
          } else {
            total += item.size || 0;
          }
        }),
      );

      if (!cancelled) {
        setSize(total);
        setErrorCount(errors);
        setCalculating(false);
      }
    };

    if (isMulti) {
      fetchMultiSize();
    } else {
      fetchSingleSize();
    }

    return () => {
      cancelled = true;
    };
  }, [file, items, isMulti]);

  const formatSize = (bytes: number) => {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return "0 B";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const readable =
      parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    return `${readable} (${bytes.toLocaleString()} bytes)`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 font-semibold">
            <Info size={18} className="text-primary-500" />
            <span>Properties</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-primary-100 dark:bg-primary-900/20 rounded-xl">
              {file?.isDirectory || isMulti ? (
                <Folder
                  size={32}
                  className="text-amber-500 fill-amber-500/20"
                />
              ) : (
                <FileText size={32} className="text-primary-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-lg truncate mb-1">{displayName}</h3>
              <p className="text-xs text-slate-500 break-all">{displayPath}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <HardDrive size={12} />
                <span>Size</span>
              </div>
              <p className="font-semibold text-sm">
                {calculating ? "Calculating..." : formatSize(size)}
              </p>
              {errorCount > 0 && (
                <p className="text-[10px] text-amber-500 mt-1">
                  {errorCount} item{errorCount > 1 ? "s" : ""} could not be read
                </p>
              )}
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Calendar size={12} />
                <span>Modified</span>
              </div>
              <p className="font-semibold text-sm">
                {isMulti || !file
                  ? "Multiple"
                  : new Date(file.modifiedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Type</span>
              <span className="font-medium">
                {isMulti
                  ? "Multiple Items"
                  : file?.isDirectory
                    ? "File Folder"
                    : file?.name.split(".").pop()?.toUpperCase() + " File"}
              </span>
            </div>
            <div className="flex justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Created</span>
              <span className="font-medium text-right">
                {isMulti || !file
                  ? "Multiple"
                  : new Date(file.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm py-2">
              <span className="text-slate-500">Location</span>
              <span className="font-medium text-right truncate ml-4">
                {isMulti || !file
                  ? "Multiple locations"
                  : file.path.split("\\").slice(0, -1).join("\\")}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-primary-500/20"
          >
            OK
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PropertiesModal;
