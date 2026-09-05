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
import {
  SemesterService,
  type SemesterWithTotalCredits,
} from "@/services/semester-service";
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
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>("All");

  // Settings
  const [defaultRequired, setDefaultRequired] = useState(75);
  const [calcMode, setCalcMode] = useState<"session" | "hours">("session");
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Sync from CGPA Modal
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [semesters, setSemesters] = useState<SemesterWithTotalCredits[]>([]);
  const [syncSemesterId, setSyncSemesterId] = useState<string>("current");
  const [replaceExistingSync, setReplaceExistingSync] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [previewSubjects, setPreviewSubjects] = useState<
    Array<{ _id?: string; name: string; code?: string }>
  >([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

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
      const [dashRes, ttRes, recRes, semRes] = await Promise.all([
        api.get("/attendance/dashboard"),
        api.get("/attendance/timetable"),
        api.get("/attendance/records?limit=15"),
        SemesterService.getSemesters().catch(() => []),
      ]);

      setSubjects(dashRes.data.subjects || []);
      setDefaultRequired(dashRes.data.requiredPercentage || 75);
      setCalcMode(dashRes.data.calculationMode || "session");
      setTimetable(ttRes.data.timetable || []);
      setRecords(recRes.data.records || []);
      setSemesters(semRes || []);
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

  const currentSemester = useMemo(() => {
    return semesters.find((s) => s.isCurrent) || semesters[semesters.length - 1];
  }, [semesters]);

  // Load preview of subjects for selected semester in sync modal
  useEffect(() => {
    if (!showSyncModal) return;
    const fetchPreview = async () => {
      try {
        setLoadingPreview(true);
        let semId = syncSemesterId;
        if (semId === "current") {
          semId = currentSemester?.id || currentSemester?._id || "";
        }
        if (!semId) {
          setPreviewSubjects([]);
          return;
        }
        const res = await api.get(`/subjects?semesterId=${semId}`);
        setPreviewSubjects(res.data || []);
      } catch (err) {
        setPreviewSubjects([]);
      } finally {
        setLoadingPreview(false);
      }
    };
    void fetchPreview();
  }, [showSyncModal, syncSemesterId, currentSemester]);

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
  const handleExecuteSync = async () => {
    try {
      setIsSyncing(true);
      const res = await api.post("/attendance/subjects/sync-from-cgpa", {
        semesterId: syncSemesterId,
        replaceExisting: replaceExistingSync,
      });
      toast.success(res.data.message || "Imported subjects");
      setShowSyncModal(false);
      await loadData();
    } catch (err) {
      toast.error("Failed to import subjects");
    } finally {
      setIsSyncing(false);
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
    <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 mt-0.5 sm:mt-0">
              <CalendarCheck size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Smart Attendance Management
              </h1>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Real-time bunk mathematics, required criteria monitoring & interactive timetable integration.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettingsModal(true)}
            className="border-[var(--border)] text-xs flex-1 sm:flex-initial justify-center"
          >
            <Sliders size={14} className="mr-1.5 shrink-0" />
            <span className="hidden sm:inline">Criteria Settings</span>
            <span className="sm:hidden">Criteria</span> ({defaultRequired}%)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSyncSemesterId("current");
              setReplaceExistingSync(false);
              setShowSyncModal(true);
            }}
            className="border-[var(--border)] text-xs flex-1 sm:flex-initial justify-center"
          >
            <Sparkles size={14} className="mr-1.5 text-purple-600 shrink-0" />
            <span className="hidden sm:inline">Import from CGPA</span>
            <span className="sm:hidden">Import CGPA</span>
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
            className="bg-purple-600 text-xs font-semibold text-white hover:bg-purple-700 w-full sm:w-auto justify-center"
          >
            <Plus size={15} className="mr-1 shrink-0" />
            Add Subject
          </Button>
        </div>
      </div>

      {/* Responsive Tabs Strip with Horizontal Smooth Scrolling */}
      <div className="flex border-b border-[var(--border)] overflow-x-auto no-scrollbar scroll-smooth gap-1">
        {[
          { id: "dashboard", label: "Attendance Dashboard", icon: BarChart3 },
          { id: "subjects", label: "Subject Breakdown", icon: BookOpen },
          { id: "timetable", label: "Timetable & Schedule", icon: Calendar },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs font-semibold whitespace-nowrap transition-colors duration-150",
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
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Overall Attendance */}
            <div className="col-span-2 sm:col-span-1 lg:col-span-1 surface-card rounded-2xl p-4 sm:p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Overall Attendance
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0",
                    stats.overallPct >= defaultRequired
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400"
                  )}
                >
                  {stats.overallPct >= defaultRequired ? "On Track" : "Low"}
                </span>
              </div>
              <div className="mt-2.5 sm:mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                  {stats.overallPct}%
                </span>
                <span className="text-[11px] sm:text-xs text-[var(--text-secondary)]">
                  ({stats.attended}/{stats.delivered} {calcMode === "hours" ? "hrs" : "classes"})
                </span>
              </div>
              <div className="mt-2.5 sm:mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface-elevated)]">
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
            <div className="surface-card rounded-2xl p-4 sm:p-5">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block">
                Required Attendance
              </span>
              <div className="mt-2.5 sm:mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                  {defaultRequired}%
                </span>
                <span className="text-[11px] sm:text-xs text-purple-600 dark:text-purple-400">Min. Target</span>
              </div>
              <p className="mt-2 text-[11px] sm:text-xs text-[var(--text-secondary)]">
                Mode: <span className="font-semibold capitalize">{calcMode} based</span>
              </p>
            </div>

            {/* Total Subjects */}
            <div className="surface-card rounded-2xl p-4 sm:p-5">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block">
                Enrolled Subjects
              </span>
              <div className="mt-2.5 sm:mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                  {subjects.length}
                </span>
                <span className="text-[11px] sm:text-xs text-[var(--text-secondary)]">Active courses</span>
              </div>
              <p className="mt-2 text-[11px] sm:text-xs text-[var(--text-secondary)]">
                All tracked in real time
              </p>
            </div>

            {/* Safe Bunks Available */}
            <div className="surface-card rounded-2xl p-4 sm:p-5 border-emerald-500/20">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Safe Bunks
                </span>
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              </div>
              <div className="mt-2.5 sm:mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {stats.safeBunks}
                </span>
                <span className="text-[11px] sm:text-xs text-[var(--text-secondary)]">classes</span>
              </div>
              <p className="mt-2 text-[11px] sm:text-xs text-[var(--text-secondary)]">
                Can miss safely
              </p>
            </div>

            {/* Subjects At Risk */}
            <div
              className={cn(
                "col-span-2 sm:col-span-1 lg:col-span-1 surface-card rounded-2xl p-4 sm:p-5",
                stats.atRiskCount > 0 && "border-red-500/30 bg-red-500/5"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-[11px] sm:text-xs font-semibold uppercase tracking-wider",
                    stats.atRiskCount > 0 ? "text-red-600 dark:text-red-400" : "text-[var(--text-tertiary)]"
                  )}
                >
                  Subjects At Risk
                </span>
                <AlertTriangle
                  size={16}
                  className={cn("shrink-0", stats.atRiskCount > 0 ? "text-red-500" : "text-[var(--text-tertiary)]")}
                />
              </div>
              <div className="mt-2.5 sm:mt-3 flex items-baseline gap-2">
                <span
                  className={cn(
                    "text-2xl sm:text-3xl font-extrabold",
                    stats.atRiskCount > 0 ? "text-red-600 dark:text-red-400" : "text-[var(--text-primary)]"
                  )}
                >
                  {stats.atRiskCount}
                </span>
                <span className="text-[11px] sm:text-xs text-[var(--text-secondary)]">subjects</span>
              </div>
              <p className="mt-2 text-[11px] sm:text-xs text-[var(--text-secondary)]">
                {stats.atRiskCount > 0 ? "Needs recovery attendance" : "All safe!"}
              </p>
            </div>
          </div>

          {/* Visualization Graph & Safe Bunk Overview */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Attendance Graph */}
            <div className="surface-card rounded-2xl p-4 sm:p-6 lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-[var(--text-primary)]">
                    Attendance Percentage by Subject
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Dashed line indicates minimum required criteria ({defaultRequired}%)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs shrink-0">
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
                <div className="flex h-56 sm:h-64 flex-col items-center justify-center text-center p-4">
                  <BookOpen className="h-10 w-10 text-[var(--text-tertiary)] mb-2" />
                  <p className="text-sm font-medium text-[var(--text-primary)]">No subjects found</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Add subjects or click "Import from CGPA" to visualize your attendance.
                  </p>
                </div>
              ) : (
                <div className="h-60 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={subjects}
                      margin={{ top: 10, right: 10, left: -25, bottom: 25 }}
                    >
                      <XAxis
                        dataKey="subjectName"
                        tick={{ fill: "var(--text-tertiary)", fontSize: 10 }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={40}
                        tickFormatter={(val: string) => (val && val.length > 14 ? `${val.slice(0, 12)}…` : val)}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "var(--text-tertiary)", fontSize: 10 }}
                        unit="%"
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as AttendanceSubject;
                            return (
                              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 shadow-lg max-w-xs">
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
              <div className="surface-card rounded-2xl p-4 sm:p-5">
                <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-3">
                  Quick Attendance Action
                </h3>
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {subjects.slice(0, 4).map((s) => (
                    <div
                      key={s._id}
                      className="flex items-center justify-between rounded-xl border border-[var(--border)] p-2.5 bg-[var(--bg-surface-elevated)] gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-[var(--text-primary)]">
                          {s.subjectName}
                        </p>
                        <p className="text-[11px] text-[var(--text-tertiary)]">
                          {s.attendedClasses}/{s.deliveredClasses} • {s.attendancePercentage}%
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleMark(s._id, "present")}
                          className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors"
                          title="Mark Present"
                        >
                          +P
                        </button>
                        <button
                          onClick={() => handleMark(s._id, "absent")}
                          className="rounded-lg bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-500 hover:text-white transition-colors"
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
              <div className="surface-card rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-purple-500/5 to-purple-600/10 border-purple-500/20">
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
        <section className="surface-card rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                Enrolled Subjects & Attendance Register
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Full ledger displaying Delivered, Attended, DL, ML, Percentage and Actionable Bunk status.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSyncSemesterId("current");
                  setReplaceExistingSync(false);
                  setShowSyncModal(true);
                }}
                className="border-[var(--border)] text-xs flex-1 sm:flex-initial justify-center"
              >
                <Sparkles size={14} className="mr-1 text-purple-600" />
                Sync from CGPA
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
                className="bg-purple-600 text-xs font-semibold text-white hover:bg-purple-700 flex-1 sm:flex-initial justify-center"
              >
                <Plus size={14} className="mr-1" />
                Add Subject
              </Button>
            </div>
          </div>

          {subjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 sm:p-12 text-center">
              <Layers className="mx-auto h-10 w-10 text-[var(--text-tertiary)]" />
              <h3 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
                No Attendance Subjects Added Yet
              </h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                Get started quickly by syncing your existing semester subjects or adding them manually.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <Button
                  size="sm"
                  onClick={() => {
                    setSyncSemesterId("current");
                    setReplaceExistingSync(false);
                    setShowSyncModal(true);
                  }}
                  variant="outline"
                  className="text-xs flex-1 sm:flex-initial"
                >
                  <Sparkles size={14} className="mr-1 text-purple-600" />
                  Sync from CGPA
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowSubjectModal(true)}
                  className="bg-purple-600 text-xs text-white flex-1 sm:flex-initial"
                >
                  <Plus size={14} className="mr-1" />
                  Add Subject
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop & Tablet Table View */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-[var(--border)]">
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

                        {/* Safe Bunks Status */}
                        <td className="py-3 px-3">
                          {s.attendancePercentage >= (s.requiredPercentage || defaultRequired) ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle2 size={14} className="shrink-0" />
                              <span>
                                Can safely miss{" "}
                                <strong>{s.safeBunks}</strong> more{" "}
                                {s.safeBunks === 1 ? "class" : "classes"}.
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium">
                              <AlertTriangle size={14} className="shrink-0" />
                              <span>
                                Attend next{" "}
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

              {/* Mobile Subject Cards View */}
              <div className="md:hidden space-y-3">
                {subjects.map((s) => (
                  <div
                    key={s._id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-4 shadow-xs space-y-3"
                  >
                    {/* Header: Color + Subject Name + Subject Code + Pct */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span
                          className="h-3 w-3 rounded-full shrink-0 mt-0.5"
                          style={{ backgroundColor: s.colorTag || "#8b5cf6" }}
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-[var(--text-primary)] leading-snug break-words">
                            {s.subjectName}
                          </h4>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                            {s.subjectCode && (
                              <span className="font-mono bg-[var(--bg-surface)] px-1.5 py-0.5 rounded border border-[var(--border)] font-semibold text-[10px]">
                                {s.subjectCode}
                              </span>
                            )}
                            <span>•</span>
                            <span>{s.teacherName || "Faculty"}</span>
                            <span>•</span>
                            <span>{s.lectureDurationHours || 1} hr</span>
                          </div>
                        </div>
                      </div>

                      {/* Percentage Badge */}
                      <span
                        className={cn(
                          "inline-flex items-center rounded-lg px-2.5 py-1 font-bold font-mono text-xs shrink-0 shadow-xs",
                          s.attendancePercentage >= (s.requiredPercentage || defaultRequired)
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20"
                        )}
                      >
                        {s.attendancePercentage}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] font-medium">
                        <span>Target: {s.requiredPercentage || defaultRequired}%</span>
                        <span>{s.attendedClasses} of {s.deliveredClasses} classes</span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface)] border border-[var(--border)]">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            s.attendancePercentage >= (s.requiredPercentage || defaultRequired)
                              ? "bg-emerald-500"
                              : "bg-red-500"
                          )}
                          style={{ width: `${Math.min(100, s.attendancePercentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* 4 Mini Stat Blocks */}
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-2">
                        <span className="text-[10px] uppercase font-semibold text-[var(--text-tertiary)] block">Delivered</span>
                        <span className="text-xs font-bold text-[var(--text-primary)]">{s.deliveredClasses}</span>
                      </div>
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-2">
                        <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 block">Attended</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{s.attendedClasses}</span>
                      </div>
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-2">
                        <span className="text-[10px] uppercase font-semibold text-blue-600 dark:text-blue-400 block" title="Duty Leaves">DL</span>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{s.dutyLeaves}</span>
                      </div>
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-2">
                        <span className="text-[10px] uppercase font-semibold text-amber-600 dark:text-amber-400 block" title="Medical Leaves">ML</span>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{s.medicalLeaves}</span>
                      </div>
                    </div>

                    {/* Safe Bunk Status Banner */}
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-xl p-2.5 text-xs font-medium border",
                        s.attendancePercentage >= (s.requiredPercentage || defaultRequired)
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                          : "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20"
                      )}
                    >
                      {s.attendancePercentage >= (s.requiredPercentage || defaultRequired) ? (
                        <>
                          <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                          <span>
                            Can safely miss <strong>{s.safeBunks}</strong> more {s.safeBunks === 1 ? "class" : "classes"}.
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={15} className="text-red-500 shrink-0" />
                          <span>
                            Attend next <strong>{s.classesToRecover}</strong> classes to recover to {s.requiredPercentage || defaultRequired}%.
                          </span>
                        </>
                      )}
                    </div>

                    {/* Mobile Quick Actions Row */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleMark(s._id, "present")}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white py-2 px-3 text-xs font-bold shadow-xs transition"
                      >
                        <UserCheck size={14} />
                        <span>+ Present</span>
                      </button>
                      <button
                        onClick={() => handleMark(s._id, "absent")}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white py-2 px-3 text-xs font-bold shadow-xs transition"
                      >
                        <UserX size={14} />
                        <span>+ Absent</span>
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
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition"
                        title="Edit Subject"
                        aria-label="Edit Subject"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(s._id, s.subjectName)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition"
                        title="Delete Subject"
                        aria-label="Delete Subject"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* 1.6 TIMETABLE INTEGRATION */}
      {activeTab === "timetable" && (
        <section className="space-y-6">
          <div className="surface-card rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                  Weekly Timetable & Schedule
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Schedule lectures by day and time. Lecture durations directly inform attendance accounting.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowTimetableModal(true)}
                className="bg-purple-600 text-xs font-semibold text-white w-full sm:w-auto justify-center"
              >
                <Plus size={14} className="mr-1" />
                Add Lecture Slot
              </Button>
            </div>

            {/* Mobile Day Selector Tabs */}
            <div className="md:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2.5 mb-4 scroll-smooth">
              {["All", ...DAYS].map((day) => {
                const count = day === "All" ? timetable.length : timetable.filter((t) => t.dayOfWeek === day).length;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDayFilter(day)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all shadow-xs",
                      selectedDayFilter === day
                        ? "bg-purple-600 text-white"
                        : "border border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <span>{day === "All" ? "All Days" : day.slice(0, 3)}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                        selectedDayFilter === day
                          ? "bg-white/20 text-white"
                          : "bg-[var(--bg-surface)] text-[var(--text-tertiary)]"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {DAYS.filter((d) => selectedDayFilter === "All" || d === selectedDayFilter).map((day) => {
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
                              <div className="min-w-0">
                                <p className="font-semibold text-xs text-[var(--text-primary)] truncate">
                                  {slot.subjectName}
                                </p>
                                <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                                  <Clock size={12} className="text-purple-600 shrink-0" />
                                  <span>
                                    {slot.startTime} – {slot.endTime} ({slot.lectureDurationHours} hr)
                                  </span>
                                </div>
                                {slot.room && (
                                  <p className="mt-1 text-[10px] text-[var(--text-tertiary)] truncate">
                                    Room: {slot.room} {slot.teacherName ? `• ${slot.teacherName}` : ""}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteTimetable(slot._id)}
                                className="text-[var(--text-tertiary)] hover:text-red-500 p-1 rounded shrink-0"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="my-auto w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4 shrink-0">
                <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
                  {editingSubject ? "Edit Subject Attendance" : "Add Attendance Subject"}
                </h3>
                <button
                  onClick={() => setShowSubjectModal(false)}
                  className="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-elevated)]"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveSubject} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSubjectModal(false)}
                    className="text-xs flex-1 sm:flex-initial"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-purple-600 text-xs text-white flex-1 sm:flex-initial">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="my-auto w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4 shrink-0">
                <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
                  Required Attendance Criteria
                </h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-elevated)]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                  <Button
                    variant="outline"
                    onClick={() => setShowSettingsModal(false)}
                    className="text-xs flex-1 sm:flex-initial"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    className="bg-purple-600 text-xs text-white flex-1 sm:flex-initial"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="my-auto w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4 shrink-0">
                <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
                  Add Timetable Slot
                </h3>
                <button
                  onClick={() => setShowTimetableModal(false)}
                  className="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-elevated)]"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveTimetable} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTimetableModal(false)}
                    className="text-xs flex-1 sm:flex-initial"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-purple-600 text-xs text-white flex-1 sm:flex-initial">
                    Add Slot
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sync from CGPA / Academic Profile Modal */}
      <AnimatePresence>
        {showSyncModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="my-auto surface-card w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 border border-[var(--border)] overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">
                      Import Subjects from CGPA
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate">
                      Sync subjects from your academic profile into Attendance
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)] shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3.5 text-xs overflow-y-auto pr-1 flex-1">
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1.5">
                    Target Semester
                  </label>
                  <select
                    value={syncSemesterId}
                    onChange={(e) => setSyncSemesterId(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2.5 text-xs text-[var(--text-primary)] font-medium"
                  >
                    <option value="current">
                      {currentSemester ? `${currentSemester.name} (Active / Current Semester)` : "Active Current Semester"}
                    </option>
                    {semesters
                      .filter((s) => !s.isCurrent)
                      .map((s) => (
                        <option key={s.id || s._id} value={s.id || s._id}>
                          {s.name} (Past Semester)
                        </option>
                      ))}
                  </select>
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                    By default, GradeWise only syncs your active current semester so past semester subjects are excluded.
                  </p>
                </div>

                {/* Preview of subjects to be imported */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-[var(--text-secondary)]">
                      Subjects in Selected Semester
                    </label>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-100 dark:bg-purple-500/20 dark:text-purple-300 px-2 py-0.5 rounded-full">
                      {previewSubjects.length} {previewSubjects.length === 1 ? "Subject" : "Subjects"}
                    </span>
                  </div>
                  {loadingPreview ? (
                    <div className="p-3 text-center text-[var(--text-tertiary)] bg-[var(--bg-surface-elevated)] rounded-xl">
                      Loading subjects preview...
                    </div>
                  ) : previewSubjects.length === 0 ? (
                    <div className="p-3 text-center text-[var(--text-tertiary)] bg-[var(--bg-surface-elevated)] rounded-xl">
                      No subjects found in this semester.
                    </div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2 flex flex-wrap gap-1.5">
                      {previewSubjects.map((ps) => (
                        <span
                          key={ps._id || ps.name}
                          className="inline-flex items-center rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-2 py-1 text-[11px] font-medium text-[var(--text-primary)] shadow-xs"
                        >
                          {ps.name}
                          {ps.code && (
                            <span className="ml-1 text-[10px] text-[var(--text-tertiary)] font-mono">
                              ({ps.code})
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Option to clean up existing subjects */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replaceExistingSync}
                      onChange={(e) => setReplaceExistingSync(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-[var(--border)] text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-[var(--text-primary)] text-xs">
                        Clean up & replace existing attendance subjects
                      </span>
                      <span className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        Removes previously synced subjects (including past semester subjects) and populates attendance with only this semester.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSyncModal(false)}
                  disabled={isSyncing}
                  className="text-xs flex-1 sm:flex-initial"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleExecuteSync}
                  disabled={isSyncing}
                  className="bg-purple-600 text-xs text-white hover:bg-purple-700 flex-1 sm:flex-initial"
                >
                  {isSyncing ? "Syncing..." : "Sync Subjects"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
