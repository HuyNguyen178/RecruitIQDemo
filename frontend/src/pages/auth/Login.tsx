import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/authService";
import { Button } from "../../components/ui/Button";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authService.login({ email, password });
      if (res.accessToken) {
        localStorage.setItem("token", res.accessToken);
      }

      const userRole = res.roles?.includes("ROLE_ADMIN")
        ? "ADMIN"
        : res.roles?.includes("ROLE_HR_OFFICER") || res.roles?.includes("ROLE_HR")
        ? "HR_OFFICER"
        : "CANDIDATE";

      localStorage.setItem("role", userRole);
      
      // Role redirection
      if (userRole === "HR_OFFICER") {
        navigate("/hr");
      } else if (userRole === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/portal/jobs");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed. Please check your account or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Form Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
          Login
        </h1>
        <p className="text-sm font-semibold text-slate-500 leading-normal">
          Connecting opportunities, shaping the future with RecruitIQ
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl text-xs font-bold text-red-600 bg-red-50 border border-red-100 shadow-sm animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Form fields */}
      <form onSubmit={handleLogin} className="space-y-4">
        
        {/* Email field */}
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

        {/* Password field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block" htmlFor="password">
              Password
            </label>
          </div>
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

        {/* Submit button */}
        <Button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#00b14f] hover:bg-[#009440] text-white font-extrabold text-sm h-12 rounded-xl shadow-md shadow-emerald-600/10 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </form>

      {/* Switch auth page */}
      <div className="text-center text-xs font-bold text-slate-500 pt-2 border-t border-slate-100">
        Don't have an account?{" "}
        <Link to="/auth/register" className="text-[#00b14f] hover:text-[#009440] transition-colors underline decoration-dotted hover:decoration-solid">
          Register now
        </Link>
      </div>

    </div>
  );
}
