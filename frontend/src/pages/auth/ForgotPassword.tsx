import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { authService } from "../../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to request password reset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Check your email
          </h1>
          <p className="text-sm font-semibold text-slate-500 leading-normal">
            If an account exists for <span className="text-[#00b14f]">{email}</span>, we sent a password reset link.
          </p>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>Open the link in your email to set a new password. The link expires in 30 minutes.</span>
        </div>

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

  return (
    <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
          Forgot password
        </h1>
        <p className="text-sm font-semibold text-slate-500 leading-normal">
          Enter your email and we’ll send you a password reset link.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl text-xs font-bold text-red-600 bg-red-50 border border-red-100 shadow-sm animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block" htmlFor="email">
            Email Address
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4.5 h-4.5" />
            </div>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-[#00b14f] text-slate-900 rounded-xl py-3 pl-10 pr-4 text-sm font-bold placeholder:text-slate-400 outline-none transition-all"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#00b14f] hover:bg-[#009440] text-white font-extrabold text-sm h-12 rounded-xl shadow-md shadow-emerald-600/10 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Sending...
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>

      <div className="text-center text-xs font-bold text-slate-500 pt-2 border-t border-slate-100">
        Remember your password?{" "}
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

