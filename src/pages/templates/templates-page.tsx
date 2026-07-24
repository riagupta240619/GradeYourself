import { Search, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { communityTemplates } from "@/lib/data/mock";

export function TemplatesPage() {
  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Community Templates</h1>
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-[var(--text-tertiary)]" style={{ borderColor: "var(--border-hairline)" }}>
          <Search size={15} />
          Search university...
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {communityTemplates.map((t) => (
          <Card key={t.id}>
            <CardContent className="flex flex-col gap-3 pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{t.university}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{t.name}</p>
                </div>
                {t.verified ? (
                  <Badge tone="success"><CheckCircle2 size={12} /> Verified</Badge>
                ) : (
                  <Badge tone="warning"><AlertCircle size={12} /> Unverified</Badge>
                )}
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">Used by {t.usedBy.toLocaleString()} students</p>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">Use template</Button>
                <Button size="sm" variant="outline" className="flex-1">Preview</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
