import { Link } from "react-router-dom";
import { Puzzle, Bot, Target, Wand2, BarChart3, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/app/providers/theme-provider";
import { Sun, Moon } from "lucide-react";

const features = [
  { icon: Puzzle, title: "Custom schemes", desc: "Model any university's exact grading formula, rules and all." },
  { icon: Bot, title: "AI extraction", desc: "Upload a syllabus PDF — we read the weightages for you." },
  { icon: Target, title: "Target planner", desc: "See exactly what you need on what's left to hit your goal." },
  { icon: Wand2, title: "What-if simulator", desc: "Drag a slider, watch your CGPA respond instantly." },
  { icon: BarChart3, title: "Analytics", desc: "Track trends across subjects and semesters." },
  { icon: Globe, title: "Community templates", desc: "Reuse a verified scheme others at your college already built." },
];

export function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div style={{ backgroundColor: "var(--bg-base)" }} className="min-h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-[var(--bg-surface)]/70 px-8 py-4 backdrop-blur" style={{ borderColor: "var(--border-hairline)" }}>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-accent)] text-sm font-bold text-white">G</div>
          <span className="font-semibold">GradeWise AI</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link to="/login">
            <Button variant="outline" size="sm">Sign in</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 pb-20 pt-24 text-center animate-fade-up">
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
          Your CGPA, decoded —<br /> for any university.
        </h1>
        <p className="max-w-lg text-[var(--text-secondary)]">
          Upload your marking scheme. We handle the math — predictions, targets, and what-ifs included.
        </p>
        <div className="flex gap-3">
          <Link to="/register">
            <Button size="lg">
              Get Started Free <ArrowRight size={16} />
            </Button>
          </Link>
          <Button size="lg" variant="outline">See how it works</Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--color-accent)]/40"
            style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-surface)" }}
          >
            <f.icon size={20} className="mb-3 text-[var(--color-accent)]" />
            <p className="mb-1 font-medium">{f.title}</p>
            <p className="text-sm text-[var(--text-secondary)]">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t px-8 py-6 text-center text-sm text-[var(--text-tertiary)]" style={{ borderColor: "var(--border-hairline)" }}>
        GradeWise AI
      </footer>
    </div>
  );
}
