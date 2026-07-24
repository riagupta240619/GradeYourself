import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/shared/count-up";
import { currentSemesterSubjects } from "@/lib/data/mock";
import { subjectCurrentPct, pctToLetter } from "@/lib/grading/engine";

export function SimulatorPage() {
  const [subjectId, setSubjectId] = useState(currentSemesterSubjects[0].id);
  const subject = currentSemesterSubjects.find((s) => s.id === subjectId)!;
  const finalType = subject.scheme.assessmentTypes[subject.scheme.assessmentTypes.length - 1];
  const [finalMarks, setFinalMarks] = useState(Math.round(finalType.maxMarks * 0.75));
  const [scenarios, setScenarios] = useState<{ id: string; label: string; pct: number }[]>([]);

  const simulatedPct = useMemo(() => {
    const scenarioSubject = { ...subject, marks: { ...subject.marks, [finalType.id]: finalMarks } };
    return subjectCurrentPct(scenarioSubject);
  }, [subject, finalMarks, finalType.id]);

  const currentPct = useMemo(() => subjectCurrentPct(subject), [subject]);
  const delta = simulatedPct - currentPct;

  function saveScenario() {
    setScenarios((prev) => [...prev, { id: crypto.randomUUID(), label: `${finalType.name}: ${finalMarks}/${finalType.maxMarks}`, pct: simulatedPct }]);
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6 animate-fade-up">
      <h1 className="text-2xl font-semibold">What-if Simulator</h1>

      <div className="flex flex-wrap gap-2">
        {currentSemesterSubjects.map((s) => (
          <button
            key={s.id}
            onClick={() => setSubjectId(s.id)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              s.id === subjectId ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "text-[var(--text-secondary)]"
            }`}
            style={{ borderColor: s.id === subjectId ? undefined : "var(--border-hairline)" }}
          >
            {s.name}
          </button>
        ))}
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
