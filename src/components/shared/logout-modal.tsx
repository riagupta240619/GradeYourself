import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function LogoutModal({ isOpen, onClose, onConfirm, isLoading = false }: LogoutModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Keyboard Accessibility (Escape key closes dialog, Enter key confirms Logout)
  useEffect(() => {
    if (!isOpen) return;

    // Auto focus Cancel button on open for safety
    const timer = setTimeout(() => {
      cancelButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter" && !isLoading) {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, onConfirm, isLoading]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Translucent Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Dialog Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-description"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative z-10 w-full max-w-md overflow-y-auto max-h-[90vh] rounded-2xl border border-white/10 bg-white dark:bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-xl"
          >
            {/* Header / Icon */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
                <LogOut size={26} />
              </div>

              <h2
                id="logout-dialog-title"
                className="text-xl font-bold tracking-tight text-white"
              >
                Confirm Logout
              </h2>

              <p
                id="logout-dialog-description"
                className="mt-2 text-sm text-slate-500 dark:text-zinc-400 leading-relaxed"
              >
                Are you sure you want to log out?
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                ref={cancelButtonRef}
                variant="outline"
                size="md"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                ref={confirmButtonRef}
                variant="danger"
                size="md"
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 gap-2 shadow-[0_0_20px_rgba(225,29,72,0.3)]"
              >
                <LogOut size={16} />
                {isLoading ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
