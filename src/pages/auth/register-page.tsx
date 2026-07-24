import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function RegisterPage() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  const strength = Math.min(4, Math.floor(pw.length / 3));

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: "var(--bg-base)" }}>
      <Card className="w-full max-w-sm animate-fade-up">
        <CardContent className="pt-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)] font-bold text-white">G</div>
            <h1 className="text-xl font-semibold">Create your account</h1>
          </div>

          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/onboarding");
            }}
          >
            <div>
              <label className="mb-1 block text-sm text-[var(--text-secondary)]">Name</label>
              <input required className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "var(--border-hairline)" }} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--text-secondary)]">Email</label>
              <input type="email" required className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "var(--border-hairline)" }} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--text-secondary)]">Password</label>
              <input
                type="password"
                required
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                style={{ borderColor: "var(--border-hairline)" }}
              />
              <div className="mt-1.5 flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full"
                    style={{ backgroundColor: i < strength ? "var(--color-success)" : "var(--bg-elevated)" }}
                  />
                ))}
              </div>
            </div>
            <label className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
              <input type="checkbox" required className="mt-0.5 accent-[var(--color-accent)]" />
              I agree to the Terms and Privacy Policy
            </label>
            <Button type="submit" className="mt-1">Create Account</Button>
          </form>

          <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
            Already have an account? <Link to="/login" className="text-[var(--color-accent)]">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
