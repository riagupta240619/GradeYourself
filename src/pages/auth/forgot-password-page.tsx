import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MailCheck } from "lucide-react";

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: "var(--bg-base)" }}>
      <Card className="w-full max-w-sm animate-fade-up">
        <CardContent className="pt-8 text-center">
          {!sent ? (
            <>
              <h1 className="mb-1 text-xl font-semibold">Reset your password</h1>
              <p className="mb-5 text-sm text-[var(--text-secondary)]">Enter your email and we'll send a reset link.</p>
              <form
                className="flex flex-col gap-3 text-left"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
              >
                <input type="email" required placeholder="you@university.edu" className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "var(--border-hairline)" }} />
                <Button type="submit">Send reset link</Button>
              </form>
            </>
          ) : (
            <>
              <MailCheck size={28} className="mx-auto mb-3 text-[var(--color-success)]" />
              <h1 className="mb-1 text-xl font-semibold">Check your inbox</h1>
              <p className="text-sm text-[var(--text-secondary)]">We've sent a reset link if that email is registered.</p>
            </>
          )}
          <p className="mt-5 text-sm text-[var(--text-secondary)]">
            <Link to="/login" className="text-[var(--color-accent)]">Back to sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
