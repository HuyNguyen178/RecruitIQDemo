import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/authService";
import { Button } from "../../components/ui/Button";
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "CANDIDATE",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP Verification States
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      const result = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      
      if (result === "OTP_REQUIRED") {
        setIsOtpSent(true);
      } else {
        alert("Account registered successfully! Please log in to continue.");
        navigate("/auth/login");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please check your registration information.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    setOtpLoading(true);

    try {
      await authService.verifyOtp(formData.email, otp);
      alert("Verification successful! Your account is now active. Please log in.");
      navigate("/auth/login");
    } catch (err: any) {
      setOtpError(err.response?.data || "Invalid OTP verification code.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError("");
    setResendLoading(true);
    setResendMessage("");

    try {
      await authService.resendOtp(formData.email);
      setResendMessage("Verification code has been resent to your email!");
    } catch (err: any) {
      setOtpError(err.response?.data || "Failed to resend OTP.");
    } finally {
      setResendLoading(false);
    }
  };

  if (isOtpSent) {
    return (
      <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Form Header */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Verify Email
          </h1>
          <p className="text-sm font-semibold text-slate-500 leading-normal">
            We sent a 6-digit verification code to <span className="text-[#00b14f]">{formData.email}</span>. Please enter it below.
          </p>
        </div>

        {/* Error display */}
        {otpError && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl text-xs font-bold text-red-600 bg-red-50 border border-red-100 shadow-sm animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span>{otpError}</span>
          </div>
        )}

        {/* Resend success message */}
        {resendMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 shadow-sm animate-fade-in">
            <span>{resendMessage}</span>
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block" htmlFor="otp">
              Verification Code (OTP)
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <input
                id="otp"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-[#00b14f] text-slate-900 rounded-xl py-3 pl-10 pr-4 text-center tracking-[0.75em] text-lg font-extrabold placeholder:text-slate-400 outline-none transition-all placeholder:tracking-normal"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={otpLoading}
            className="w-full bg-[#00b14f] hover:bg-[#009440] text-white font-extrabold text-sm h-12 rounded-xl shadow-md shadow-emerald-600/10 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {otpLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
              </>
            ) : (
              "Confirm & Register"
            )}
          </Button>
        </form>

        <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100 text-center">
          <div className="text-xs font-bold text-slate-500">
            Didn't receive the code?{" "}
            <button
              onClick={handleResendOtp}
              disabled={resendLoading}
              className="text-[#00b14f] hover:text-[#009440] transition-colors underline decoration-dotted hover:decoration-solid disabled:opacity-50 font-bold"
            >
              {resendLoading ? "Resending..." : "Resend code"}
            </button>
          </div>
          
          <button
            onClick={() => setIsOtpSent(false)}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors underline"
          >
            Go back to Registration
          </button>
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Form Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
          Register Account
        </h1>
        <p className="text-sm font-semibold text-slate-500 leading-normal">
          The best job opportunities are waiting for you
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
      <form onSubmit={handleRegister} className="space-y-4">
        
        {/* Full Name field */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block" htmlFor="name">
            Full Name
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User className="w-4.5 h-4.5" />
            </div>
            <input
              id="name"
              type="text"
              placeholder="Your full name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-[#00b14f] text-slate-900 rounded-xl py-3 pl-10 pr-4 text-sm font-bold placeholder:text-slate-400 outline-none transition-all"
            />
          </div>
        </div>

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
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-[#00b14f] text-slate-900 rounded-xl py-3 pl-10 pr-4 text-sm font-bold placeholder:text-slate-400 outline-none transition-all"
            />
          </div>
        </div>

        {/* Password field */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block" htmlFor="password">
            Password
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4.5 h-4.5" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
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

        {/* Confirm Password field */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4.5 h-4.5" />
            </div>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
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

        {/* Submit button */}
        <Button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#00b14f] hover:bg-[#009440] text-white font-extrabold text-sm h-12 rounded-xl shadow-md shadow-emerald-600/10 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Creating account...
            </>
          ) : (
            "Register Account"
          )}
        </Button>
      </form>

      {/* Switch auth page */}
      <div className="text-center text-xs font-bold text-slate-500 pt-2 border-t border-slate-100">
        Already have an account?{" "}
        <Link to="/auth/login" className="text-[#00b14f] hover:text-[#009440] transition-colors underline decoration-dotted hover:decoration-solid">
          Login now
        </Link>
      </div>

    </div>
  );
}

