import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useTheme } from "@/hooks/use-theme";

export interface TrendChartPoint {
  label: string;
  isProjected?: boolean;
  officialSgpa?: number | null;
  projectedSgpa?: number | null;
  officialCgpa?: number | null;
  projectedCgpa?: number | null;
  credits?: number;
  confidencePct?: number;
  note?: string;
  status?: string;
  value?: number | null;
  projectedValue?: number | null;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const point = payload[0].payload as TrendChartPoint;
    const isProj = point.isProjected;

    return (
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 text-xs shadow-xl backdrop-blur-md min-w-[200px] flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
          <p className="font-bold text-slate-900 dark:text-white text-xs">{point.label}</p>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${isProj ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"}`}>
            {isProj ? "Projected" : "Completed"}
          </span>
        </div>

        {isProj ? (
          <div className="flex flex-col gap-1.5 font-mono">
            <div className="flex items-center justify-between gap-3 text-blue-700 dark:text-blue-300">
              <span className="font-sans font-semibold">Projected SGPA:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {point.projectedSgpa !== null && point.projectedSgpa !== undefined ? Number(point.projectedSgpa).toFixed(2) : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 text-purple-700 dark:text-purple-300">
              <span className="font-sans font-semibold">Projected CGPA:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {point.projectedCgpa !== null && point.projectedCgpa !== undefined ? Number(point.projectedCgpa).toFixed(2) : "—"}
              </span>
            </div>

            {typeof point.confidencePct === "number" && (
              <div className="flex items-center justify-between gap-3 text-slate-500 dark:text-zinc-400 text-[11px] pt-1">
                <span className="font-sans">Confidence:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{point.confidencePct}%</span>
              </div>
            )}

            <p className="text-[10px] text-slate-500 dark:text-zinc-400 italic pt-1.5 border-t border-slate-100 dark:border-white/10 font-sans">
              {point.note || "Based on entered assessments"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 font-mono">
            <div className="flex items-center justify-between gap-3 text-blue-700 dark:text-blue-400">
              <span className="font-sans font-semibold">Official SGPA:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {point.officialSgpa !== null && point.officialSgpa !== undefined ? Number(point.officialSgpa).toFixed(2) : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 text-purple-700 dark:text-purple-400">
              <span className="font-sans font-semibold">Official CGPA:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {point.officialCgpa !== null && point.officialCgpa !== undefined ? Number(point.officialCgpa).toFixed(2) : "—"}
              </span>
            </div>

            {typeof point.credits === "number" && (
              <div className="flex items-center justify-between gap-3 text-slate-500 dark:text-zinc-400 text-[11px] pt-1 font-sans">
                <span>Credits:</span>
                <span className="font-mono text-slate-900 dark:text-white font-bold">{point.credits}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function TrendChart({ data, mode = "official" }: { data: TrendChartPoint[]; mode?: "official" | "predicted" }) {
  const { theme } = useTheme();
  const [visibleSeries, setVisibleSeries] = useState({
    officialCgpa: true,
    projectedCgpa: true,
    officialSgpa: true,
    projectedSgpa: true,
  });

  const toggleSeries = (key: keyof typeof visibleSeries) => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const safeData = Array.isArray(data) ? data : [];
  const chartData = mode === "official" ? safeData.filter((d) => d && !d.isProjected) : safeData;
  const showPredictions = mode === "predicted";
  const gridStroke = theme === "dark" ? "rgba(255,255,255,0.08)" : "#e2e8f0";

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-72 w-full flex items-center justify-center text-xs text-slate-500 dark:text-zinc-500 italic border border-dashed border-slate-200 dark:border-white/10 rounded-2xl my-2">
        No progression trend data available yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full pt-2">
      {/* Interactive Segmented Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold px-4 py-2 bg-slate-50 dark:bg-zinc-950/40 rounded-xl border border-slate-200 dark:border-white/5">
        <button
          onClick={() => toggleSeries("officialCgpa")}
          className={`flex items-center gap-2 transition-all ${visibleSeries.officialCgpa ? "text-purple-700 dark:text-purple-300 font-bold" : "text-slate-400 dark:text-zinc-500 opacity-50 line-through"}`}
        >
          <span className="h-3 w-3 rounded-full bg-purple-600 dark:bg-purple-500" />
          <span>Official CGPA</span>
        </button>

        {showPredictions && (
          <button
            onClick={() => toggleSeries("projectedCgpa")}
            className={`flex items-center gap-2 transition-all ${visibleSeries.projectedCgpa ? "text-purple-700 dark:text-purple-300 font-bold" : "text-slate-400 dark:text-zinc-500 opacity-50 line-through"}`}
          >
            <span className="h-3 w-3 rounded-full bg-purple-500 border border-dashed border-purple-300 dark:bg-purple-400 dark:border-purple-200" />
            <span>Projected CGPA</span>
          </button>
        )}

        <button
          onClick={() => toggleSeries("officialSgpa")}
          className={`flex items-center gap-2 transition-all ${visibleSeries.officialSgpa ? "text-blue-700 dark:text-blue-300 font-bold" : "text-slate-400 dark:text-zinc-500 opacity-50 line-through"}`}
        >
          <span className="h-3 w-3 rounded-full bg-blue-600 dark:bg-blue-500" />
          <span>Official SGPA</span>
        </button>

        {showPredictions && (
          <button
            onClick={() => toggleSeries("projectedSgpa")}
            className={`flex items-center gap-2 transition-all ${visibleSeries.projectedSgpa ? "text-blue-700 dark:text-blue-300 font-bold" : "text-slate-400 dark:text-zinc-500 opacity-50 line-through"}`}
          >
            <span className="h-3 w-3 rounded-full bg-blue-500 border border-dashed border-blue-300 dark:bg-blue-400 dark:border-blue-200" />
            <span>Projected SGPA</span>
          </button>
        )}
      </div>

      {/* Taller Graph Area (h-72 / 280px) */}
      <div className="h-72 w-full min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />

            <XAxis
              dataKey="label"
              stroke="#64748b"
              fontSize={11}
              fontWeight={600}
              tickLine={false}
              axisLine={{ stroke: gridStroke }}
              dy={8}
            />

            <YAxis
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              stroke="#64748b"
              fontSize={11}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              dx={-8}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Official CGPA Line */}
            {visibleSeries.officialCgpa && (
              <Line
                type="monotone"
                dataKey="officialCgpa"
                name="Official CGPA"
                stroke="#7c3aed"
                strokeWidth={3}
                dot={{ r: 5, fill: "#7c3aed", strokeWidth: 2, stroke: "#ffffff" }}
                activeDot={{ r: 7, fill: "#6d28d9", stroke: "#ffffff", strokeWidth: 2 }}
                connectNulls
              />
            )}

            {/* Projected CGPA Line */}
            {showPredictions && visibleSeries.projectedCgpa && (
              <Line
                type="monotone"
                dataKey="projectedCgpa"
                name="Projected CGPA"
                stroke="#c084fc"
                strokeWidth={3}
                strokeDasharray="6 6"
                dot={{ r: 5, fill: "#c084fc", strokeWidth: 2, stroke: "#ffffff" }}
                activeDot={{ r: 7, fill: "#a855f7" }}
                connectNulls
              />
            )}

            {/* Official SGPA Line */}
            {visibleSeries.officialSgpa && (
              <Line
                type="monotone"
                dataKey="officialSgpa"
                name="Official SGPA"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 5, fill: "#2563eb", strokeWidth: 2, stroke: "#ffffff" }}
                activeDot={{ r: 7, fill: "#1d4ed8", stroke: "#ffffff", strokeWidth: 2 }}
                connectNulls
              />
            )}

            {/* Projected SGPA Line */}
            {showPredictions && visibleSeries.projectedSgpa && (
              <Line
                type="monotone"
                dataKey="projectedSgpa"
                name="Projected SGPA"
                stroke="#60a5fa"
                strokeWidth={3}
                strokeDasharray="6 6"
                dot={{ r: 5, fill: "#60a5fa", strokeWidth: 2, stroke: "#ffffff" }}
                activeDot={{ r: 7, fill: "#3b82f6" }}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
