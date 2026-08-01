import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#09090b]",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent-purple)] text-white shadow-[var(--shadow-soft)] hover:bg-[#7c3aed] active:bg-[#6d28d9] border border-transparent",
        secondary:
          "bg-[var(--bg-surface)] text-white shadow-[var(--shadow-card)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border)] dark:bg-[var(--bg-surface)] dark:hover:bg-[var(--bg-surface-elevated)]",
        outline:
          "border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] dark:text-white dark:bg-[var(--bg-surface)] dark:hover:bg-[var(--bg-surface-elevated)]",
        ghost:
          "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] dark:text-[var(--text-secondary)] dark:hover:bg-[var(--bg-surface-elevated)]",
        danger:
          "bg-[#831843] text-white shadow-[var(--shadow-soft)] hover:bg-[#a21d43] active:bg-[#7f173d] border border-[#881d4a]",
      },
      size: {
        sm: "h-9 px-3.5 text-xs rounded-xl",
        md: "h-10 px-4 text-sm rounded-xl",
        lg: "h-11 px-6 text-base rounded-xl font-bold",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  whileHover?: HTMLMotionProps<"button">["whileHover"];
  whileTap?: HTMLMotionProps<"button">["whileTap"];
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => (
    <motion.button
      ref={ref}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={cn(buttonVariants({ variant, size }), className)}
      {...(props as any)}
    >
      {children}
    </motion.button>
  ),
);
Button.displayName = "Button";
