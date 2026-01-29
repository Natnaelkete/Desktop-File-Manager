import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2, PieChart as PieChartIcon } from "lucide-react";
import { clsx } from "clsx";
import DashboardView from "./DiskAnalyzer/DashboardView";
import DuplicatesView from "./DiskAnalyzer/DuplicatesView";

interface DiskAnalyzerProps {
  path: string;
  onClose: () => void;
}

const DiskAnalyzer: React.FC<DiskAnalyzerProps> = ({ path, onClose }) => {
  // Use local state for the path being analyzed, initialized with the prop
  const [currentPath, setCurrentPath] = useState(path);
  const [drives, setDrives] = useState<{ name: string; path: string }[]>([]);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"dashboard" | "duplicates">("dashboard");
  const [cleaning, setCleaning] = useState(false);

  // Pagination & Virtualization state
  const [paginatedDuplicates, setPaginatedDuplicates] = useState<string[][]>(
    [],
  );
  const [page, setPage] = useState(0);
  const [totalGroups, setTotalGroups] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    // Fetch drives for selection
    const loadDrives = async () => {
      const d = await (window as any).electronAPI.getDrives();
      setDrives(d);
    };
    loadDrives();
  }, []);

  // Update currentPath if prop changes, but only if it's different to avoid loops
  useEffect(() => {
    if (path !== currentPath) {
      setCurrentPath(path);
    }
  }, [path]);

  const fetchStats = async () => {
    setData(null); // Reset data to force loading state
    setLoading(true);
    try {
      const stats = await (window as any).electronAPI.getAdvancedStats(
        currentPath,
      );
      if (!stats.error) {
        setData(stats);
      } else {
        console.error("Stats fetch error:", stats.error);
      }
    } catch (e) {
      console.error("Stats fetch error:", e);
    }
    setLoading(false);
  };

  // Re-fetch when currentPath changes
  useEffect(() => {
    fetchStats();
  }, [currentPath]);

  const fetchDuplicates = async (reset = false) => {
    const currentPage = reset ? 0 : page;
    setLoadingMore(true);
    try {
      const result = await (window as any).electronAPI.getDuplicatesPaginated(
        currentPage,
        30,
      );
      if (result && result.groups) {
        if (reset) {
          setPaginatedDuplicates(result.groups);
          setPage(1);
        } else {
          setPaginatedDuplicates((prev) => [...prev, ...result.groups]);
          setPage(currentPage + 1);
        }
        setTotalGroups(result.total);
      }
    } catch (e) {
      console.error("Failed to fetch duplicates:", e);
    }
    setLoadingMore(false);
  };

  useEffect(() => {
    if (view === "duplicates") {
      fetchDuplicates(true);
    }
  }, [view]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleReveal = (filePath: string) => {
    (window as any).electronAPI.revealInExplorer(filePath);
  };

  const handleCleanJunk = async () => {
    if (!data?.redundantFiles?.length) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete ${data.redundantCount} junk files? This action is permanent.`,
    );
    if (confirmed) {
      setCleaning(true);
      await (window as any).electronAPI.deleteFilesBulk(data.redundantFiles);
      await fetchStats();
      setCleaning(false);
    }
  };

  if (loading && !cleaning) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-primary-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Analyzing Storage...
        </h2>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      {cleaning && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-primary-500 mb-4" size={48} />
          <p className="text-sm font-bold animate-pulse text-slate-600 dark:text-slate-300">
            Cleaning Junk Files...
          </p>
        </div>
      )}

      {/* Main View Logic */}
      {view === "duplicates" ? (
        <DuplicatesView
          groups={paginatedDuplicates}
          totalGroups={totalGroups}
          loadingMore={loadingMore}
          onBack={() => setView("dashboard")}
          onReveal={handleReveal}
          onFetchMore={() => fetchDuplicates()}
        />
      ) : (
        <>
          {/* Dashboard Header */}
          <div className="h-14 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm z-10 shrink-0 justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors mr-2"
              >
                <ArrowLeft
                  size={20}
                  className="text-slate-600 dark:text-slate-300"
                />
              </button>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Storage Analysis
                </h2>
              </div>
            </div>
          </div>

          <DashboardView
            data={data}
            onViewDuplicates={() => setView("duplicates")}
            onCleanJunk={handleCleanJunk}
            onReveal={handleReveal}
            formatSize={formatSize}
          />
        </>
      )}
    </div>
  );
};

export default DiskAnalyzer;
