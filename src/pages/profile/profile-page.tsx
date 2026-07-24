import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { communityTemplates } from "@/lib/data/mock";

export function ProfilePage() {
  const contributed = communityTemplates.slice(0, 1);

  return (
    <div className="flex max-w-2xl flex-col gap-6 animate-fade-up">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-2xl text-[var(--color-accent)]">
          R
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Ria</h1>
          <p className="text-sm text-[var(--text-secondary)]">Chitkara University Institute of Engineering & Technology</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-[var(--text-secondary)]">Semesters tracked</p>
            <p className="text-2xl font-semibold font-tabular">4</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-[var(--text-secondary)]">Templates contributed</p>
            <p className="text-2xl font-semibold font-tabular">{contributed.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 pt-5">
          <p className="mb-1 text-sm font-medium text-[var(--text-secondary)]">Your Contributed Templates</p>
          {contributed.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--border-hairline)" }}>
              <span>{t.university} — {t.name}</span>
              <Badge tone={t.verified ? "success" : "warning"}>{t.verified ? "Verified" : "Pending review"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
