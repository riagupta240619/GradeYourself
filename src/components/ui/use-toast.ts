/**
 * Shim so that storage components that call `useToast()` / `openToast()`
 * work against `sonner`, which is the actual toast library in use.
 */
import { toast } from "sonner";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const openToast = ({ title, description, variant }: ToastOptions) => {
    if (variant === "destructive") {
      toast.error(title, { description });
    } else {
      toast.success(title, { description });
    }
  };

  return { openToast };
}
