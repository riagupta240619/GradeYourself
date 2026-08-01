import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle2, AlertCircle, Lock, Save, Settings, User, Bell, Palette, Moon, Sun, Monitor, LogOut, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { LogoutModal } from "@/components/shared/logout-modal";
import { DeleteAccountModal } from "@/components/shared/delete-account-modal";

const tabs = [
  { name: "Account", icon: User },
  { name: "Grade Scale", icon: Settings },
  { name: "Notifications", icon: Bell },
  { name: "Appearance", icon: Palette },
] as const;

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string>("Account");
  const { theme, toggleTheme } = useTheme();
  const { user, logout, updateProfile, changePassword, deleteAccount } = useAuth();
  const navigate = useNavigate();

  // Profile Form State
  const [name, setName] = useState(user?.name || "");
  const [college, setCollege] = useState(user?.college || "");
  const [course, setCourse] = useState(user?.course || "");
  const [branch, setBranch] = useState(user?.branch || "");
  const [currentSemester, setCurrentSemester] = useState(user?.currentSemester || user?.semesterSystem || "Semester 1");
  const [academicSession, setAcademicSession] = useState(user?.academicSession || "");
  const [cgpaInput, setCgpaInput] = useState(typeof user?.currentCgpa === "number" ? String(user.currentCgpa) : "");
  const [academicStatus, setAcademicStatus] = useState(user?.academicStatus || "Active Student");
  
  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Status & Feedback State
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Logout Modal State
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Delete Account Modal State
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setCollege(user.college || "");
      setCourse(user.course || "");
      setBranch(user.branch || "");
      setCurrentSemester(user.currentSemester || user.semesterSystem || "Semester 1");
      setAcademicSession(user.academicSession || "");
      setCgpaInput(typeof user.currentCgpa === "number" ? String(user.currentCgpa) : "");
      setAcademicStatus(user.academicStatus || "Active Student");
    }
  }, [user]);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteAccount();
      setShowDeleteAccountModal(false);
      toast.success("Your account and all associated data have been permanently deleted.");
      navigate("/", { replace: true });
    } catch (err: any) {
      if (err.response?.status === 401) {
        setShowDeleteAccountModal(false);
        toast.error("Your session has expired. Please sign in again to delete your account.");
        navigate("/login", { replace: true });
      }
      throw err;
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (!name.trim()) {
      setProfileMsg({ type: "error", text: "Name is required." });
      return;
    }

    const parsedCgpa = cgpaInput.trim() ? parseFloat(cgpaInput) : null;

    setIsUpdatingProfile(true);
    try {
      await updateProfile({
        name: name.trim(),
        college: college.trim(),
        course: course.trim(),
        branch: branch.trim(),
        currentSemester: currentSemester.trim(),
        semesterSystem: currentSemester.trim(),
        academicSession: academicSession.trim(),
        currentCgpa: parsedCgpa && !isNaN(parsedCgpa) ? parsedCgpa : null,
        academicStatus: academicStatus.trim(),
      });
      setProfileMsg({ type: "success", text: "Profile details updated successfully!" });
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile details",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword) {
      setPasswordMsg({ type: "error", text: "Current password is required." });
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordMsg({ type: "success", text: "Password changed successfully!" });
      toast.success("Password changed!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to change password. Verify current password.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="flex max-w-3xl flex-col gap-8 pb-10">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-300 mb-2">
          <Settings size={12} className="text-purple-400" /> Account Configuration
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">System Settings</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">Manage profile details, security preferences, and UI themes.</p>
      </div>

      {/* Tabs Bar */}
      <div className="flex rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 p-1.5 gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.name}
            onClick={() => setActiveTab(t.name)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === t.name
                ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            }`}
          >
            <t.icon size={15} />
            {t.name}
          </button>
        ))}
      </div>

      <Card className="p-2 sm:p-4">
        <CardContent className="pt-4">
          {activeTab === "Account" && (
            <div className="flex flex-col gap-8">
              {/* Profile Details Form */}
              <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  Profile Information
                </h3>

                {profileMsg && (
                  <div
                    className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-semibold border ${
                      profileMsg.type === "success"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}
                  >
                    {profileMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {profileMsg.text}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300">Full Name</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300">Email Address (Read Only)</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-zinc-950/40 px-4 py-2.5 text-sm text-zinc-500 cursor-not-allowed outline-none"
                    value={user?.email || ""}
                    disabled
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300">University / College</label>
                    <input
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                      value={college}
                      placeholder="e.g. Stanford University"
                      onChange={(e) => setCollege(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300">Course / Degree</label>
                    <input
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                      value={course}
                      placeholder="e.g. B.Tech / B.E."
                      onChange={(e) => setCourse(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300">Branch / Major</label>
                    <input
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                      value={branch}
                      placeholder="e.g. Computer Science"
                      onChange={(e) => setBranch(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300">Current Semester</label>
                    <input
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                      value={currentSemester}
                      placeholder="e.g. Semester 4"
                      onChange={(e) => setCurrentSemester(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300">Academic Session / Batch</label>
                    <input
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                      value={academicSession}
                      placeholder="e.g. 2025 - 2026"
                      onChange={(e) => setAcademicSession(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-purple-600 dark:text-purple-300">Current CGPA (Baseline)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-950/60 px-4 py-2.5 text-sm font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                      value={cgpaInput}
                      placeholder="e.g. 8.45"
                      onChange={(e) => setCgpaInput(e.target.value)}
                    />
                  </div>
                </div>

                <Button variant="primary" size="md" type="submit" disabled={isUpdatingProfile} className="w-fit gap-1.5 mt-2">
                  <Save size={15} /> {isUpdatingProfile ? "Saving..." : "Save Profile Changes"}
                </Button>
              </form>

              <div className="h-px bg-white/10" />

              {/* Password Change Form */}
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Lock size={15} /> Security & Password
                </h3>

                {passwordMsg && (
                  <div
                    className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-semibold border ${
                      passwordMsg.type === "success"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}
                  >
                    {passwordMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {passwordMsg.text}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300">Current Password *</label>
                  <input
                    type="password"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300">New Password *</label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300">Confirm New Password *</label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                    />
                  </div>
                </div>

                <Button variant="outline" size="md" type="submit" disabled={isChangingPassword} className="w-fit mt-1">
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </Button>
              </form>

              <div className="h-px bg-white/10" />

              {/* Session Actions */}
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setShowLogoutModal(true)} className="gap-1.5">
                  <LogOut size={15} /> Log Out Session
                </Button>
              </div>

              {/* Danger Zone */}
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 mt-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle size={18} className="text-rose-400" />
                  <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Danger Zone</h3>
                </div>
                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  Permanently delete your GradeWise AI account and all associated academic records. This action cannot be undone.
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteAccountModal(true)}
                  className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-slate-900 dark:text-white font-semibold shadow-lg shadow-rose-600/20"
                >
                  <Trash2 size={15} /> Delete Account
                </Button>
              </div>
            </div>
          )}

          {activeTab === "Grade Scale" && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-zinc-400">Selecting a scale automatically recalculates historical transcripts and predictions.</p>
              <select className="w-fit rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none">
                <option>10.0 CGPA System</option>
                <option>4.0 GPA System</option>
                <option>Percentage (100%)</option>
                <option>Letter Grades (A-F)</option>
              </select>
            </div>
          )}

          {activeTab === "Notifications" && (
            <div className="flex flex-col gap-4 text-xs font-medium">
              {[
                "At-risk subject alert notifications",
                "Target grade prediction updates",
                "Community scheme template approvals",
              ].map((n) => (
                <label key={n} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-950/60 p-4">
                  <span className="text-slate-700 dark:text-zinc-300">{n}</span>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-purple-600 cursor-pointer" />
                </label>
              ))}
            </div>
          )}

          {activeTab === "Appearance" && (
            <div className="flex flex-col gap-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Interface Theme Preference</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Select your preferred visual mode for GradeWise AI OS across all sessions.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* 1. Dark Theme Preview Card */}
                <motion.button
                  whileHover={{ y: -2 }}
                  onClick={() => theme !== "dark" && toggleTheme()}
                  className={`relative flex flex-col gap-3 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                    theme === "dark"
                      ? "border-purple-600 ring-2 ring-purple-600/20 bg-white dark:bg-zinc-900 shadow-md"
                      : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-950/60 hover:border-slate-300 dark:hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                      <Moon size={16} className="text-purple-600 dark:text-purple-400" />
                      <span>Dark Mode</span>
                    </div>
                    {theme === "dark" && (
                      <CheckCircle2 size={18} className="text-purple-600 dark:text-purple-400" />
                    )}
                  </div>

                  {/* Mini Dark UI Representation */}
                  <div className="h-24 w-full rounded-xl bg-[#09090b] border border-white/10 p-2 flex gap-1.5 overflow-hidden shadow-inner">
                    <div className="w-1/4 h-full rounded-lg bg-zinc-900 border border-white/10 p-1 flex flex-col gap-1">
                      <div className="h-2 w-3/4 rounded bg-purple-500/60" />
                      <div className="h-1.5 w-full rounded bg-zinc-800" />
                      <div className="h-1.5 w-5/6 rounded bg-zinc-800" />
                    </div>
                    <div className="flex-1 h-full flex flex-col gap-1.5">
                      <div className="h-3 w-full rounded bg-zinc-900 border border-white/10" />
                      <div className="grid grid-cols-2 gap-1 flex-1">
                        <div className="rounded bg-zinc-900 border border-white/10" />
                        <div className="rounded bg-zinc-900 border border-white/10" />
                      </div>
                    </div>
                  </div>
                </motion.button>

                {/* 2. Light Theme Preview Card */}
                <motion.button
                  whileHover={{ y: -2 }}
                  onClick={() => theme === "dark" && toggleTheme()}
                  className={`relative flex flex-col gap-3 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                    theme !== "dark"
                      ? "border-purple-600 ring-2 ring-purple-600/20 bg-white dark:bg-zinc-900 shadow-md"
                      : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-950/60 hover:border-slate-300 dark:hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                      <Sun size={16} className="text-amber-500" />
                      <span>Light Mode</span>
                    </div>
                    {theme !== "dark" && (
                      <CheckCircle2 size={18} className="text-purple-600 dark:text-purple-400" />
                    )}
                  </div>

                  {/* Mini Light UI Representation */}
                  <div className="h-24 w-full rounded-xl bg-slate-100 border border-slate-200 p-2 flex gap-1.5 overflow-hidden shadow-inner">
                    <div className="w-1/4 h-full rounded-lg bg-white border border-slate-200 p-1 flex flex-col gap-1">
                      <div className="h-2 w-3/4 rounded bg-purple-600" />
                      <div className="h-1.5 w-full rounded bg-slate-200" />
                      <div className="h-1.5 w-5/6 rounded bg-slate-200" />
                    </div>
                    <div className="flex-1 h-full flex flex-col gap-1.5">
                      <div className="h-3 w-full rounded bg-white border border-slate-200" />
                      <div className="grid grid-cols-2 gap-1 flex-1">
                        <div className="rounded bg-white border border-slate-200" />
                        <div className="rounded bg-white border border-slate-200" />
                      </div>
                    </div>
                  </div>
                </motion.button>

                {/* 3. System Default Preview Card */}
                <motion.button
                  whileHover={{ y: -2 }}
                  className="relative flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-950/60 p-4 text-left opacity-75 cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
                      <Monitor size={16} />
                      <span>System Sync</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Auto</span>
                  </div>

                  {/* Mini Split UI Representation */}
                  <div className="h-24 w-full rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden flex shadow-inner">
                    <div className="w-1/2 h-full bg-slate-100 p-1.5 flex flex-col gap-1">
                      <div className="h-2 w-full rounded bg-purple-600" />
                      <div className="h-2 w-full rounded bg-white border border-slate-200" />
                    </div>
                    <div className="w-1/2 h-full bg-[#09090b] p-1.5 flex flex-col gap-1">
                      <div className="h-2 w-full rounded bg-purple-500" />
                      <div className="h-2 w-full rounded bg-zinc-900 border border-white/10" />
                    </div>
                  </div>
                </motion.button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logout Confirmation Dialog */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
      />

      {/* Delete Account Confirmation Dialog */}
      <DeleteAccountModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onConfirmDelete={handleConfirmDeleteAccount}
        isLoading={isDeletingAccount}
      />
    </div>
  );
}
