import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Sliders,
  Calendar,
  Sparkles,
  BarChart3,
  BookOpen,
  ArrowUpRight,
  TrendingDown,
  Info,
  Layers,
  X,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/utils/cn";

export interface AttendanceSubject {
  _id: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  deliveredClasses: number;
  attendedClasses: number;
  dutyLeaves: number;
  medicalLeaves: number;
  requiredPercentage: number;
  lectureDurationHours: number;
  lecturesPerWeek: number;
  colorTag: string;
  notes?: string;
  attendancePercentage: number;
  safeBunks: number;
  classesToRecover: number;
  isAtRisk: boolean;
  effectiveDelivered?: number;
  effectiveAttended?: number;
}

export interface TimetableEntry {
  _id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject?: { _id: string; subjectName: string; subjectCode: string } | null;
  subjectName: string;
  teacherName: string;
  room: string;
  lectureDurationHours: number;
}

export interface AttendanceRecord {
  _id: string;
  subject?: { _id: string; subjectName: string; subjectCode: string; colorTag?: string };
  date: string;
  status: "present" | "absent" | "dl" | "ml";
  durationHours: number;
  topic?: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function AttendancePage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "subjects" | "timetable" | "analytics">("dashboard");
  const [subjects, setSubjects] = useState<AttendanceSubject[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings
  const [defaultRequired, setDefaultRequired] = useState(75);
  const [calcMode, setCalcMode] = useState<"session" | "hours">("session");
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Subject Modal
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<AttendanceSubject | null>(null);
  const [subjectForm, setSubjectForm] = useState({
    subjectCode: "",
    subjectName: "",
    teacherName: "",
    deliveredClasses: 0,
    attendedClasses: 0,
    dutyLeaves: 0,
    medicalLeaves: 0,
    requiredPercentage: 75,
    lectureDurationHours: 1,
    lecturesPerWeek: 3,
    colorTag: "#8b5cf6",
  });

  // Timetable Modal
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [timetableForm, setTimetableForm] = useState({
    dayOfWeek: "Monday",
    startTime: "09:00 AM",
    endTime: "10:00 AM",
    subjectId: "",
    subjectName: "",
    teacherName: "",
    room: "",
    lectureDurationHours: 1,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, ttRes, recRes] = await Promise.all([
        api.get("/attendance/dashboard"),
        api.get("/attendance/timetable"),
        api.get("/attendance/records?limit=15"),
      ]);

      setSubjects(dashRes.data.subjects || []);
      setDefaultRequired(dashRes.data.requiredPercentage || 75);
      setCalcMode(dashRes.data.calculationMode || "session");
      setTimetable(ttRes.data.timetable || []);
      setRecords(recRes.data.records || []);
    } catch (err) {
      console.error("Failed to load attendance data:", err);
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Aggregate stats
  const stats = useMemo(() => {
    let delivered = 0;
    let attended = 0;
    let safeBunks = 0;
    let atRiskCount = 0;

    subjects.forEach((s) => {
      const mult = calcMode === "hours" ? (s.lectureDurationHours || 1) : 1;
      delivered += (s.deliveredClasses || 0) * mult;
      attended += ((s.attendedClasses || 0) + (s.dutyLeaves || 0) + (s.medicalLeaves || 0)) * mult;
      safeBunks += s.safeBunks || 0;
      if (s.isAtRisk) atRiskCount++;
    });

    const overallPct = delivered > 0 ? Number(((attended / delivered) * 100).toFixed(1)) : 100;
    return { delivered, attended, safeBunks, atRiskCount, overallPct };
  }, [subjects, calcMode]);

  // Handle Mark Attendance
  const handleMark = async (subjectId: string, status: "present" | "absent" | "dl" | "ml") => {
    try {
      await api.post("/attendance/records", { subjectId, status });
      const statusLabels = {
        present: "Marked Present (+1)",
        absent: "Marked Absent",
        dl: "Marked Duty Leave (DL)",
        ml: "Marked Medical Leave (ML)",
      };
      toast.success(statusLabels[status]);
      await loadData();
    } catch (err) {
      toast.error("Failed to record attendance");
    }
  };

  // Sync from CGPA Subjects
  const handleSyncCgpa = async () => {
    try {
      const res = await api.post("/attendance/subjects/sync-from-cgpa");
      toast.success(res.data.message || "Imported subjects");
      await loadData();
    } catch (err) {
      toast.error("Failed to import subjects");
    }
  };

  // Save Subject
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.subjectName.trim()) {
      toast.error("Subject name is required");
      return;
    }

    try {
      if (editingSubject) {
        await api.patch(`/attendance/subjects/${editingSubject._id}`, subjectForm);
        toast.success("Subject updated successfully");
      } else {
        await api.post("/attendance/subjects", subjectForm);
        toast.success("Subject added successfully");
      }
      setShowSubjectModal(false);
      setEditingSubject(null);
      await loadData();
    } catch (err) {
      toast.error("Failed to save subject");
    }
  };

