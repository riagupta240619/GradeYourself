import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MailCheck, GraduationCap, Mail, ArrowRight, ArrowLeft, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-slate-50 text-slate-900 dark:bg-[#09090b] dark:text-slate-900 dark:text-white px-4 overflow-hidden">
      {/* Absolute Theme Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/80 dark:border-white/10 dark:bg-zinc-900/80 text-slate-600 dark:text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shadow-sm backdrop-blur-md"
          aria-label="Toggle theme"
          title="Toggle theme mode"
        >
          {theme === "dark" ? (
            <Sun size={16} className="text-amber-400" />
          ) : (
            <Moon size={16} className="text-purple-600" />
          )}
        </button>
      </div>

      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-purple-200/40 dark:bg-purple-600/20 blur-3xl opacity-60" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 dark:border-white/10 dark:bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-2xl text-center"
      >
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400">
          <GraduationCap size={22} />
        </div>

        {!sent ? (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-900 dark:text-white">Reset your password</h1>
            <p className="mt-1 mb-6 text-xs text-slate-500 dark:text-zinc-400">Enter your account email and we'll send a password recovery link.</p>
            <form
              className="flex flex-col gap-4 text-left"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-700 dark:text-zinc-300">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3 text-slate-400 dark:text-zinc-500" />
                  <input
                    type="email"
                    required
                    placeholder="student@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-zinc-950/60 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 dark:placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>
              </div>

              <Button type="submit" size="lg" variant="primary" className="mt-2 w-full gap-2">
                Send Reset Link <ArrowRight size={16} />
              </Button>
            </form>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-4">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              <MailCheck size={28} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-900 dark:text-white">Check your inbox</h1>
            <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              We've sent a password reset link to <span className="font-semibold text-slate-900 dark:text-slate-900 dark:text-white">{email}</span>. Please follow the instructions in the email.
            </p>
          </motion.div>
        )}

        <div className="mt-6 border-t border-slate-200 dark:border-white/10 pt-4 text-xs">
          <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-600 dark:text-purple-300 transition-colors">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
