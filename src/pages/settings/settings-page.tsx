import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle2, AlertCircle, Lock, Save, Settings, User, Bell, Palette, Moon, Sun, Monitor, LogOut } from "lucide-react";
import { toast } from "sonner";
import { LogoutModal } from "@/components/shared/logout-modal";

const tabs = [
  { name: "Account", icon: User },
  { name: "Grade Scale", icon: Settings },
  { name: "Notifications", icon: Bell },
  { name: "Appearance", icon: Palette },
] as const;

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string>("Account");
  const { theme, toggleTheme } = useTheme();
  const { user, logout, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();

  // Profile Form State
  const [name, setName] = useState(user?.name || "");
  const [college, setCollege] = useState(user?.college || "");
  const [branch, setBranch] = useState(user?.branch || "");
  
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

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setCollege(user.college || "");
      setBranch(user.branch || "");
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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (!name.trim()) {
      setProfileMsg({ type: "error", text: "Name is required." });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await updateProfile({
        name: name.trim(),
        college: college.trim(),
        branch: branch.trim(),
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
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-300 mb-2">
          <Settings size={12} className="text-purple-400" /> Account Configuration
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">System Settings</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">Manage profile details, security preferences, and UI themes.</p>
      </div>

      {/* Tabs Bar */}
      <div className="flex rounded-2xl border border-white/10 bg-zinc-900/90 p-1.5 gap-1 overflow-x-auto">
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
                  <label className="mb-1.5 block text-xs font-medium text-zinc-300">Full Name</label>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-300">Email Address (Read Only)</label>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-2.5 text-sm text-zinc-500 cursor-not-allowed outline-none"
                    value={user?.email || ""}
                    disabled
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">University / College</label>
                    <input
                      className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                      value={college}
                      placeholder="e.g. Stanford University"
                      onChange={(e) => setCollege(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">Branch / Major</label>
                    <input
                      className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                      value={branch}
                      placeholder="e.g. Computer Science"
                      onChange={(e) => setBranch(e.target.value)}
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
                  <label className="mb-1.5 block text-xs font-medium text-zinc-300">Current Password *</label>
                  <input
                    type="password"
                    className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">New Password *</label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">Confirm New Password *</label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
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
                <Button variant="danger" size="sm">
                  Delete Account
                </Button>
              </div>
            </div>
          )}

          {activeTab === "Grade Scale" && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-zinc-400">Selecting a scale automatically recalculates historical transcripts and predictions.</p>
              <select className="w-fit rounded-xl border border-white/10 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none">
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
                <label key={n} className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950/60 p-4">
                  <span className="text-zinc-300">{n}</span>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-purple-600 cursor-pointer" />
                </label>
              ))}
            </div>
          )}

          {activeTab === "Appearance" && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-zinc-400">Choose your preferred visual theme for GradeWise AI OS.</p>

              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => theme !== "dark" && toggleTheme()}
                  className={`flex flex-col items-center gap-3 rounded-2xl border p-5 text-center transition-all ${
                    theme === "dark"
                      ? "border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                      : "border-white/10 bg-zinc-950/60 text-zinc-400 hover:border-white/20"
                  }`}
                >
                  <Moon size={24} />
                  <span className="text-xs font-bold">Dark Mode</span>
                </button>

                <button
                  onClick={() => theme === "dark" && toggleTheme()}
                  className={`flex flex-col items-center gap-3 rounded-2xl border p-5 text-center transition-all ${
                    theme !== "dark"
                      ? "border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                      : "border-white/10 bg-zinc-950/60 text-zinc-400 hover:border-white/20"
                  }`}
                >
                  <Sun size={24} />
                  <span className="text-xs font-bold">Light Mode</span>
                </button>

                <button
                  className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/60 p-5 text-center text-zinc-400 hover:border-white/20 transition-all opacity-60"
                >
                  <Monitor size={24} />
                  <span className="text-xs font-bold">System Default</span>
                </button>
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
    </div>
  );
}
