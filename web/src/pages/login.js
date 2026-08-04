import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { loginUser } from "../lib/api";
import { useTheme } from "./_app";
import {
  ShieldCheck,
  Lock,
  User,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        router.replace("/");
      }
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const user = await loginUser(username.trim(), password);

      switch (user.role) {
        case "SUPER_ADMIN":
        case "ADMIN":
          router.replace("/");
          break;

        case "LGA_COORDINATOR":
          router.replace("/collation");
          break;

        case "AGENT":
          router.replace("/results");
          break;

        default:
          router.replace("/");
      }
    } catch (err) {
      setError(err.message || "Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-200 ${
        isDark
          ? "bg-[#070D1E] text-slate-100"
          : "bg-slate-100 text-slate-800"
      }`}
    >
      <div
        className={`w-full max-w-md rounded-2xl p-8 border shadow-xl ${
          isDark
            ? "bg-[#141E38] border-slate-800"
            : "bg-white border-slate-200"
        }`}
      >
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 mb-2">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-black tracking-tight">
            Election Command Center
          </h1>

          <p className="text-xs text-slate-400">
            Enter your credentials to access secured field operations
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
              Username
            </label>

            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />

              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none border transition ${
                  isDark
                    ? "bg-slate-900 border-slate-700 text-slate-100 focus:border-emerald-500"
                    : "bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500"
                }`}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
              Password
            </label>

            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />

              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none border transition ${
                  isDark
                    ? "bg-slate-900 border-slate-700 text-slate-100 focus:border-emerald-500"
                    : "bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500"
                }`}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              "Sign In to Dashboard"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
