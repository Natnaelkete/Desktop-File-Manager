import React, { useEffect, useRef, useState } from "react";
import { X, Lock, Check } from "lucide-react";

interface PinModalProps {
  mode: "set" | "unlock";
  pinHash?: string | null;
  pinSalt?: string | null;
  onClose: () => void;
  onSetPin: (pinHash: string, pinSalt: string) => void;
  onUnlockSuccess: () => void;
}

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const randomSalt = () => {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const hashPin = async (pin: string, salt: string) => {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
};

const PinModal: React.FC<PinModalProps> = ({
  mode,
  pinHash,
  pinSalt,
  onClose,
  onSetPin,
  onUnlockSuccess,
}) => {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (pin.length < 4) {
      setError("PIN must be at least 4 digits.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "set") {
        if (pin !== confirmPin) {
          setError("PINs do not match.");
          return;
        }
        const salt = randomSalt();
        const hash = await hashPin(pin, salt);
        onSetPin(hash, salt);
        onClose();
        return;
      }

      if (!pinHash || !pinSalt) {
        setError("PIN is not set yet.");
        return;
      }
      const hash = await hashPin(pin, pinSalt);
      if (hash !== pinHash) {
        setError("Incorrect PIN.");
        return;
      }

      onUnlockSuccess();
      onClose();
    } catch {
      setError("Failed to verify PIN.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 no-drag"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 glass">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-500/10 rounded-lg">
                  <Lock className="text-primary-500" size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {mode === "set" ? "Set Security PIN" : "Unlock Folder"}
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
                  PIN
                </label>
                <input
                  type="password"
                  autoFocus
                  inputMode="numeric"
                  value={pin}
                  ref={inputRef}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>

              {mode === "set" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 ml-1">
                    Confirm PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  />
                </div>
              )}

              {error && (
                <p className="text-xs text-rose-500 font-semibold">{error}</p>
              )}
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
              disabled={busy || !pin}
              className="flex items-center gap-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-primary-500/20 transition-all"
            >
              {busy ? (
                "Working..."
              ) : (
                <>
                  <Check size={18} /> {mode === "set" ? "Set PIN" : "Unlock"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PinModal;
