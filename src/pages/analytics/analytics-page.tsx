import { useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart } from "@/components/charts/trend-chart";
import { semesters, cgpaTrend } from "@/lib/data/mock";
import { Badge } from "@/components/ui/badge";

export function AnalyticsPage() {
  const [tab, setTab] = useState<"trend" | "history">("trend");
  const pastSemesters = semesters.filter((s) => !s.isCurrent);

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <div className="flex rounded-lg border p-0.5 text-sm" style={{ borderColor: "var(--border-hairline)" }}>
          {[
            { key: "trend", label: "Trend" },
            { key: "history", label: "Past Results" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as "trend" | "history")}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                tab === t.key ? "bg-[var(--color-accent)] text-white" : "text-[var(--text-secondary)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "trend" ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>CGPA Trend Across Semesters</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart data={cgpaTrend} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Semester Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4" style={{ borderColor: "var(--border-hairline)" }}>
                  <p className="text-sm text-[var(--text-secondary)]">Semester 4 (now)</p>
                  <p className="text-2xl font-semibold font-tabular">8.42</p>
                </div>
                <div className="rounded-lg border p-4" style={{ borderColor: "var(--border-hairline)" }}>
                  <p className="text-sm text-[var(--text-secondary)]">Semester 3</p>
                  <p className="text-2xl font-semibold font-tabular">8.30</p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-1.5 text-sm">
                <p className="flex items-center gap-1.5 text-[var(--color-success)]">
                  <ArrowUp size={14} /> Improved in: Data Structures, Computer Networks
                </p>
                <p className="flex items-center gap-1.5 text-[var(--color-danger)]">
                  <ArrowDown size={14} /> Declined in: Operating Systems
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Past Semester Results</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {pastSemesters.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
                style={{ borderColor: "var(--border-hairline)" }}
              >
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Finalized</p>
                </div>
                <Badge tone="accent">SGPA {s.finalizedSgpa?.toFixed(2)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
