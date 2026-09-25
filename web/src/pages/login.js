import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { loginUser } from "../lib/api";
import { useTheme } from "./_app";
import {
  ShieldCheck,
  Lock,
  User,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already authenticated
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
      const userRole = (user.role || "").toUpperCase();

      // Intelligent Role-based Redirection based on user details
      if (userRole.includes("SUPER") || userRole.includes("ADMIN") || userRole.includes("STATE")) {
        router.replace("/");
      } else if (userRole.includes("LGA")) {
        router.replace("/collation");
      } else if (userRole.includes("WARD")) {
        router.replace("/polling-units");
      } else if (userRole.includes("ANALYST") || userRole.includes("OFFICER")) {
        router.replace("/election-results");
      } else if (userRole.includes("AGENT")) {
        router.replace("/results");
      } else {
        router.replace("/");
      }
    } catch (err) {
      setError(err.message || "Invalid credentials or unauthorized role. Please check username and password.");
    } finally {
      setLoading(false);
    }
  };

  const cardClass = isDark ? "bg-[#141E38] border-slate-800" : "bg-white border-slate-200 shadow-xl";

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-200 ${
      isDark ? "bg-[#070D1E] text-slate-100" : "bg-slate-100 text-slate-800"
    }`}>
      <div className={`w-full max-w-md rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-6 ${cardClass}`}>
        {/* Brand Header */}
        <div className="text-center space-y-2">
          {/* Official PDP Shield Logo Container */}
          <div className="relative inline-block mx-auto">
            <div className="w-20 h-20 rounded-2xl bg-slate-900/60 p-2.5 flex items-center justify-center border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10 mx-auto">
              <img
                src="/pdp_logo.png"
                alt="Peoples Democratic Party Logo"
                className="w-14 h-14 object-contain drop-shadow"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#141E38]"></span>
            </span>
          </div>

          <div className="pt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              JIGAWA PDP POLLWATCH 2027
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-2 text-white">
              Situation Room Secure Portal
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Field Command, Geo-Spatial Intelligence & Results Verification Access
            </p>
          </div>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Username */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
              Operator Username / Phone
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or state_coord"
                className={`w-full pl-10 pr-4 py-3 rounded-xl text-xs font-medium outline-none border transition ${
                  isDark
                    ? "bg-slate-900 border-slate-700 text-white focus:border-emerald-500"
                    : "bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500"
                }`}
              />
            </div>
          </div>

          {/* Password with Eye Toggle */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
              Security Access Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter secret password"
                className={`w-full pl-10 pr-10 py-3 rounded-xl text-xs font-medium outline-none border transition ${
                  isDark
                    ? "bg-slate-900 border-slate-700 text-white focus:border-emerald-500"
                    : "bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-pdp hover:bg-pdp-dark text-white font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xl shadow-pdp/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <span>Authorize & Enter Situation Room</span>
            )}
          </button>
        </form>

        {/* Security Footer Badges */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[10px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Official Jigawa PDP Command Network • AES-256 GCM Encrypted</span>
        </div>
      </div>
    </div>
  );
}
