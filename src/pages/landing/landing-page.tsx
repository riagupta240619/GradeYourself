import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Puzzle, Bot, Target, Wand2, BarChart3, Globe, ArrowRight, Sun, Moon, Sparkles, CheckCircle2, TrendingUp, GraduationCap, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

const features = [
  { icon: Puzzle, title: "Custom schemes", desc: "Model any university's exact grading formula, weights, and rules effortlessly." },
  { icon: Bot, title: "AI extraction", desc: "Upload a syllabus PDF or image — we extract marks weightages automatically." },
  { icon: Target, title: "Target planner", desc: "Know the exact scores required on remaining exams to hit your dream CGPA." },
  { icon: Wand2, title: "What-if simulator", desc: "Drag a score slider and observe your predicted CGPA update in real time." },
  { icon: BarChart3, title: "Analytics", desc: "Visualize trends, grade distribution, and credit accumulation across semesters." },
  { icon: Globe, title: "Community templates", desc: "Instantly import verified grading schemes created by students at your college." },
];

export function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#09090b] text-white selection:bg-purple-500/30 selection:text-white">
      {/* Background Ambient Glow Effects */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-tr from-purple-900/30 via-purple-600/20 to-blue-600/10 blur-[120px] opacity-70" />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-[400px] w-[400px] rounded-full bg-blue-900/20 blur-[100px] opacity-50" />

      {/* Glass Header Navigation */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-zinc-950/80 px-6 sm:px-12 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-purple-500 to-blue-500 text-white font-bold shadow-[0_0_15px_rgba(124,58,237,0.4)]">
            <GraduationCap size={20} />
          </div>
          <span className="text-lg font-bold tracking-tight">
            GradeWise <span className="gradient-purple-text">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-purple-400" />}
          </button>
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white">
              Sign in
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm">
              Get Started <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto flex max-w-5xl flex-col items-center gap-8 px-6 pt-20 pb-16 text-center">
        {/* Release Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold text-purple-300 shadow-[0_0_20px_rgba(124,58,237,0.2)] backdrop-blur-md"
        >
          <Sparkles size={14} className="text-purple-400 animate-pulse" />
          <span>Next-Gen Academic Analytics & Grading OS</span>
          <span className="rounded-full bg-purple-500/30 px-2 py-0.5 text-[10px] text-purple-200">v2.4</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-tight"
        >
          Your CGPA, Decoded — <br />
          <span className="gradient-purple-text">For Any University.</span>
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl text-base sm:text-lg text-zinc-400 font-normal leading-relaxed"
        >
          Upload your syllabus or scheme. We automate the complex mathematics — target planning, what-if predictions, and semester analytics included.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 pt-2"
        >
          <Link to="/register">
            <Button size="lg" variant="primary" className="gap-2 shadow-[0_0_30px_rgba(124,58,237,0.4)]">
              Get Started Free <ArrowRight size={18} />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="gap-2">
              Explore Demo Dashboard
            </Button>
          </Link>
        </motion.div>

        {/* Hero App Mockup Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="relative mt-8 w-full max-w-4xl rounded-2xl border border-white/10 bg-zinc-900/90 p-4 sm:p-6 shadow-2xl backdrop-blur-2xl glow-purple"
        >
          {/* Top Bar Mockup */}
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="rounded-lg bg-zinc-800/80 px-4 py-1 text-[11px] font-mono text-zinc-400">
              gradewise.ai/dashboard
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Zap size={12} /> Sync Active
            </div>
          </div>

          {/* Mockup Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
              <span className="text-xs uppercase text-zinc-500 font-semibold">Current CGPA</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-tabular text-white">9.42</span>
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-0.5">
                  <TrendingUp size={12} /> +0.28
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
              <span className="text-xs uppercase text-zinc-500 font-semibold">Target Goal</span>
              <div className="mt-1 text-3xl font-bold font-tabular text-purple-400">9.50</div>
              <span className="text-[11px] text-zinc-400">Semester 4 Benchmark</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
              <span className="text-xs uppercase text-zinc-500 font-semibold">Target Feasibility</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                  Highly Achievable ✓
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid Section */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
            Everything you need for academic excellence
          </h2>
          <p className="mt-2 text-sm sm:text-base text-zinc-400">
            Engineered with precision for university students, advisors, and high achievers.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="group relative rounded-2xl border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:border-purple-500/40 hover:shadow-[0_0_25px_rgba(124,58,237,0.15)]"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                <f.icon size={22} />
              </div>
              <h3 className="mb-1 text-base font-semibold text-white group-hover:text-purple-300 transition-colors">
                {f.title}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-zinc-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Modern SaaS Footer */}
      <footer className="border-t border-white/10 bg-zinc-950 px-8 py-8 text-center text-xs text-zinc-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-purple-400" />
            <span className="font-semibold text-zinc-300">GradeWise AI</span>
            <span>— Precision Academic OS</span>
          </div>
          <p>© {new Date().getFullYear()} GradeWise AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
