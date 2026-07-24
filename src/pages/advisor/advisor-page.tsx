import { Bot, TrendingDown, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const suggestions = [
  {
    icon: TrendingDown,
    tone: "warning" as const,
    text: "Computer Networks has declined across your last 2 assessments. The final is worth 50% of your grade — prioritize revision here first.",
  },
  {
    icon: Target,
    tone: "accent" as const,
    text: "You're 6% away from a 9.0 CGPA target. Data Structures and Database Systems currently have the most headroom to close that gap.",
  },
];

const toneColor = { warning: "var(--color-warning)", accent: "var(--color-accent)" };

export function AdvisorPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6 animate-fade-up">
      <div className="flex items-center gap-2">
        <Bot size={20} className="text-[var(--color-accent)]" />
        <h1 className="text-2xl font-semibold">AI Advisor</h1>
      </div>
      <p className="text-sm text-[var(--text-secondary)]">
        Personalized, specific suggestions based on your current marks, trends, and targets.
      </p>
      <div className="flex flex-col gap-3">
        {suggestions.map((s, i) => (
          <Card key={i}>
            <CardContent className="flex items-start gap-3 pt-5">
              <s.icon size={18} style={{ color: toneColor[s.tone] }} className="mt-0.5 shrink-0" />
              <p className="text-sm">{s.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
