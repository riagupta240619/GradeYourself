import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, PenLine, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

const steps = ["University", "Grade Scale", "Semester", "Subjects"];

export function OnboardingPage() {
  const { user, updateSetup, loading, error } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"choose" | "review">("choose");
  const [scale, setScale] = useState("10.0 CGPA");

  // Academic Setup Fields
  const [college, setCollege] = useState(user?.college || "");
  const [course, setCourse] = useState(user?.course || "");
  const [branch, setBranch] = useState(user?.branch || "");
  const [academicSession, setAcademicSession] = useState(user?.academicSession || "");
  const [semesterSystem, setSemesterSystem] = useState(user?.semesterSystem || "Semester 4");

  // Skip Setup if profile is already completed
  useEffect(() => {
    if (user?.profileCompleted) {
      navigate("/app/dashboard", { replace: true });
    }
  }, [user, navigate]);

  async function handleFinish() {
    try {
      await updateSetup({
        college: college || "Default University",
        course: course || "Computer Science & Engineering",
        semesterSystem: scale || semesterSystem || "10.0 CGPA",
        branch: branch || "B.Tech",
        academicSession: academicSession || "2025-2026",
      });
      navigate("/app/dashboard");
    } catch {
      // Error handled in AuthContext
    }
  }

  function next() {
    if (step === steps.length - 1) {
      handleFinish();
    } else {
      setStep((s) => s + 1);
      setMode("choose");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: "var(--bg-base)" }}>
      <Card className="w-full max-w-lg animate-fade-up">
        <CardContent className="pt-8">
          <div className="mb-6 flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full"
                style={{ backgroundColor: i <= step ? "var(--color-accent)" : "var(--bg-elevated)" }}
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-500 text-center">
              {error}
            </div>
          )}

          {step === 0 && mode === "choose" && (
            <>
              <h1 className="mb-4 text-xl font-semibold">How does your university grade you?</h1>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setMode("review")}
                  className="flex flex-col items-center gap-2 rounded-xl border p-6 hover:border-[var(--color-accent)]"
                  style={{ borderColor: "var(--border-hairline)" }}
                >
                  <Upload size={22} className="text-[var(--color-accent)]" />
                  <span className="text-sm font-medium">Upload scheme</span>
                  <span className="text-xs text-[var(--text-tertiary)]">PDF or image</span>
                </button>
                <button
                  onClick={next}
                  className="flex flex-col items-center gap-2 rounded-xl border p-6 hover:border-[var(--color-accent)]"
                  style={{ borderColor: "var(--border-hairline)" }}
                >
                  <PenLine size={22} className="text-[var(--color-accent)]" />
                  <span className="text-sm font-medium">Enter manually</span>
                  <span className="text-xs text-[var(--text-tertiary)]">Set weights yourself</span>
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                <div>
                  <label className="mb-1 block text-xs text-[var(--text-secondary)]">University / College</label>
                  <input
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. Stanford University"
                    className="w-full rounded-lg border bg-transparent px-3 py-1.5 text-sm"
                    style={{ borderColor: "var(--border-hairline)" }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-[var(--text-secondary)]">Course</label>
                    <input
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      placeholder="e.g. B.Tech"
                      className="w-full rounded-lg border bg-transparent px-3 py-1.5 text-sm"
                      style={{ borderColor: "var(--border-hairline)" }}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[var(--text-secondary)]">Branch</label>
                    <input
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="e.g. CSE"
                      className="w-full rounded-lg border bg-transparent px-3 py-1.5 text-sm"
                      style={{ borderColor: "var(--border-hairline)" }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 0 && mode === "review" && (
            <>
              <h1 className="mb-1 text-xl font-semibold">Reviewing extracted scheme</h1>
              <p className="mb-4 flex items-center gap-1.5 text-sm text-[var(--color-warning)]">
                <AlertTriangle size={14} /> Please verify flagged fields
              </p>
              <div className="flex flex-col gap-2 text-sm">
                {[
                  { name: "Assignments", value: "20%", flagged: false },
                  { name: "Midterm", value: "30%", flagged: false },
                  { name: "Final", value: "50%", flagged: true },
                ].map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                    style={{
                      borderColor: f.flagged ? "var(--color-warning)" : "var(--border-hairline)",
                      backgroundColor: f.flagged ? "color-mix(in srgb, var(--color-warning) 8%, transparent)" : undefined,
                    }}
                  >
                    <span>{f.name}</span>
                    <div className="flex items-center gap-2">
                      <input defaultValue={f.value} className="w-14 rounded-md border bg-transparent px-1.5 py-0.5 text-right font-tabular text-xs" style={{ borderColor: "var(--border-hairline)" }} />
                      {f.flagged ? <AlertTriangle size={13} className="text-[var(--color-warning)]" /> : <CheckCircle2 size={13} className="text-[var(--color-success)]" />}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-[var(--text-tertiary)]">Total: 100% ✓</p>
              <div className="mt-5 flex justify-between">
                <Button variant="ghost" onClick={() => setMode("choose")}>Back</Button>
                <Button onClick={next}>Looks good →</Button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="mb-4 text-xl font-semibold">What's your grading scale?</h1>
              <div className="grid grid-cols-2 gap-3">
                {["4.0 GPA", "10.0 CGPA", "Percentage", "Letter grade"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setScale(s)}
                    className={`rounded-xl border p-4 text-sm font-medium ${scale === s ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : ""}`}
                    style={{ borderColor: scale === s ? undefined : "var(--border-hairline)" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <Button className="mt-5 w-full" onClick={next}>Next →</Button>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="mb-4 text-xl font-semibold">Set up your academic session & semester</h1>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="mb-1 block text-xs text-[var(--text-secondary)]">Academic Session</label>
                  <input
                    value={academicSession}
                    onChange={(e) => setAcademicSession(e.target.value)}
                    placeholder="e.g. 2025-2026"
                    className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                    style={{ borderColor: "var(--border-hairline)" }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--text-secondary)]">Current Semester</label>
                  <input
                    value={semesterSystem}
                    onChange={(e) => setSemesterSystem(e.target.value)}
                    placeholder="e.g. Semester 4"
                    className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                    style={{ borderColor: "var(--border-hairline)" }}
                  />
                </div>
              </div>
              <Button className="mt-5 w-full" onClick={next}>Next →</Button>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="mb-4 text-xl font-semibold">Add your subjects</h1>
              <p className="mb-3 text-sm text-[var(--text-secondary)]">You can always add more later.</p>
              <input placeholder="e.g. Data Structures" className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "var(--border-hairline)" }} />
              <Button className="mt-5 w-full" disabled={loading} onClick={handleFinish}>
                {loading ? "Saving Setup..." : "Finish setup →"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
