import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Lock, Trash2, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (password: string) => Promise<void>;
  isLoading?: boolean;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirmDelete,
  isLoading = false,
}: DeleteAccountModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const deleteInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPassword("");
      setConfirmText("");
      setErrorMsg(null);
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Focus transition when stepping to Step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        deleteInputRef.current?.focus();
      }, 100);
    }
  }, [step]);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleStepOneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password.trim()) {
      setErrorMsg("Please re-enter your password to proceed.");
      return;
    }

    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (confirmText !== "DELETE") {
      setErrorMsg("You must type DELETE in all caps to confirm.");
      return;
    }

    try {
      await onConfirmDelete(password);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Incorrect password or failed to delete account.";
      setErrorMsg(msg);
      // If wrong password error, step back to 1
      if (msg.toLowerCase().includes("password")) {
        setStep(1);
        setPassword("");
      }
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
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isLoading ? undefined : onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.25 }}
          className="relative w-full max-w-md rounded-2xl border border-rose-500/30 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-xl sm:p-7 text-white z-10"
        >
          {/* Header Icon */}
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.25)]">
            <AlertTriangle size={24} />
          </div>

          <h2 id="delete-dialog-title" className="text-xl font-bold tracking-tight text-white mb-1">
            {step === 1 ? "Delete Account?" : "Are you absolutely sure?"}
          </h2>

          <p id="delete-dialog-description" className="text-xs text-zinc-400 mb-5 leading-relaxed">
            {step === 1
              ? "This action will permanently delete your account, uploaded transcripts, academic profile, grades, predictions, and all associated data. This cannot be undone."
              : "Type DELETE in all capital letters below to confirm permanent account deletion."}
          </p>

          {errorMsg && (
            <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 font-semibold flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: PASSWORD VERIFICATION */}
          {step === 1 && (
            <form onSubmit={handleStepOneSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                  Re-enter Password to Verify *
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    ref={passwordInputRef}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full rounded-xl border border-white/10 bg-zinc-950/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={isLoading}
                  className="text-zinc-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={!password.trim() || isLoading}
                  className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Continue <ArrowRight size={14} />
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2: TYPING "DELETE" CONFIRMATION */}
          {step === 2 && (
            <form onSubmit={handleFinalSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-rose-300">
                  Type DELETE to continue *
                </label>
                <input
                  ref={deleteInputRef}
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full rounded-xl border border-rose-500/40 bg-zinc-950/80 px-4 py-2.5 text-center font-mono text-base font-extrabold tracking-widest text-rose-400 placeholder-zinc-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                />
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="text-zinc-400 hover:text-white text-xs"
                >
                  ← Back
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    disabled={isLoading}
                    className="text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="danger"
                    size="sm"
                    disabled={confirmText !== "DELETE" || isLoading}
                    className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30"
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
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
