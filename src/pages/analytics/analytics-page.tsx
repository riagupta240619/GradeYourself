import { useState, useEffect, useMemo } from "react";
import { ArrowUp, ArrowDown, Trophy, AlertTriangle, PieChart as PieIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart } from "@/components/charts/trend-chart";
import { Badge } from "@/components/ui/badge";
import { AnalyticsService, type AnalyticsSummary } from "@/services/analytics-service";

export function AnalyticsPage() {
  const [tab, setTab] = useState<"trend" | "history">("trend");
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsService.getAnalyticsSummary()
      .then((data) => {
        setAnalytics(data);
      })
      .catch((err) => {
        console.error("Failed to load analytics summary from backend:", err);
        setAnalytics(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const chartData = useMemo(() => {
    if (analytics?.cgpaHistory && analytics.cgpaHistory.length > 0) {
      return analytics.cgpaHistory.map((item) => ({
        label: item.semester,
        value: item.cgpa,
      }));
    }
    return [];
  }, [analytics]);

  const trendData = useMemo(() => {
    if (analytics?.semesterTrend && analytics.semesterTrend.length > 0) {
      return analytics.semesterTrend;
    }
    return [];
  }, [analytics]);

  const highest = analytics?.highestSubject || null;
  const lowest = analytics?.lowestSubject || null;

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-fade-up">
        <h1 className="text-2xl font-semibold">Analytics & Performance History</h1>
        <Card className="p-8 text-center text-sm text-[var(--text-secondary)]">
          Loading analytics...
        </Card>
      </div>
    );
  }

  const hasData = (analytics?.totalSubjectsEvaluated || 0) > 0 || trendData.length > 0;

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Analytics & Performance History</h1>
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

      {!hasData ? (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No analytics data available</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Add semesters, subjects, and assessment marks to view performance analytics and progression trends.
          </p>
        </Card>
      ) : (
        <>
          {/* Highest & Lowest Performing Subject Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="border-l-4 border-l-[var(--color-success)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Trophy size={16} className="text-[var(--color-success)]" /> Highest Performing Subject
                </CardTitle>
                {highest && <Badge tone="accent">{highest.letterGrade}</Badge>}
              </CardHeader>
              <CardContent>
                {highest ? (
                  <>
                    <div className="text-xl font-bold">{highest.name} ({highest.code})</div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Score: <span className="font-tabular font-bold text-[var(--color-success)]">{highest.pct.toFixed(1)}%</span> &nbsp;·&nbsp; {highest.credits} Credits
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-[var(--text-tertiary)]">No subject scores evaluated yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-[var(--color-warning)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                  <AlertTriangle size={16} className="text-[var(--color-warning)]" /> Lowest Performing Subject
                </CardTitle>
                {lowest && <Badge tone="accent">{lowest.letterGrade}</Badge>}
              </CardHeader>
              <CardContent>
                {lowest ? (
                  <>
                    <div className="text-xl font-bold">{lowest.name} ({lowest.code})</div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Score: <span className="font-tabular font-bold text-[var(--color-warning)]">{lowest.pct.toFixed(1)}%</span> &nbsp;·&nbsp; {lowest.credits} Credits
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-[var(--text-tertiary)]">No subject scores evaluated yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {tab === "trend" ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>CGPA Progression Trend</CardTitle>
                  <span className="text-xs text-[var(--text-tertiary)]">{chartData.length} Semesters Recorded</span>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <TrendChart data={chartData} />
                  ) : (
                    <p className="text-xs text-[var(--text-tertiary)] text-center py-6">No trend points available.</p>
                  )}
                </CardContent>
              </Card>

              {/* Credit Distribution */}
              {analytics?.creditDistribution && analytics.creditDistribution.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <PieIcon size={18} className="text-[var(--color-accent)]" /> Credit Distribution by Subject Field
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {analytics.creditDistribution.map((item, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border p-4 bg-[var(--bg-elevated)]/30"
                          style={{ borderColor: "var(--border-hairline)" }}
                        >
                          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{item.category}</p>
                          <p className="text-2xl font-bold font-tabular text-[var(--color-accent)] mt-1">{item.credits} Credits</p>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{item.count} Subject(s)</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {trendData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Semester SGPA Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {trendData.slice(-2).map((item, idx) => (
                        <div key={idx} className="rounded-lg border p-4" style={{ borderColor: "var(--border-hairline)" }}>
                          <p className="text-sm text-[var(--text-secondary)]">{item.semester}</p>
                          <p className="text-2xl font-semibold font-tabular">{(item.sgpa || 0).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                    {highest && lowest && (
                      <div className="mt-4 flex flex-col gap-1.5 text-sm">
                        <p className="flex items-center gap-1.5 text-[var(--color-success)]">
                          <ArrowUp size={14} /> Highest performance in {highest.name} ({highest.pct.toFixed(1)}%)
                        </p>
                        <p className="flex items-center gap-1.5 text-[var(--color-warning)]">
                          <ArrowDown size={14} /> Attention recommended for {lowest.name} ({lowest.pct.toFixed(1)}%)
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Past Semester Results</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {trendData.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                    style={{ borderColor: "var(--border-hairline)" }}
                  >
                    <div>
                      <p className="font-medium">{s.semester}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">Recorded</p>
                    </div>
                    <Badge tone="accent">SGPA {(s.sgpa || 0).toFixed(2)}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
