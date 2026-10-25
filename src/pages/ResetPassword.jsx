import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Lock, Loader2 } from "lucide-react";
import AuthLayout, { AuthError, authInput, authLabel, authLink } from "@/components/AuthLayout";
import JournalButton from "@/components/journal/JournalButton";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthLayout
        title="A torn page."
        subtitle="This reset link is missing or incomplete."
        footer={
          <Link to="/forgot-password" className={authLink}>
            Request a new link
          </Link>
        }
      >
        <p className="font-grotesk text-sm leading-relaxed text-journal-ink">
          The link you used appears to be incomplete. Please request a new password reset email.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="New password."
      subtitle="Choose a fresh passphrase."
    >
      {error && <AuthError>{error}</AuthError>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="password" className={authLabel}>New password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-journal-ink-soft" aria-hidden="true" />
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={authInput}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="confirm" className={authLabel}>Again, to be sure</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-journal-ink-soft" aria-hidden="true" />
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={authInput}
              required
            />
          </div>
        </div>
        <JournalButton type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Resetting…
            </>
          ) : (
            "Reset password"
          )}
        </JournalButton>
      </form>
    </AuthLayout>
  );
}
