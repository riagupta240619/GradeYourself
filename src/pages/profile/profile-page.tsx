import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/utils/error-utils";
import {
  GraduationCap,
  Award,
  BookOpen,
  Sparkles,
  Edit3,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  BookMarked,
  Layers,
  Calendar,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

const PRESET_SEMESTERS = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8",
];

const STATUS_OPTIONS = [
  "Completed Past Semesters",
  "First Semester Student",
  "Active Student",
];

export function ProfilePage() {
  const { user, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State initialized from global Auth context
  const [name, setName] = useState(user?.name || "");
  const [college, setCollege] = useState(user?.college || "");
  const [course, setCourse] = useState(user?.course || "");
  const [branch, setBranch] = useState(user?.branch || "");
  const [currentSemester, setCurrentSemester] = useState(
    user?.currentSemester || user?.semesterSystem || "Semester 1",
  );
  const [academicSession, setAcademicSession] = useState(
    user?.academicSession || "",
  );
  const [cgpaInput, setCgpaInput] = useState(
    typeof user?.currentCgpa === "number" ? String(user.currentCgpa) : "",
  );
  const [academicStatus, setAcademicStatus] = useState(
    user?.academicStatus || "Active Student",
  );
  const [totalDegreeCredits, setTotalDegreeCredits] = useState<number>(
    user?.totalDegreeCredits || 160,
  );

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setCollege(user.college || "");
      setCourse(user.course || "");
      setBranch(user.branch || "");
      setCurrentSemester(
        user.currentSemester || user.semesterSystem || "Semester 1",
      );
      setAcademicSession(user.academicSession || "");
      setCgpaInput(
        typeof user.currentCgpa === "number" ? String(user.currentCgpa) : "",
      );
      setAcademicStatus(user.academicStatus || "Active Student");
      setTotalDegreeCredits(user.totalDegreeCredits || 160);
    }
  }, [user]);

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Name is required.");
      return;
    }

    const parsedCgpa = cgpaInput.trim() ? parseFloat(cgpaInput) : null;
    if (
      cgpaInput.trim() &&
      (isNaN(parsedCgpa!) || parsedCgpa! < 0 || parsedCgpa! > 10)
    ) {
      setErrorMsg("CGPA must be a number between 0.00 and 10.00");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        college: college.trim(),
        course: course.trim(),
        branch: branch.trim(),
        currentSemester: currentSemester.trim(),
        semesterSystem: currentSemester.trim(),
        academicSession: academicSession.trim(),
        currentCgpa: parsedCgpa,
        academicStatus: academicStatus.trim(),
        totalDegreeCredits: Number(totalDegreeCredits) || 160,
      });

      toast.success("Academic profile updated successfully!");
      setIsEditing(false);
    } catch (err: unknown) {
      setErrorMsg(
        getErrorMessage(err, "Failed to update profile details"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrorMsg(null);
    if (user) {
      setName(user.name || "");
      setCollege(user.college || "");
      setCourse(user.course || "");
      setBranch(user.branch || "");
      setCurrentSemester(
        user.currentSemester || user.semesterSystem || "Semester 1",
      );
      setAcademicSession(user.academicSession || "");
      setCgpaInput(
        typeof user.currentCgpa === "number" ? String(user.currentCgpa) : "",
      );
      setAcademicStatus(user.academicStatus || "Active Student");
    }
  };

  return (
    <div className="flex max-w-4xl flex-col gap-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-600 dark:text-purple-300 mb-2">
            <GraduationCap size={12} className="text-purple-400" /> Permanent
            Academic Profile
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-900 dark:text-white">
            Student Academic Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Manage and update your university details, degree program, and
            academic baseline.
          </p>
        </div>

        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-1.5 border-purple-500/30 text-purple-600 dark:text-purple-300 hover:bg-purple-500/10"
          >
            <Edit3 size={15} /> Edit Profile
          </Button>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-semibold text-rose-400">
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      {/* User Header Profile Banner */}
      <Card className="glow-purple border-purple-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-purple-950/30 shadow-xl">
        <CardContent className="pt-6 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500 via-purple-600 to-violet-700 text-3xl font-bold text-slate-900 dark:text-white shadow-xl">
            {initial}
            <span className="absolute -bottom-1 -right-1 h-4.5 w-4.5 rounded-full bg-emerald-500 ring-4 ring-zinc-950" />
          </div>

          <div className="flex flex-col gap-1 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {user?.name || "Student User"}
              </h2>
              <span className="text-xs text-zinc-400 font-mono">
                {user?.email}
              </span>
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-300 font-medium">
              {user?.college || "University Institution"}
            </p>

            <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2 text-xs">
              <Badge tone="accent">{user?.course || "Course / Degree"}</Badge>
              <Badge tone="blue">{user?.branch || "Department"}</Badge>
              <Badge tone="accent">
                Semester:{" "}
                {user?.currentSemester || user?.semesterSystem || "N/A"}
              </Badge>
              <Badge tone="success">
                {user?.academicStatus || "Active Student"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EDIT MODE FORM vs DISPLAY MODE */}
      {isEditing ? (
        <Card className="border border-purple-500/30 bg-white/90 dark:bg-zinc-900/90 shadow-2xl p-6">
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 size={18} className="text-purple-400" /> Edit Academic
                Profile Details
              </h3>
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                Updates sync to Database & Global State
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                  placeholder="Enter full name"
                />
              </div>

              {/* Email (Read only) */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Email Address (Read Only)
                </label>
                <input
                  type="text"
                  value={user?.email || ""}
                  disabled
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-zinc-950/40 px-4 py-2.5 text-sm text-zinc-500 cursor-not-allowed outline-none"
                />
              </div>

              {/* College */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  College / University *
                </label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                  placeholder="e.g. Stanford University"
                />
              </div>

              {/* Course */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Course / Degree *
                </label>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                  placeholder="e.g. B.Tech / B.E."
                />
              </div>

              {/* Branch / Department */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Branch / Department *
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                  placeholder="e.g. Computer Science & Engineering"
                />
              </div>

              {/* Current Semester */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Current Semester *
                </label>
                <select
                  value={currentSemester}
                  onChange={(e) => setCurrentSemester(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all cursor-pointer"
                >
                  {PRESET_SEMESTERS.map((s) => (
                    <option
                      key={s}
                      value={s}
                      className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white"
                    >
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Academic Session / Batch */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Academic Session / Batch *
                </label>
                <input
                  type="text"
                  value={academicSession}
                  onChange={(e) => setAcademicSession(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                  placeholder="e.g. 2025 - 2026"
                />
              </div>

              {/* Academic Status */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Academic Status *
                </label>
                <select
                  value={academicStatus}
                  onChange={(e) => setAcademicStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all cursor-pointer"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option
                      key={st}
                      value={st}
                      className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white"
                    >
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Current CGPA (Optional) */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-purple-600 dark:text-purple-300">
                  Current Cumulative CGPA (Optional Baseline)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={cgpaInput}
                  onChange={(e) => setCgpaInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-950 px-4 py-2.5 text-sm font-mono font-bold text-slate-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                  placeholder="e.g. 8.45"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                <X size={14} className="mr-1" /> Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSaving}
                className="gap-1.5"
              >
                <Save size={15} />{" "}
                {isSaving ? "Saving..." : "Save Profile Changes"}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        /* DISPLAY ALL ONBOARDING INFORMATION */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-200 dark:border-white/10">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 size={16} className="text-purple-400" /> Institution
                & Degree Program
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-4 text-xs">
              <div>
                <span className="text-zinc-400 uppercase text-[10px] font-bold tracking-wider block mb-1">
                  College / University
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {user?.college || "Not set"}
                </span>
              </div>

              <div>
                <span className="text-zinc-400 uppercase text-[10px] font-bold tracking-wider block mb-1">
                  Course / Degree
                </span>
                <span className="text-sm font-semibold text-zinc-200">
                  {user?.course || "Not set"}
                </span>
              </div>

              <div>
                <span className="text-zinc-400 uppercase text-[10px] font-bold tracking-wider block mb-1">
                  Branch / Department
                </span>
                <span className="text-sm font-semibold text-zinc-200">
                  {user?.branch || "Not set"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-slate-200 dark:border-white/10">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers size={16} className="text-blue-400" /> Academic Term &
                Baseline Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-zinc-400 uppercase text-[10px] font-bold tracking-wider block mb-1">
                    Current Semester
                  </span>
                  <span className="text-sm font-bold text-purple-400">
                    {user?.currentSemester ||
                      user?.semesterSystem ||
                      "Semester 1"}
                  </span>
                </div>

                <div>
                  <span className="text-zinc-400 uppercase text-[10px] font-bold tracking-wider block mb-1">
                    Batch / Session
                  </span>
                  <span className="text-sm font-bold text-blue-400">
                    {user?.academicSession || "Not set"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-zinc-400 uppercase text-[10px] font-bold tracking-wider block mb-1">
                  Academic Status
                </span>
                <span className="text-sm font-semibold text-emerald-400">
                  {user?.academicStatus || "Active Student"}
                </span>
              </div>

              <div>
                <span className="text-zinc-400 uppercase text-[10px] font-bold tracking-wider block mb-1">
                  Baseline Onboarding CGPA
                </span>
                {typeof user?.currentCgpa === "number" ? (
                  <span className="text-lg font-extrabold font-mono text-purple-600 dark:text-purple-300">
                    {user.currentCgpa.toFixed(2)} / 10.00
                  </span>
                ) : (
                  <span className="text-xs text-zinc-500 italic">
                    No baseline CGPA provided during onboarding
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