  // Delete Subject
  const handleDeleteSubject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? All attendance logs will be deleted.`)) return;
    try {
      await api.delete(`/attendance/subjects/${id}`);
      toast.success("Subject deleted");
      await loadData();
    } catch (err) {
      toast.error("Failed to delete subject");
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    try {
      await api.put("/attendance/settings", {
        defaultRequiredPercentage: defaultRequired,
        calculationMode: calcMode,
      });
      toast.success("Attendance settings saved");
      setShowSettingsModal(false);
      await loadData();
    } catch (err) {
      toast.error("Failed to update settings");
    }
  };

  // Save Timetable Slot
  const handleSaveTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/attendance/timetable", timetableForm);
      toast.success("Timetable slot added");
      setShowTimetableModal(false);
      setTimetableForm({
        dayOfWeek: "Monday",
        startTime: "09:00 AM",
        endTime: "10:00 AM",
        subjectId: "",
        subjectName: "",
        teacherName: "",
        room: "",
        lectureDurationHours: 1,
      });
      await loadData();
    } catch (err) {
      toast.error("Failed to save timetable slot");
    }
  };

  const handleDeleteTimetable = async (id: string) => {
    try {
      await api.delete(`/attendance/timetable/${id}`);
      toast.success("Slot removed");
      await loadData();
    } catch (err) {
      toast.error("Failed to remove slot");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
              <CalendarCheck size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Smart Attendance Management
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Real-time bunk mathematics, required criteria monitoring & interactive timetable integration.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettingsModal(true)}
            className="border-[var(--border)] text-xs"
          >
            <Sliders size={14} className="mr-1.5" />
            Criteria Settings ({defaultRequired}%)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncCgpa}
            className="border-[var(--border)] text-xs"
          >
            <Sparkles size={14} className="mr-1.5 text-purple-600" />
            Import from CGPA
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingSubject(null);
              setSubjectForm({
                subjectCode: "",
                subjectName: "",
                teacherName: "",
                deliveredClasses: 0,
                attendedClasses: 0,
                dutyLeaves: 0,
                medicalLeaves: 0,
                requiredPercentage: defaultRequired,
                lectureDurationHours: 1,
                lecturesPerWeek: 3,
                colorTag: "#8b5cf6",
              });
              setShowSubjectModal(true);
            }}
            className="bg-purple-600 text-xs font-semibold text-white hover:bg-purple-700"
          >
            <Plus size={15} className="mr-1" />
            Add Subject
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)]">
        {[
          { id: "dashboard", label: "Attendance Dashboard", icon: BarChart3 },
          { id: "subjects", label: "Subject Breakdown", icon: BookOpen },
          { id: "timetable", label: "Timetable & Schedule", icon: Calendar },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition-colors duration-150",
              activeTab === tab.id
                ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1.1 ATTENDANCE DASHBOARD VIEW */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Overall Attendance */}
            <div className="surface-card rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Overall Attendance
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                    stats.overallPct >= defaultRequired
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400"
                  )}
                >
                  {stats.overallPct >= defaultRequired ? "On Track" : "Low"}
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[var(--text-primary)]">
                  {stats.overallPct}%
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  ({stats.attended}/{stats.delivered} {calcMode === "hours" ? "hrs" : "classes"})
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface-elevated)]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    stats.overallPct >= defaultRequired ? "bg-emerald-500" : "bg-red-500"
                  )}
                  style={{ width: `${Math.min(100, stats.overallPct)}%` }}
                />
              </div>
            </div>

            {/* Required Attendance */}
            <div className="surface-card rounded-2xl p-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Required Attendance
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[var(--text-primary)]">
                  {defaultRequired}%
                </span>
                <span className="text-xs text-purple-600 dark:text-purple-400">Min. Target</span>
              </div>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                Mode: <span className="font-semibold capitalize">{calcMode} based</span>
              </p>
            </div>

            {/* Total Subjects */}
            <div className="surface-card rounded-2xl p-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Enrolled Subjects
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[var(--text-primary)]">
                  {subjects.length}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">Active courses</span>
              </div>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                All tracked in real time
              </p>
            </div>

            {/* Safe Bunks Available */}
            <div className="surface-card rounded-2xl p-5 border-emerald-500/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Safe Bunks Available
                </span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {stats.safeBunks}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">classes</span>
              </div>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                Can miss without falling below target
              </p>
            </div>

            {/* Subjects At Risk */}
            <div
              className={cn(
                "surface-card rounded-2xl p-5",
                stats.atRiskCount > 0 && "border-red-500/30 bg-red-500/5"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    stats.atRiskCount > 0 ? "text-red-600 dark:text-red-400" : "text-[var(--text-tertiary)]"
                  )}
                >
                  Subjects At Risk
                </span>
                <AlertTriangle
                  size={16}
                  className={stats.atRiskCount > 0 ? "text-red-500" : "text-[var(--text-tertiary)]"}
                />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span
                  className={cn(
                    "text-3xl font-extrabold",
                    stats.atRiskCount > 0 ? "text-red-600 dark:text-red-400" : "text-[var(--text-primary)]"
                  )}
                >
                  {stats.atRiskCount}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">subjects</span>
              </div>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                {stats.atRiskCount > 0 ? "Needs recovery attendance" : "All subjects safe!"}
              </p>
            </div>
          </div>

          {/* Visualization Graph & Safe Bunk Overview */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Attendance Graph */}
            <div className="surface-card rounded-2xl p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-base text-[var(--text-primary)]">
                    Attendance Percentage by Subject
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Dashed line indicates minimum required criteria ({defaultRequired}%)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span>Safe</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span>At Risk</span>
                  </div>
                </div>
              </div>

              {subjects.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-center">
                  <BookOpen className="h-10 w-10 text-[var(--text-tertiary)] mb-2" />
                  <p className="text-sm font-medium text-[var(--text-primary)]">No subjects found</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Add subjects or click "Import from CGPA" to visualize your attendance.
                  </p>
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={subjects}
                      margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                    >
                      <XAxis
                        dataKey="subjectName"
                        tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                        unit="%"
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as AttendanceSubject;
                            return (
                              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 shadow-lg">
                                <p className="font-semibold text-xs text-[var(--text-primary)]">
                                  {data.subjectName}
                                </p>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">
                                  Attendance:{" "}
                                  <span className="font-bold text-[var(--text-primary)]">
                                    {data.attendancePercentage}%
                                  </span>
                                </p>
                                <p className="text-xs text-[var(--text-secondary)]">
                                  Attended: {data.attendedClasses} / {data.deliveredClasses} classes
                                </p>
                                {data.safeBunks > 0 ? (
                                  <p className="text-xs font-semibold text-emerald-600 mt-1">
                                    ✓ Can miss {data.safeBunks} more classes
                                  </p>
                                ) : (
                                  <p className="text-xs font-semibold text-red-600 mt-1">
                                    ⚠ Must attend next {data.classesToRecover} classes
                                  </p>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine
                        y={defaultRequired}
                        stroke="#ef4444"
                        strokeDasharray="4 4"
                        label={{
                          value: `Req: ${defaultRequired}%`,
                          position: "top",
                          fill: "#ef4444",
                          fontSize: 10,
                        }}
                      />
                      <Bar dataKey="attendancePercentage" radius={[6, 6, 0, 0]}>
                        {subjects.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.attendancePercentage >= (entry.requiredPercentage || defaultRequired)
                                ? entry.colorTag || "#10b981"
                                : "#ef4444"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Quick Actions & Recent Attendance Activity */}
            <div className="space-y-4">
              <div className="surface-card rounded-2xl p-5">
                <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-3">
                  Quick Attendance Action
                </h3>
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {subjects.slice(0, 4).map((s) => (
                    <div
                      key={s._id}
                      className="flex items-center justify-between rounded-xl border border-[var(--border)] p-2.5 bg-[var(--bg-surface-elevated)]"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="truncate text-xs font-semibold text-[var(--text-primary)]">
                          {s.subjectName}
                        </p>
                        <p className="text-[11px] text-[var(--text-tertiary)]">
                          {s.attendedClasses}/{s.deliveredClasses} • {s.attendancePercentage}%
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMark(s._id, "present")}
                          className="rounded-lg bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors"
                          title="Mark Present"
                        >
                          +P
                        </button>
                        <button
                          onClick={() => handleMark(s._id, "absent")}
                          className="rounded-lg bg-red-500/10 px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-500 hover:text-white transition-colors"
                          title="Mark Absent"
                        >
                          +A
                        </button>
                        <button
                          onClick={() => handleMark(s._id, "dl")}
                          className="rounded-lg bg-blue-500/10 px-2 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-500 hover:text-white transition-colors"
                          title="Mark Duty Leave (DL)"
                        >
                          +DL
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safe Bunk Insights Card */}
              <div className="surface-card rounded-2xl p-5 bg-gradient-to-br from-purple-500/5 to-purple-600/10 border-purple-500/20">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-semibold text-xs mb-2">
                  <Info size={15} />
                  <span>Safe Bunk Calculator Logic</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Formula: <code className="bg-purple-100 dark:bg-purple-900/40 px-1 py-0.5 rounded font-mono">X = ⌊(Attended × 100 / Req) - Total⌋</code>.
                  Leaves (Duty Leave & Medical Leave) are added to attended classes to protect your academic standing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1.2 SUBJECT BREAKDOWN & TABLE VIEW (Matches Existing College ERP standard) */}
      {(activeTab === "subjects" || activeTab === "dashboard") && (
        <section className="surface-card rounded-2xl p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Enrolled Subjects & Attendance Register
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Full ledger displaying Subject Code, Teacher Name, Delivered, Attended, DL, ML, Percentage and Actionable Bunk status.
              </p>
            </div>
          </div>

          {subjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
              <Layers className="mx-auto h-10 w-10 text-[var(--text-tertiary)]" />
              <h3 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
                No Attendance Subjects Added Yet
              </h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                Get started quickly by syncing your existing semester subjects or adding them manually.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <Button size="sm" onClick={handleSyncCgpa} variant="outline" className="text-xs">
                  <Sparkles size={14} className="mr-1 text-purple-600" />
                  Sync from CGPA
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowSubjectModal(true)}
                  className="bg-purple-600 text-xs text-white"
                >
                  <Plus size={14} className="mr-1" />
                  Add Subject
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]">
                  <tr>
                    <th className="py-3 px-3 font-semibold">Subject Code</th>
                    <th className="py-3 px-3 font-semibold">Subject Name</th>
                    <th className="py-3 px-3 font-semibold">Teacher Name</th>
                    <th className="py-3 px-3 font-semibold text-center">Duration</th>
                    <th className="py-3 px-3 font-semibold text-center">Delivered</th>
                    <th className="py-3 px-3 font-semibold text-center">Attended</th>
                    <th className="py-3 px-3 font-semibold text-center" title="Duty Leave">DL</th>
                    <th className="py-3 px-3 font-semibold text-center" title="Medical Leave">ML</th>
                    <th className="py-3 px-3 font-semibold text-center">Percentage</th>
                    <th className="py-3 px-3 font-semibold">Safe Bunks / Recovery</th>
                    <th className="py-3 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {subjects.map((s) => (
                    <tr
                      key={s._id}
                      className="hover:bg-[var(--bg-surface-elevated)] transition-colors group"
                    >
                      {/* Code */}
                      <td className="py-3 px-3 font-mono font-medium text-[var(--text-primary)]">
                        {s.subjectCode || "—"}
                      </td>

                      {/* Name */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: s.colorTag || "#8b5cf6" }}
                          />
                          <span className="font-semibold text-[var(--text-primary)]">
                            {s.subjectName}
                          </span>
                        </div>
                      </td>

                      {/* Teacher */}
                      <td className="py-3 px-3 text-[var(--text-secondary)]">
                        {s.teacherName || "Faculty"}
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-3 text-center text-[var(--text-tertiary)]">
                        {s.lectureDurationHours || 1} hr
                      </td>

                      {/* Delivered */}
                      <td className="py-3 px-3 text-center font-semibold text-[var(--text-primary)]">
                        {s.deliveredClasses}
                      </td>

                      {/* Attended */}
                      <td className="py-3 px-3 text-center font-semibold text-emerald-600">
                        {s.attendedClasses}
                      </td>

                      {/* DL */}
                      <td className="py-3 px-3 text-center font-medium text-blue-600">
                        {s.dutyLeaves}
                      </td>

                      {/* ML */}
                      <td className="py-3 px-3 text-center font-medium text-amber-600">
                        {s.medicalLeaves}
                      </td>

                      {/* Percentage */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-2 py-0.5 font-bold font-mono text-xs",
                            s.attendancePercentage >= (s.requiredPercentage || defaultRequired)
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-red-500/10 text-red-600 dark:text-red-400"
                          )}
                        >
                          {s.attendancePercentage}%
                        </span>
                      </td>

                      {/* Safe Bunks Status (1.4 Requirement) */}
                      <td className="py-3 px-3">
                        {s.attendancePercentage >= (s.requiredPercentage || defaultRequired) ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 size={14} className="shrink-0" />
                            <span>
                              You can safely miss{" "}
                              <strong>{s.safeBunks}</strong> more{" "}
                              {s.safeBunks === 1 ? "class" : "classes"}.
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium">
                            <AlertTriangle size={14} className="shrink-0" />
                            <span>
                              Cannot miss any classes. Attend next{" "}
                              <strong>{s.classesToRecover}</strong> continuously to reach{" "}
                              {s.requiredPercentage || defaultRequired}%.
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleMark(s._id, "present")}
                            className="rounded p-1.5 text-emerald-600 hover:bg-emerald-500/10"
                            title="Present"
                          >
                            <UserCheck size={15} />
                          </button>
                          <button
                            onClick={() => handleMark(s._id, "absent")}
                            className="rounded p-1.5 text-red-600 hover:bg-red-500/10"
                            title="Absent"
                          >
                            <UserX size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingSubject(s);
                              setSubjectForm({
                                subjectCode: s.subjectCode || "",
                                subjectName: s.subjectName,
                                teacherName: s.teacherName || "",
                                deliveredClasses: s.deliveredClasses,
                                attendedClasses: s.attendedClasses,
                                dutyLeaves: s.dutyLeaves,
                                medicalLeaves: s.medicalLeaves,
                                requiredPercentage: s.requiredPercentage || defaultRequired,
                                lectureDurationHours: s.lectureDurationHours || 1,
                                lecturesPerWeek: s.lecturesPerWeek || 3,
                                colorTag: s.colorTag || "#8b5cf6",
                              });
                              setShowSubjectModal(true);
                            }}
                            className="rounded p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-strong)] hover:text-[var(--text-primary)]"
                            title="Edit Subject"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(s._id, s.subjectName)}
                            className="rounded p-1.5 text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-600"
                            title="Delete Subject"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* 1.6 TIMETABLE INTEGRATION */}
      {activeTab === "timetable" && (
        <section className="space-y-6">
          <div className="surface-card rounded-2xl p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Weekly Timetable & Schedule
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Schedule lectures by day and time. Lecture durations (e.g. 2 hours) directly inform attendance accounting.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowTimetableModal(true)}
                className="bg-purple-600 text-xs font-semibold text-white"
              >
                <Plus size={14} className="mr-1" />
                Add Lecture Slot
              </Button>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {DAYS.map((day) => {
                const daySlots = timetable.filter((t) => t.dayOfWeek === day);
                return (
                  <div
                    key={day}
                    className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-4 flex flex-col"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5 mb-3">
                      <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
                        {day}
                      </span>
                      <span className="rounded-full bg-purple-500/10 text-purple-600 px-2 py-0.5 text-[10px] font-bold">
                        {daySlots.length} {daySlots.length === 1 ? "lecture" : "lectures"}
                      </span>
                    </div>

                    {daySlots.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[var(--text-tertiary)] italic">
                        No lectures scheduled
                      </div>
                    ) : (
                      <div className="space-y-2.5 flex-1">
                        {daySlots.map((slot) => (
                          <div
                            key={slot._id}
                            className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3 shadow-xs transition hover:border-purple-500/40"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-xs text-[var(--text-primary)]">
                                  {slot.subjectName}
                                </p>
                                <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                                  <Clock size={12} className="text-purple-600" />
                                  <span>
                                    {slot.startTime} – {slot.endTime} ({slot.lectureDurationHours} hr)
                                  </span>
                                </div>
                                {slot.room && (
                                  <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">
                                    Room: {slot.room} {slot.teacherName ? `• ${slot.teacherName}` : ""}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteTimetable(slot._id)}
                                className="text-[var(--text-tertiary)] hover:text-red-500 p-1 rounded"
                                title="Remove slot"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* MODAL: Edit / Add Subject */}
      <AnimatePresence>
        {showSubjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  {editingSubject ? "Edit Subject Attendance" : "Add Attendance Subject"}
                </h3>
                <button
                  onClick={() => setShowSubjectModal(false)}
                  className="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-elevated)]"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveSubject} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                      Subject Name *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Algorithm Design"
                      value={subjectForm.subjectName}
                      onChange={(e) => setSubjectForm({ ...subjectForm, subjectName: e.target.value })}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)] outline-hidden focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                      Subject Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CS301"
                      value={subjectForm.subjectCode}
                      onChange={(e) => setSubjectForm({ ...subjectForm, subjectCode: e.target.value })}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)] outline-hidden focus:border-purple-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                      Teacher Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Jane Smith"
                      value={subjectForm.teacherName}
                      onChange={(e) => setSubjectForm({ ...subjectForm, teacherName: e.target.value })}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)] outline-hidden focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                      Subject Required % (Override)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={subjectForm.requiredPercentage}
                      onChange={(e) =>
                        setSubjectForm({ ...subjectForm, requiredPercentage: Number(e.target.value) })
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)] outline-hidden focus:border-purple-600"
                    />
                  </div>
                </div>

                {/* Lecture Duration & Classes */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                      Lecture Duration (Hours)
                    </label>
                    <select
                      value={subjectForm.lectureDurationHours}
                      onChange={(e) =>
                        setSubjectForm({ ...subjectForm, lectureDurationHours: Number(e.target.value) })
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)]"
                    >
                      <option value="1">1 Hour</option>
                      <option value="1.5">1.5 Hours</option>
                      <option value="2">2 Hours</option>
                      <option value="3">3 Hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                      Lectures Per Week
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={subjectForm.lecturesPerWeek}
                      onChange={(e) =>
                        setSubjectForm({ ...subjectForm, lecturesPerWeek: Number(e.target.value) })
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)] outline-hidden focus:border-purple-600"
                    />
                  </div>
                </div>

                {/* Delivered, Attended, DL, ML */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-3 space-y-2">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] block">
                    Initial Ledger Counts
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] text-[var(--text-secondary)] block">Delivered</label>
                      <input
                        type="number"
                        min="0"
                        value={subjectForm.deliveredClasses}
                        onChange={(e) =>
                          setSubjectForm({ ...subjectForm, deliveredClasses: Number(e.target.value) })
                        }
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-2 text-xs text-center font-bold text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--text-secondary)] block">Attended</label>
                      <input
                        type="number"
                        min="0"
                        value={subjectForm.attendedClasses}
                        onChange={(e) =>
                          setSubjectForm({ ...subjectForm, attendedClasses: Number(e.target.value) })
                        }
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-2 text-xs text-center font-bold text-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--text-secondary)] block">Duty Leave</label>
                      <input
                        type="number"
                        min="0"
                        value={subjectForm.dutyLeaves}
                        onChange={(e) =>
                          setSubjectForm({ ...subjectForm, dutyLeaves: Number(e.target.value) })
                        }
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-2 text-xs text-center font-bold text-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--text-secondary)] block">Medical Leave</label>
                      <input
                        type="number"
                        min="0"
                        value={subjectForm.medicalLeaves}
                        onChange={(e) =>
                          setSubjectForm({ ...subjectForm, medicalLeaves: Number(e.target.value) })
                        }
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-2 text-xs text-center font-bold text-amber-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSubjectModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-purple-600 text-xs text-white">
                    {editingSubject ? "Save Changes" : "Create Subject"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Attendance Settings (1.2 Requirement) */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  Required Attendance Criteria
                </h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-elevated)]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Default Required Attendance Percentage
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="50"
                      max="95"
                      step="5"
                      value={defaultRequired}
                      onChange={(e) => setDefaultRequired(Number(e.target.value))}
                      className="flex-1 accent-purple-600"
                    />
                    <span className="w-12 rounded-lg bg-purple-100 dark:bg-purple-900/40 p-1.5 text-center font-bold text-purple-700 dark:text-purple-300">
                      {defaultRequired}%
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                    Standard university baseline is typically 75% or 80%.
                  </p>
                </div>

                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Attendance Calculation Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCalcMode("session")}
                      className={cn(
                        "rounded-xl border p-3 text-left transition",
                        calcMode === "session"
                          ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-300"
                          : "border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]"
                      )}
                    >
                      <p className="font-bold">Session / Class based</p>
                      <p className="text-[10px] opacity-80 mt-0.5">1 class = 1 attendance unit</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCalcMode("hours")}
                      className={cn(
                        "rounded-xl border p-3 text-left transition",
                        calcMode === "hours"
                          ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-300"
                          : "border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]"
                      )}
                    >
                      <p className="font-bold">Hour based</p>
                      <p className="text-[10px] opacity-80 mt-0.5">Accounts for lecture duration</p>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowSettingsModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    className="bg-purple-600 text-xs text-white"
                  >
                    Save Settings
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Timetable Slot Entry */}
      <AnimatePresence>
        {showTimetableModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  Add Timetable Slot
                </h3>
                <button
                  onClick={() => setShowTimetableModal(false)}
                  className="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-elevated)]"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveTimetable} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Day of Week
                  </label>
                  <select
                    value={timetableForm.dayOfWeek}
                    onChange={(e) => setTimetableForm({ ...timetableForm, dayOfWeek: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)]"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Select Subject
                  </label>
                  <select
                    value={timetableForm.subjectId}
                    onChange={(e) => {
                      const sel = subjects.find((s) => s._id === e.target.value);
                      setTimetableForm({
                        ...timetableForm,
                        subjectId: e.target.value,
                        subjectName: sel?.subjectName || timetableForm.subjectName,
                        teacherName: sel?.teacherName || timetableForm.teacherName,
                        lectureDurationHours: sel?.lectureDurationHours || 1,
                      });
                    }}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)]"
                  >
                    <option value="">-- Choose Existing Subject or Type Below --</option>
                    {subjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.subjectName} ({s.subjectCode || "N/A"})
                      </option>
                    ))}
                  </select>
                </div>

                {!timetableForm.subjectId && (
                  <div>
                    <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                      Subject Name *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Algorithm Design"
                      value={timetableForm.subjectName}
                      onChange={(e) =>
                        setTimetableForm({ ...timetableForm, subjectName: e.target.value })
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)]"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                      Start Time
                    </label>
                    <input
                      type="text"
                      placeholder="09:00 AM"
                      value={timetableForm.startTime}
                      onChange={(e) =>
                        setTimetableForm({ ...timetableForm, startTime: e.target.value })
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                      End Time
                    </label>
                    <input
                      type="text"
                      placeholder="11:00 AM"
                      value={timetableForm.endTime}
                      onChange={(e) =>
                        setTimetableForm({ ...timetableForm, endTime: e.target.value })
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                      Room / Hall
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lab 4B / Room 204"
                      value={timetableForm.room}
                      onChange={(e) =>
                        setTimetableForm({ ...timetableForm, room: e.target.value })
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                      Lecture Duration (hrs)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="6"
                      value={timetableForm.lectureDurationHours}
                      onChange={(e) =>
                        setTimetableForm({
                          ...timetableForm,
                          lectureDurationHours: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTimetableModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-purple-600 text-xs text-white">
                    Add Slot
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
