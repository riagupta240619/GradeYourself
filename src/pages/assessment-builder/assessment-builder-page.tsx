import { useState } from "react";
import { GripVertical, X, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { currentSemesterSubjects } from "@/lib/data/mock";
import type { AssessmentType } from "@/types";

export function AssessmentBuilderPage() {
  const [rows, setRows] = useState<AssessmentType[]>(currentSemesterSubjects[0].scheme.assessmentTypes);
  const total = rows.reduce((sum, r) => sum + r.weightPct, 0);

  function update(id: string, field: "weightPct" | "maxMarks", value: number) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function remove(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function addRow() {
    setRows((prev) => [...prev, { id: crypto.randomUUID(), name: "New Assessment", weightPct: 0, maxMarks: 100 }]);
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Assessment Builder — Data Structures</h1>
        <Badge tone={total === 100 ? "success" : "danger"}>Total: {total}% {total === 100 ? "✓" : ""}</Badge>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 pt-5">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5" style={{ borderColor: "var(--border-hairline)" }}>
              <GripVertical size={15} className="cursor-grab text-[var(--text-tertiary)]" />
              <input
                className="flex-1 bg-transparent text-sm font-medium focus:outline-none"
                value={row.name}
                onChange={(e) => setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, name: e.target.value } : r)))}
              />
              <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                <input
                  type="number"
                  className="w-14 rounded-md border bg-transparent px-2 py-1 text-right font-tabular"
                  style={{ borderColor: "var(--border-hairline)" }}
                  value={row.weightPct}
                  onChange={(e) => update(row.id, "weightPct", Number(e.target.value))}
                />
                %
              </div>
              <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                Max
                <input
                  type="number"
                  className="w-16 rounded-md border bg-transparent px-2 py-1 text-right font-tabular"
                  style={{ borderColor: "var(--border-hairline)" }}
                  value={row.maxMarks}
                  onChange={(e) => update(row.id, "maxMarks", Number(e.target.value))}
                />
              </div>
              <button onClick={() => remove(row.id)} className="text-[var(--text-tertiary)] hover:text-[var(--color-danger)]">
                <X size={15} />
              </button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="mt-1 w-fit" onClick={addRow}>
            <Plus size={14} /> Add Assessment
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Special Rules</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">+ Best N of M</Button>
          <Button variant="outline" size="sm">+ Grace Marks</Button>
          <Button variant="outline" size="sm">+ Drop Lowest</Button>
        </CardContent>
      </Card>

      {total !== 100 && (
        <p className="text-sm text-[var(--color-danger)]">Weights must sum to 100% before saving.</p>
      )}
      <Button disabled={total !== 100} className="w-fit">
        Save Scheme
      </Button>
    </div>
  );
}
