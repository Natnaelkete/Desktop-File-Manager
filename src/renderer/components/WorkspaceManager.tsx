import React, { useMemo, useState } from "react";
import {
  X,
  Plus,
  Folder,
  Trash2,
  Check,
  Circle,
  StickyNote,
} from "lucide-react";
import { clsx } from "clsx";
import { useStore } from "../stores/store";

interface WorkspaceManagerProps {
  onClose: () => void;
}

const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({ onClose }) => {
  const {
    workspaces,
    activeWorkspaceId,
    saveWorkspace,
    loadWorkspace,
    deleteWorkspace,
    updateWorkspaceNotes,
    addWorkspaceTask,
    toggleWorkspaceTask,
    removeWorkspaceTask,
  } = useStore();

  const [name, setName] = useState("");
  const [taskText, setTaskText] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    activeWorkspaceId || workspaces[0]?.id || null,
  );

  const selected = useMemo(
    () => workspaces.find((w) => w.id === selectedId) || null,
    [workspaces, selectedId],
  );

  const handleSave = () => {
    if (!name.trim()) return;
    saveWorkspace(name.trim());
    setName("");
  };

  const handleAddTask = () => {
    if (!selected || !taskText.trim()) return;
    addWorkspaceTask(selected.id, taskText.trim());
    setTaskText("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 font-semibold">
            <Folder size={18} className="text-primary-500" />
            <span>Project Workspaces</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-[280px_1fr] min-h-[420px]">
          <div className="border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Workspace name"
                className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleSave}
                className="px-3 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm"
                title="Save current workspace"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1">
              {workspaces.length === 0 && (
                <div className="text-xs text-slate-400 py-4 text-center">
                  No workspaces yet
                </div>
              )}
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className={clsx(
                    "flex items-center gap-2 p-2 rounded-lg cursor-pointer",
                    ws.id === selectedId
                      ? "bg-primary-500/10 text-primary-600"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300",
                  )}
                  onClick={() => setSelectedId(ws.id)}
                >
                  <Folder size={14} />
                  <span className="text-sm truncate flex-1">{ws.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 space-y-4">
            {!selected && (
              <div className="text-sm text-slate-500">Select a workspace</div>
            )}

            {selected && (
              <>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      loadWorkspace(selected.id);
                      onClose();
                    }}
                    className="px-3 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm"
                  >
                    Open Workspace
                  </button>
                  <button
                    onClick={() => deleteWorkspace(selected.id)}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
                  >
                    <Trash2 size={14} className="inline-block mr-1" />
                    Delete
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-2">
                      <StickyNote size={12} /> Notes
                    </div>
                    <textarea
                      value={selected.notes}
                      onChange={(e) =>
                        updateWorkspaceNotes(selected.id, e.target.value)
                      }
                      placeholder="Pinned notes for this project..."
                      className="w-full h-40 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-400 uppercase">
                      Tasks
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={taskText}
                        onChange={(e) => setTaskText(e.target.value)}
                        placeholder="Add task"
                        className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={handleAddTask}
                        className="px-3 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {selected.tasks.length === 0 && (
                        <div className="text-xs text-slate-400 py-2">
                          No tasks
                        </div>
                      )}
                      {selected.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <button
                            onClick={() =>
                              toggleWorkspaceTask(selected.id, task.id)
                            }
                            className={clsx(
                              "p-1 rounded-full",
                              task.done ? "text-primary-500" : "text-slate-400",
                            )}
                          >
                            {task.done ? (
                              <Check size={14} />
                            ) : (
                              <Circle size={14} />
                            )}
                          </button>
                          <span
                            className={clsx(
                              "text-sm flex-1",
                              task.done && "line-through text-slate-400",
                            )}
                          >
                            {task.text}
                          </span>
                          <button
                            onClick={() =>
                              removeWorkspaceTask(selected.id, task.id)
                            }
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceManager;
