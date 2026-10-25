import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout, { authInput, authLabel, authLink } from "@/components/AuthLayout";
import JournalButton from "@/components/journal/JournalButton";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Always show success regardless
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      title="Lost the thread?"
      subtitle="We'll post you a reset link."
      footer={
        <Link to="/login" className={authLink}>
          <ArrowLeft className="inline h-3 w-3" aria-hidden="true" /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <p className="font-grotesk text-sm leading-relaxed text-journal-ink">
          If an account exists with that email, a reset link is on its way. Check your post.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className={authLabel}>Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-journal-ink-soft" aria-hidden="true" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authInput}
                required
              />
            </div>
          </div>
          <JournalButton type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Posting…
              </>
            ) : (
              "Send reset link"
            )}
          </JournalButton>
        </form>
      )}
    </AuthLayout>
  );
}
