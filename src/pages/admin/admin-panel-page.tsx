import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, CheckCircle2, XCircle, FileEdit, Clock, History } from "lucide-react";
import { toast } from "sonner";

const pending = [
  { id: "1", university: "Delta Institute of Technology", submittedBy: "student_842", weights: "Quiz 10% · Lab 20% · Mid 30% · Final 40%" },
  { id: "2", university: "Chitkara University (Revision)", submittedBy: "student_213", weights: "Assignments 20% · Midterm 30% · Final 50%" },
];

export function AdminPanelPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-8 pb-10">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-xs font-semibold text-amber-300 mb-2">
          <ShieldAlert size={12} className="text-amber-400" /> System Moderation
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Admin Template Moderation</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">Review community-submitted grading schemes and verify assessment weightages.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-amber-400" />
            <CardTitle>Pending Review Queue ({pending.length})</CardTitle>
          </div>
          <Badge tone="warning">Action Needed</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {pending.map((p) => (
            <div key={p.id} className="rounded-xl border border-white/10 bg-zinc-950/60 p-4 text-xs">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">{p.university}</h3>
                <Badge tone="warning">Pending Verification</Badge>
              </div>

              <p className="mb-2 text-zinc-500 font-mono">Submitted by {p.submittedBy}</p>
              <p className="mb-4 text-purple-300 font-medium bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">{p.weights}</p>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="primary" className="gap-1.5" onClick={() => toast.success(`Approved ${p.university}`)}>
                  <CheckCircle2 size={14} /> Approve Scheme
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.info("Requested revision")}>
                  <FileEdit size={14} /> Request Changes
                </Button>
                <Button size="sm" variant="danger" className="gap-1.5" onClick={() => toast.error("Rejected submission")}>
                  <XCircle size={14} /> Reject
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={18} className="text-purple-400" />
            <CardTitle>Moderation Audit Log</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-xs">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950/40 p-3 text-zinc-300">
            <span>Approved "XYZ University — Standard Scheme"</span>
            <span className="text-zinc-500 font-mono">2 days ago</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950/40 p-3 text-zinc-300">
            <span>Rejected "Fake Test University"</span>
            <span className="text-zinc-500 font-mono">5 days ago</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
