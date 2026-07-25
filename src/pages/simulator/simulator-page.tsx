import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/shared/count-up";
import { subjectCurrentPct, pctToLetter } from "@/lib/grading/engine";
import { SubjectService } from "@/services/subject-service";
import type { Subject } from "@/types";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

export function SimulatorPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [finalMarks, setFinalMarks] = useState<number>(0);
  const [scenarios, setScenarios] = useState<{ id: string; label: string; pct: number }[]>([]);

  useEffect(() => {
    SubjectService.getSubjects()
      .then((data) => {
        setSubjects(data || []);
        if (data && data.length > 0) {
          const firstId = data[0].id || data[0]._id || null;
          setSubjectId(firstId);
          const firstFinalType = data[0].scheme?.assessmentTypes?.[data[0].scheme.assessmentTypes.length - 1];
          if (firstFinalType) {
            setFinalMarks(Math.round(firstFinalType.maxMarks * 0.75));
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch subjects for simulator:", err);
        setSubjects([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const subject = useMemo(() => {
    if (!subjectId) return subjects[0] || null;
    return subjects.find((s) => (s.id === subjectId || s._id === subjectId)) || subjects[0] || null;
  }, [subjects, subjectId]);

  const finalType = useMemo(() => {
    if (!subject?.scheme?.assessmentTypes?.length) return null;
    return subject.scheme.assessmentTypes[subject.scheme.assessmentTypes.length - 1];
  }, [subject]);

  // Update slider default value when subject selection changes
  useEffect(() => {
    if (finalType) {
      const rawCurrent = subject?.marks?.[finalType.id];
      setFinalMarks(rawCurrent !== undefined && rawCurrent !== null ? rawCurrent : Math.round(finalType.maxMarks * 0.75));
    }
  }, [finalType, subject]);

  const simulatedPct = useMemo(() => {
    if (!subject || !finalType) return 0;
    const scenarioSubject = { ...subject, marks: { ...(subject.marks || {}), [finalType.id]: finalMarks } };
    return subjectCurrentPct(scenarioSubject);
  }, [subject, finalMarks, finalType]);

  const currentPct = useMemo(() => {
    if (!subject) return 0;
    return subjectCurrentPct(subject);
  }, [subject]);

  const delta = simulatedPct - currentPct;

  function saveScenario() {
    if (!finalType) return;
    setScenarios((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: `${subject?.name || "Subject"} - ${finalType.name}: ${finalMarks}/${finalType.maxMarks}`,
        pct: simulatedPct,
      },
    ]);
  }

  if (loading) {
    return (
      <div className="flex max-w-2xl flex-col gap-6 animate-fade-up">
        <h1 className="text-2xl font-semibold">What-if Simulator</h1>
        <Card className="p-8 text-center text-sm text-[var(--text-secondary)]">
          Loading subjects...
        </Card>
      </div>
    );
  }

  if (!subject || !finalType) {
    return (
      <div className="flex max-w-2xl flex-col gap-6 animate-fade-up">
        <h1 className="text-2xl font-semibold">What-if Simulator</h1>
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No subjects available for simulation</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">Add your subjects and assessment marks to run what-if simulations.</p>
          <Link to="/app/subjects" className="mx-auto flex w-fit items-center gap-1">
            <Button variant="primary" size="sm">
              <Plus size={14} className="mr-1" /> Add Subjects
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6 animate-fade-up">
      <h1 className="text-2xl font-semibold">What-if Simulator</h1>

      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => {
          const sId = s.id || s._id || "";
          const active = sId === (subject.id || subject._id);
          return (
            <button
              key={sId}
              onClick={() => setSubjectId(sId)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                active ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              style={{ borderColor: active ? undefined : "var(--border-hairline)" }}
            >
              {s.name}
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{finalType.name} marks for {subject.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="range"
            min={0}
            max={finalType.maxMarks}
            value={finalMarks}
            onChange={(e) => setFinalMarks(Number(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
          />
          <p className="mt-2 text-sm font-tabular text-[var(--text-secondary)]">
            {finalMarks} / {finalType.maxMarks}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Resulting subject grade</p>
              <p className="text-2xl font-semibold">{pctToLetter(simulatedPct)}</p>
              <p className="font-tabular text-sm text-[var(--text-tertiary)]">{simulatedPct.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Change from current</p>
              <p className={`text-2xl font-semibold font-tabular ${delta >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                {delta >= 0 ? "+" : ""}
                <CountUp value={delta} decimals={1} />
              </p>
            </div>
          </div>

          <Button className="mt-6" onClick={saveScenario}>
            Save this scenario
          </Button>
        </CardContent>
      </Card>

      {scenarios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Scenarios</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {scenarios.map((s) => (
              <span key={s.id} className="rounded-full border px-3 py-1.5 text-sm font-tabular" style={{ borderColor: "var(--border-hairline)" }}>
                {s.label} → {s.pct.toFixed(1)}%
              </span>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
