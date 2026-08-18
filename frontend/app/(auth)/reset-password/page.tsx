"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft, CheckCircle, AlertCircle, Loader2, KeyRound } from "lucide-react";
import { fetchApi } from "@/lib/api-client";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!uid || !token) {
      setError("Invalid password reset link. Missing UID or Token.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please enter matching passwords.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetchApi<{ message: string }>("/users/password-reset/confirm/", {
        method: "POST",
        body: JSON.stringify({
          uid,
          token,
          new_password: newPassword,
        }),
      });

      setMessage(res.message || "Your password has been reset successfully! Redirecting to Sign In...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || "Failed to reset password. Link may be expired or invalid.";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Set New Password</h1>
        <p className="text-xs text-slate-400">
          Enter your new account password to complete password reset
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* New Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password</label>
          <div className="relative">
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm New Password</label>
          <div className="relative">
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !!message}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span>Reset Password</span>
          )}
        </button>

      </form>

      <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-800">
        <Link href="/login" className="inline-flex items-center gap-1 font-bold text-indigo-400 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>

    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
