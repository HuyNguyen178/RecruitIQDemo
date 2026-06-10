import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Loader2, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { authService } from "../../services/authService";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Reset token is missing. Please request a new link.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate("/auth/login"), 800);
    } catch (err: any) {
      setError(err.response?.data?.message || "Reset link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Password updated
          </h1>
          <p className="text-sm font-semibold text-slate-500 leading-normal">
            Your password has been reset successfully. Redirecting to login...
          </p>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>You can now log in with your new password.</span>
        </div>

        <div className="text-center text-xs font-bold text-slate-500 pt-2 border-t border-slate-100">
          Go to{" "}
          <Link
            to="/auth/login"
            className="text-[#00b14f] hover:text-[#009440] transition-colors underline decoration-dotted hover:decoration-solid"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
          Reset password
        </h1>
        <p className="text-sm font-semibold text-slate-500 leading-normal">
          Enter a new password for your account.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl text-xs font-bold text-red-600 bg-red-50 border border-red-100 shadow-sm animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {!token && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>
            This link is missing a token. Please{" "}
            <Link
              to="/auth/forgot-password"
              className="text-amber-800 underline decoration-dotted hover:decoration-solid"
            >
              request a new reset link
            </Link>
            .
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block" htmlFor="password">
            New Password
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4.5 h-4.5" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-[#00b14f] text-slate-900 rounded-xl py-3 pl-10 pr-10 text-sm font-bold placeholder:text-slate-400 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block" htmlFor="confirmPassword">
            Confirm New Password
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4.5 h-4.5" />
            </div>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-[#00b14f] text-slate-900 rounded-xl py-3 pl-10 pr-10 text-sm font-bold placeholder:text-slate-400 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#00b14f] hover:bg-[#009440] text-white font-extrabold text-sm h-12 rounded-xl shadow-md shadow-emerald-600/10 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Updating...
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </form>

      <div className="text-center text-xs font-bold text-slate-500 pt-2 border-t border-slate-100">
        Back to{" "}
        <Link
          to="/auth/login"
          className="text-[#00b14f] hover:text-[#009440] transition-colors underline decoration-dotted hover:decoration-solid"
        >
          Login
        </Link>
      </div>
    </div>
  );
}

