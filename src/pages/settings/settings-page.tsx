import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle2, AlertCircle, Lock, Save } from "lucide-react";

const tabs = ["Account", "Grade Scale", "Notifications", "Appearance"] as const;

export function SettingsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Account");
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

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setCollege(user.college || "");
      setBranch(user.branch || "");
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
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
      setPasswordMsg({ type: "error", text: "New password must be at least 8 characters long and contain uppercase, lowercase, and a number." });
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
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to change password. Please verify current password.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6 animate-fade-up">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="flex gap-1 border-b" style={{ borderColor: "var(--border-hairline)" }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm ${
              tab === t ? "border-b-2 border-[var(--color-accent)] font-medium text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-5">
          {tab === "Account" && (
            <div className="flex flex-col gap-6">
              {/* Profile Details Form */}
              <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Profile Information
                </h3>

                {profileMsg && (
                  <div
                    className={`flex items-center gap-2 rounded-lg p-3 text-xs border ${
                      profileMsg.type === "success"
                        ? "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30"
                        : "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/30"
                    }`}
                  >
                    {profileMsg.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                    {profileMsg.text}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Name</label>
                  <input
                    className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                    style={{ borderColor: "var(--border-hairline)" }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Email (Read Only)</label>
                  <input
                    className="w-full rounded-lg border bg-[var(--bg-elevated)]/50 px-3 py-2 text-sm text-[var(--text-tertiary)] cursor-not-allowed"
                    style={{ borderColor: "var(--border-hairline)" }}
                    value={user?.email || ""}
                    disabled
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">College / University</label>
                    <input
                      className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                      style={{ borderColor: "var(--border-hairline)" }}
                      value={college}
                      placeholder="e.g. Stanford University"
                      onChange={(e) => setCollege(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Branch / Department</label>
                    <input
                      className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                      style={{ borderColor: "var(--border-hairline)" }}
                      value={branch}
                      placeholder="e.g. Computer Science"
                      onChange={(e) => setBranch(e.target.value)}
                    />
                  </div>
                </div>

                <Button variant="primary" size="sm" type="submit" disabled={isUpdatingProfile} className="w-fit flex items-center gap-1.5 mt-1">
                  <Save size={14} /> {isUpdatingProfile ? "Saving..." : "Save Profile Changes"}
                </Button>
              </form>

              <hr style={{ borderColor: "var(--border-hairline)" }} />

              {/* Password Change Form */}
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1.5">
                  <Lock size={15} className="text-[var(--color-accent)]" /> Security & Password
                </h3>

                {passwordMsg && (
                  <div
                    className={`flex items-center gap-2 rounded-lg p-3 text-xs border ${
                      passwordMsg.type === "success"
                        ? "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30"
                        : "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/30"
                    }`}
                  >
                    {passwordMsg.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                    {passwordMsg.text}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Current Password *</label>
                  <input
                    type="password"
                    className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                    style={{ borderColor: "var(--border-hairline)" }}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">New Password *</label>
                    <input
                      type="password"
                      className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                      style={{ borderColor: "var(--border-hairline)" }}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Confirm New Password *</label>
                    <input
                      type="password"
                      className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                      style={{ borderColor: "var(--border-hairline)" }}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                    />
                  </div>
                </div>

                <Button variant="outline" size="sm" type="submit" disabled={isChangingPassword} className="w-fit mt-1">
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </Button>
              </form>

              <hr style={{ borderColor: "var(--border-hairline)" }} />

              {/* Session Actions */}
              <div className="flex items-center gap-3">
                <Button variant="outline" className="w-fit" onClick={handleLogout}>
                  Log Out
                </Button>
                <Button variant="danger" className="w-fit">
                  Delete Account
                </Button>
              </div>
            </div>
          )}

          {tab === "Grade Scale" && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-[var(--text-secondary)]">Changing your scale recalculates all historical data.</p>
              <select className="w-fit rounded-lg border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "var(--border-hairline)" }}>
                <option>10.0 CGPA</option>
                <option>4.0 GPA</option>
                <option>Percentage</option>
                <option>Letter Grade</option>
              </select>
            </div>
          )}

          {tab === "Notifications" && (
            <div className="flex flex-col gap-3 text-sm">
              {["At-risk alerts", "Prediction updates", "Template approvals"].map((n) => (
                <label key={n} className="flex items-center justify-between">
                  {n}
                  <input type="checkbox" defaultChecked className="accent-[var(--color-accent)]" />
                </label>
              ))}
            </div>
          )}

          {tab === "Appearance" && (
            <div className="flex items-center justify-between text-sm">
              <span>Theme</span>
              <Button variant="outline" size="sm" onClick={toggleTheme}>
                {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
