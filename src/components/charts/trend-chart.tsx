import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export interface TrendChartPoint {
  label: string;
  value: number | null;
  projectedValue?: number | null;
  confidencePct?: number;
  note?: string;
  isProjected?: boolean;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const point = payload[0].payload as TrendChartPoint;
    const isProj = point.isProjected;
    const val = isProj ? point.projectedValue : (point.value ?? point.projectedValue);
    const valStr = val !== null && val !== undefined ? Number(val).toFixed(2) : "In Progress";

    return (
      <div className="rounded-xl border border-white/10 bg-zinc-900/95 p-3 text-xs shadow-xl backdrop-blur-md min-w-[170px]">
        <p className="font-bold text-white mb-1.5 text-xs">{point.label}</p>
        {isProj ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-purple-300 font-semibold">
              <span>Projected CGPA:</span>
              <span className="font-mono text-white text-sm font-bold">{valStr}</span>
            </div>
            {typeof point.confidencePct === "number" && (
              <div className="flex items-center justify-between gap-3 text-zinc-400 text-[11px]">
                <span>Confidence:</span>
                <span className="font-mono text-emerald-400 font-bold">{point.confidencePct}%</span>
              </div>
            )}
            <p className="text-[10px] text-zinc-400 italic pt-1 border-t border-white/10">
              {point.note || "Based on current assessments"}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 text-purple-300 font-semibold">
            <span>Official Record:</span>
            <span className="font-mono text-white text-sm font-bold">{valStr}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function TrendChart({ data, mode = "official" }: { data: TrendChartPoint[]; mode?: "official" | "predicted" }) {
  const chartData = mode === "official" ? data.filter((d) => !d.isProjected) : data;
  const hasProjected = mode === "predicted" && data.some((d) => d.isProjected);

  return (
    <div className="h-60 w-full min-h-[200px] overflow-hidden pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" vertical={false} />
          <XAxis dataKey="label" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 10]} stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Official Solid Line for Completed Semesters */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-accent)"
            strokeWidth={2.5}
            connectNulls={true}
            dot={{ fill: "var(--color-accent)", r: 4 }}
            activeDot={{ r: 6 }}
            name="value"
          />

          {/* Dotted / Projected Line for Current Semester Prediction in Predicted Mode */}
          {hasProjected && (
            <Line
              type="monotone"
              dataKey="projectedValue"
              stroke="#c084fc"
              strokeDasharray="5 5"
              strokeWidth={2.5}
              connectNulls={true}
              dot={{ fill: "#c084fc", r: 4 }}
              activeDot={{ r: 6 }}
              name="projectedValue"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
