"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { fetchApi } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Obtain JWT Tokens
      const tokenRes = await fetchApi<{ access: string }>("/users/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const accessToken = tokenRes.access;

      // 2. Fetch User Profile
      const profile = await fetchApi<{
        id: number;
        email: string;
        first_name: string;
        last_name: string;
        is_staff: boolean;
      }>("/users/me/", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // 3. Save to Zustand Auth Store
      setAuth(profile, accessToken);

      // 4. Redirect to home or account page
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Welcome Back</h1>
        <p className="text-xs text-slate-400">Sign in to your Rastogi cartridges account</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Email Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold text-slate-300">Password</label>
            <Link href="/forgot-password" className="text-xs text-indigo-400 hover:underline">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

      </form>

      {/* Footer link */}
      <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-800">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-bold text-indigo-400 hover:underline">
          Create Account
        </Link>
      </div>

    </div>
  );
}
