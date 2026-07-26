import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Trophy, AlertTriangle, PieChart as PieIcon, BarChart3, TrendingUp, BookOpen } from "lucide-react";
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
      <div className="flex max-w-4xl flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Analytics & Performance History</h1>
        <Card className="p-8 text-center text-xs text-zinc-400">
          Loading performance analytics...
        </Card>
      </div>
    );
  }

  const hasData = (analytics?.totalSubjectsEvaluated || 0) > 0 || trendData.length > 0;

  return (
    <div className="flex max-w-4xl flex-col gap-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-300 mb-2">
            <BarChart3 size={12} className="text-purple-400" /> Academic Analytics
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Performance Analytics</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">Detailed evaluation of CGPA trends, course distributions, and performance outliers.</p>
        </div>

        <div className="flex rounded-xl border border-white/10 bg-zinc-900/90 p-1 text-xs font-semibold">
          {[
            { key: "trend", label: "Progression Trend" },
            { key: "history", label: "Past Results" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as "trend" | "history")}
              className={`rounded-lg px-3.5 py-1.5 transition-all ${
                tab === t.key
                  ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.4)] font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <Card className="p-10 text-center">
          <h2 className="text-lg font-bold mb-2">No Performance Analytics Recorded</h2>
          <p className="text-xs text-zinc-400">
            Add semester results and subjects to unlock detailed progression graphs and subject breakdowns.
          </p>
        </Card>
      ) : (
        <>
          {/* Highest & Lowest Performing Subject Stat Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-emerald-400">
                  <Trophy size={16} /> Highest Performing Course
                </CardTitle>
                {highest && <Badge tone="success">{highest.letterGrade}</Badge>}
              </CardHeader>
              <CardContent>
                {highest ? (
                  <>
                    <div className="text-xl font-extrabold text-white">{highest.name} <span className="text-zinc-500 font-normal">({highest.code})</span></div>
                    <p className="text-xs text-zinc-400 mt-2">
                      Final Score: <span className="font-mono font-bold text-emerald-400 text-sm">{highest.pct.toFixed(1)}%</span> &nbsp;•&nbsp; {highest.credits} Credits
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-zinc-500">No course data evaluated yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle size={16} /> Lowest Performing Course
                </CardTitle>
                {lowest && <Badge tone="warning">{lowest.letterGrade}</Badge>}
              </CardHeader>
              <CardContent>
                {lowest ? (
                  <>
                    <div className="text-xl font-extrabold text-white">{lowest.name} <span className="text-zinc-500 font-normal">({lowest.code})</span></div>
                    <p className="text-xs text-zinc-400 mt-2">
                      Final Score: <span className="font-mono font-bold text-amber-400 text-sm">{lowest.pct.toFixed(1)}%</span> &nbsp;•&nbsp; {lowest.credits} Credits
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-zinc-500">No course data evaluated yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {tab === "trend" ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-purple-400" />
                    <CardTitle>CGPA Progression Trend</CardTitle>
                  </div>
                  <span className="text-xs text-zinc-500 font-semibold">{chartData.length} Semesters Tracked</span>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <TrendChart data={chartData} />
                  ) : (
                    <p className="text-xs text-zinc-500 text-center py-8">No historical data available.</p>
                  )}
                </CardContent>
              </Card>

              {/* Credit Distribution */}
              {analytics?.creditDistribution && analytics.creditDistribution.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <PieIcon size={18} className="text-purple-400" /> Credit Distribution by Field
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {analytics.creditDistribution.map((item, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-white/10 bg-zinc-950/60 p-4"
                        >
                          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{item.category}</p>
                          <p className="text-2xl font-extrabold font-mono text-purple-400 mt-1">{item.credits} Credits</p>
                          <p className="text-xs text-zinc-500 mt-1">{item.count} Course(s)</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {trendData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Semester Comparisons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {trendData.slice(-2).map((item, idx) => (
                        <div key={idx} className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
                          <p className="text-xs text-zinc-400 font-semibold">{item.semester}</p>
                          <p className="text-3xl font-extrabold font-mono text-white mt-1">{(item.sgpa || 0).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                    {highest && lowest && (
                      <div className="mt-5 flex flex-col gap-2 text-xs border-t border-white/10 pt-4">
                        <p className="flex items-center gap-2 text-emerald-400 font-semibold">
                          <ArrowUp size={14} /> Highest performance achieved in {highest.name} ({highest.pct.toFixed(1)}%)
                        </p>
                        <p className="flex items-center gap-2 text-amber-400 font-semibold">
                          <ArrowDown size={14} /> Focus recommended for {lowest.name} ({lowest.pct.toFixed(1)}%)
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
                <CardTitle>Historical Semester Transcript Results</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {trendData.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950/60 px-5 py-3.5"
                  >
                    <div>
                      <p className="font-bold text-white text-sm">{s.semester}</p>
                      <p className="text-xs text-zinc-500">Official Record Verified</p>
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
