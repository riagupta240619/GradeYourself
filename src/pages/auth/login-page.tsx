import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, GraduationCap, Sparkles, CheckCircle2, Lock, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      const authUser = await login({ email, password });
      if (authUser.profileCompleted) {
        navigate("/app/dashboard");
      } else {
        navigate("/onboarding");
      }
    } catch {
      // Error handled in AuthContext
    }
  };

  return (
    <div className="relative flex min-h-screen w-full bg-[#09090b] text-white overflow-hidden">
      {/* Left Panel: Branding & Ambient Showcase (Visible on lg screens) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative border-r border-white/10 bg-zinc-950/80">
        <div className="pointer-events-none absolute -top-20 -left-20 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 right-10 h-80 w-80 rounded-full bg-blue-600/15 blur-3xl" />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 font-bold text-white shadow-lg">
            <GraduationCap size={22} />
          </div>
          <span className="text-xl font-bold tracking-tight">
            GradeWise <span className="gradient-purple-text">AI</span>
          </span>
        </div>

        {/* Middle Showcase Graphic */}
        <div className="relative z-10 my-auto max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-medium text-purple-300 mb-4">
            <Sparkles size={14} className="text-purple-400" /> Academic Intelligence Platform
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl leading-tight">
            Predict your grades, <br />
            <span className="gradient-purple-text">hit every target.</span>
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Join thousands of university students using GradeWise AI to calculate target scores, simulate what-if scenarios, and track CGPA trends.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {[
              "Automated syllabus PDF weightage extraction",
              "Real-time what-if grade simulations",
              "Custom university scale modeling (4.0 / 10.0)",
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Quote */}
        <div className="relative z-10 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 backdrop-blur-xl">
          <p className="text-xs italic text-zinc-300">
            "GradeWise AI gave me exact clarity on what I needed in my finals to maintain my 9.2 CGPA."
          </p>
          <span className="mt-2 block text-[11px] font-semibold text-purple-400">— Engineering Student, Stanford</span>
        </div>
      </div>

      {/* Right Panel: Glass Auth Form Card */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 relative">
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-purple-900/20 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-2xl"
        >
          {/* Form Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 lg:hidden">
              <GraduationCap size={22} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-xs text-zinc-400">Enter your credentials to access your dashboard</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 text-center font-medium"
            >
              {error}
            </motion.div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3 text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950/60 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300">Password</label>
                <Link to="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3 text-zinc-500" />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950/60 pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} size="lg" variant="primary" className="mt-2 w-full gap-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In <ArrowRight size={16} />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-zinc-400">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-purple-400 hover:text-purple-300 transition-colors">
              Create account free
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
