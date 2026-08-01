import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
  isLoading?: boolean;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirmDelete,
  isLoading = false,
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const deletionInFlight = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmText("");
      setErrorMsg(null);
      deletionInFlight.current = false;
      window.setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen && !isLoading) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (confirmText !== "DELETE" || isLoading || deletionInFlight.current)
      return;

    deletionInFlight.current = true;
    setErrorMsg(null);
    try {
      await onConfirmDelete();
    } catch (error: any) {
      deletionInFlight.current = false;
      setErrorMsg(
        error.response?.data?.message ||
          error.message ||
          "Unable to delete your account. Please try again.",
      );
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isLoading ? undefined : onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.25 }}
          className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl surface-card bg-[var(--bg-surface)] text-[var(--text-primary)] sm:p-7"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/20 text-rose-500 dark:text-rose-400">
            <AlertTriangle size={24} />
          </div>
          <h2
            id="delete-dialog-title"
            className="mb-1 text-xl font-bold tracking-tight"
          >
            Delete account permanently?
          </h2>
          <div
            id="delete-dialog-description"
            className="mb-5 space-y-3 text-xs leading-relaxed text-[var(--text-secondary)]"
          >
            <p>
              Deleting your account permanently removes your profile, academic
              records, uploaded transcripts, analytics, planner data, and all
              saved information.
            </p>
            <p className="font-bold text-rose-600 dark:text-rose-400">
              This action cannot be undone.
            </p>
          </div>
          {errorMsg && (
            <div
              role="alert"
              className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-semibold text-rose-600 dark:text-rose-400"
            >
              <AlertTriangle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="delete-confirmation"
                className="mb-1.5 block text-xs font-semibold text-rose-700 dark:text-rose-300"
              >
                Type DELETE to confirm
              </label>
              <input
                id="delete-confirmation"
                ref={inputRef}
                type="text"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder="DELETE"
                autoComplete="off"
                disabled={isLoading}
                className="w-full rounded-xl border border-rose-500/40 bg-[var(--bg-surface-elevated)] px-4 py-2.5 text-center font-mono text-base font-extrabold tracking-widest text-rose-600 outline-none transition-all placeholder:tracking-normal placeholder:text-[var(--text-muted)] focus:border-rose-500 focus:ring-1 focus:ring-rose-500 disabled:opacity-60"
              />
            </div>
            <div className="mt-2 flex items-center justify-end gap-2 border-t border-[var(--border)] pt-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                disabled={confirmText !== "DELETE" || isLoading}
                className="gap-1.5 shadow-lg shadow-rose-600/30"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} /> Delete Account
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
