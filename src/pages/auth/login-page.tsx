import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      const authUser = await login({ email, password });
      if (authUser.profileCompleted) {
        navigate("/app/dashboard");
      } else {
        navigate("/onboarding");
      }
    } catch {
      // Error handled in AuthContext
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: "var(--bg-base)" }}>
      <Card className="w-full max-w-sm animate-fade-up">
        <CardContent className="pt-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)] font-bold text-white">G</div>
            <h1 className="text-xl font-semibold">Welcome back</h1>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-500 text-center">
              {error}
            </div>
          )}

          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm text-[var(--text-secondary)]">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                style={{ borderColor: "var(--border-hairline)" }}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--text-secondary)]">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                  style={{ borderColor: "var(--border-hairline)" }}
                />
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
            <Button type="submit" disabled={loading} className="mt-1">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
            New here? <Link to="/register" className="text-[var(--color-accent)]">Create account</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
