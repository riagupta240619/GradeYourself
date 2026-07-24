import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: "var(--bg-base)" }}>
      <Card className="w-full max-w-sm animate-fade-up">
        <CardContent className="pt-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)] font-bold text-white">G</div>
            <h1 className="text-xl font-semibold">Welcome back</h1>
          </div>

          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/app/dashboard");
            }}
          >
            <div>
              <label className="mb-1 block text-sm text-[var(--text-secondary)]">Email</label>
              <input type="email" required className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "var(--border-hairline)" }} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--text-secondary)]">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} required className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "var(--border-hairline)" }} />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-2.5 text-[var(--text-tertiary)]">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                <input type="checkbox" className="accent-[var(--color-accent)]" /> Remember me
              </label>
              <Link to="/forgot-password" className="text-[var(--color-accent)]">Forgot?</Link>
            </div>
            <Button type="submit" className="mt-1">Sign In</Button>
          </form>

          <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
            New here? <Link to="/register" className="text-[var(--color-accent)]">Create account</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
