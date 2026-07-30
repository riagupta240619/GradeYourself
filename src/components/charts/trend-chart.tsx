import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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
  // Legacy fields fallback
  value?: number | null;
  projectedValue?: number | null;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const point = payload[0].payload as TrendChartPoint;
    const isProj = point.isProjected;

    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-900/95 p-3.5 text-xs shadow-2xl backdrop-blur-md min-w-[200px] flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <p className="font-bold text-white text-xs">{point.label}</p>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isProj ? "bg-purple-500/20 text-purple-300" : "bg-emerald-500/20 text-emerald-300"}`}>
            {isProj ? "Projected" : "Completed"}
          </span>
        </div>

        {isProj ? (
          <div className="flex flex-col gap-1.5 font-mono">
            <div className="flex items-center justify-between gap-3 text-blue-300">
              <span className="font-sans font-semibold">Projected SGPA:</span>
              <span className="font-bold text-white text-sm">
                {point.projectedSgpa !== null && point.projectedSgpa !== undefined ? Number(point.projectedSgpa).toFixed(2) : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 text-purple-300">
              <span className="font-sans font-semibold">Projected CGPA:</span>
              <span className="font-bold text-white text-sm">
                {point.projectedCgpa !== null && point.projectedCgpa !== undefined ? Number(point.projectedCgpa).toFixed(2) : "—"}
              </span>
            </div>

            {typeof point.confidencePct === "number" && (
              <div className="flex items-center justify-between gap-3 text-zinc-400 text-[11px] pt-1">
                <span className="font-sans">Confidence:</span>
                <span className="font-bold text-emerald-400">{point.confidencePct}%</span>
              </div>
            )}

            <p className="text-[10px] text-zinc-400 italic pt-1.5 border-t border-white/10 font-sans">
              {point.note || "Based on entered assessments"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 font-mono">
            <div className="flex items-center justify-between gap-3 text-blue-400">
              <span className="font-sans font-semibold">Official SGPA:</span>
              <span className="font-bold text-white text-sm">
                {point.officialSgpa !== null && point.officialSgpa !== undefined ? Number(point.officialSgpa).toFixed(2) : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 text-purple-400">
              <span className="font-sans font-semibold">Official CGPA:</span>
              <span className="font-bold text-white text-sm">
                {point.officialCgpa !== null && point.officialCgpa !== undefined ? Number(point.officialCgpa).toFixed(2) : "—"}
              </span>
            </div>

            {typeof point.credits === "number" && (
              <div className="flex items-center justify-between gap-3 text-zinc-400 text-[11px] pt-1 font-sans">
                <span>Credits:</span>
                <span className="font-mono text-white font-bold">{point.credits}</span>
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
  // Series Visibility Toggle States
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

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-60 w-full flex items-center justify-center text-xs text-zinc-500 italic border border-dashed border-white/10 rounded-xl my-2">
        No progression trend data available yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full pt-2">
      {/* Interactive Legend with Toggles */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold px-2 py-1 bg-zinc-950/40 rounded-xl border border-white/5">
        <button
          onClick={() => toggleSeries("officialCgpa")}
          className={`flex items-center gap-1.5 transition-all ${visibleSeries.officialCgpa ? "text-purple-300 opacity-100" : "text-zinc-500 opacity-40 line-through"}`}
        >
          <span className="h-2.5 w-4 rounded-full bg-purple-500" />
          <span>Official CGPA</span>
        </button>

        {showPredictions && (
          <button
            onClick={() => toggleSeries("projectedCgpa")}
            className={`flex items-center gap-1.5 transition-all ${visibleSeries.projectedCgpa ? "text-purple-300 opacity-100" : "text-zinc-500 opacity-40 line-through"}`}
          >
            <span className="h-2.5 w-4 rounded-full bg-purple-400 border border-dashed border-purple-200" />
            <span>Projected CGPA</span>
          </button>
        )}

        <button
          onClick={() => toggleSeries("officialSgpa")}
          className={`flex items-center gap-1.5 transition-all ${visibleSeries.officialSgpa ? "text-blue-300 opacity-100" : "text-zinc-500 opacity-40 line-through"}`}
        >
          <span className="h-2.5 w-4 rounded-full bg-blue-500" />
          <span>Official SGPA</span>
        </button>

        {showPredictions && (
          <button
            onClick={() => toggleSeries("projectedSgpa")}
            className={`flex items-center gap-1.5 transition-all ${visibleSeries.projectedSgpa ? "text-blue-300 opacity-100" : "text-zinc-500 opacity-40 line-through"}`}
          >
            <span className="h-2.5 w-4 rounded-full bg-blue-400 border border-dashed border-blue-200" />
            <span>Projected SGPA</span>
          </button>
        )}
      </div>

      {/* Recharts 4 Series Container */}
      <div className="h-64 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 10]} stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />

            {/* 1. Official CGPA (Solid Purple) */}
            {visibleSeries.officialCgpa && (
              <Line
                type="monotone"
                dataKey="officialCgpa"
                stroke="#a855f7"
                strokeWidth={2.5}
                connectNulls={true}
                dot={{ fill: "#a855f7", r: 4 }}
                activeDot={{ r: 6 }}
                name="Official CGPA"
              />
            )}

            {/* 2. Projected CGPA (Dotted Purple) */}
            {showPredictions && visibleSeries.projectedCgpa && (
              <Line
                type="monotone"
                dataKey="projectedCgpa"
                stroke="#c084fc"
                strokeDasharray="5 5"
                strokeWidth={2.5}
                connectNulls={true}
                dot={{ fill: "#c084fc", r: 4 }}
                activeDot={{ r: 6 }}
                name="Projected CGPA"
              />
            )}

            {/* 3. Official SGPA (Solid Blue) */}
            {visibleSeries.officialSgpa && (
              <Line
                type="monotone"
                dataKey="officialSgpa"
                stroke="#3b82f6"
                strokeWidth={2.5}
                connectNulls={true}
                dot={{ fill: "#3b82f6", r: 4 }}
                activeDot={{ r: 6 }}
                name="Official SGPA"
              />
            )}

            {/* 4. Projected SGPA (Dotted Blue) */}
            {showPredictions && visibleSeries.projectedSgpa && (
              <Line
                type="monotone"
                dataKey="projectedSgpa"
                stroke="#60a5fa"
                strokeDasharray="5 5"
                strokeWidth={2.5}
                connectNulls={true}
                dot={{ fill: "#60a5fa", r: 4 }}
                activeDot={{ r: 6 }}
                name="Projected SGPA"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
