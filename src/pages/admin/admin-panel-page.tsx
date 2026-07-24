import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert } from "lucide-react";

const pending = [
  { id: "1", university: "Delta Institute of Technology", submittedBy: "student_842", weights: "Quiz 10% · Lab 20% · Mid 30% · Final 40%" },
  { id: "2", university: "Chitkara University (revision)", submittedBy: "student_213", weights: "Assignments 20% · Midterm 30% · Final 50%" },
];

export function AdminPanelPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6 animate-fade-up">
      <div className="flex items-center gap-2">
        <ShieldAlert size={20} className="text-[var(--color-warning)]" />
        <h1 className="text-2xl font-semibold">Admin Panel — Template Moderation</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[var(--text-primary)]">Pending Review ({pending.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {pending.map((p) => (
            <div key={p.id} className="rounded-lg border p-4" style={{ borderColor: "var(--border-hairline)" }}>
              <div className="mb-1 flex items-center justify-between">
                <p className="font-medium">{p.university}</p>
                <Badge tone="warning">Pending</Badge>
              </div>
              <p className="mb-1 text-xs text-[var(--text-tertiary)]">Submitted by {p.submittedBy}</p>
              <p className="mb-3 text-sm text-[var(--text-secondary)]">{p.weights}</p>
              <div className="flex gap-2">
                <Button size="sm">Approve</Button>
                <Button size="sm" variant="outline">Request changes</Button>
                <Button size="sm" variant="danger">Reject</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[var(--text-primary)]">Audit Log</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-[var(--text-secondary)]">
          <p>Approved "XYZ University — Standard Scheme" — 2 days ago</p>
          <p>Rejected "Fake Test University" — 5 days ago</p>
        </CardContent>
      </Card>
    </div>
  );
}
