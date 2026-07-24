import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/app/providers/theme-provider";

const tabs = ["Account", "Grade Scale", "Notifications", "Appearance"] as const;

export function SettingsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Account");
  const { theme, toggleTheme } = useTheme();

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
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm text-[var(--text-secondary)]">Name</label>
                <input className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "var(--border-hairline)" }} defaultValue="Ria" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--text-secondary)]">Email</label>
                <input className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "var(--border-hairline)" }} defaultValue="ria@example.edu" />
              </div>
              <Button variant="danger" className="w-fit">Delete Account</Button>
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
