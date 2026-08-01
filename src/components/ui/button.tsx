import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#09090b]",
  {
    variants: {
      variant: {
        primary:
          "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-sm hover:shadow border border-purple-500/20",
        secondary:
          "bg-slate-900 hover:bg-slate-800 text-white shadow-sm dark:bg-slate-800 dark:hover:bg-slate-700",
        outline:
          "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 dark:border-white/10 dark:bg-zinc-900/60 dark:text-white dark:hover:bg-zinc-800/80 dark:hover:border-white/20 shadow-sm",
        ghost:
          "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white",
        danger:
          "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm border border-rose-500/20",
      },
      size: {
        sm: "h-9 px-3.5 text-xs rounded-xl",
        md: "h-10 px-4 text-sm rounded-xl",
        lg: "h-11 px-6 text-base rounded-xl font-bold",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
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
  )
);
Button.displayName = "Button";
