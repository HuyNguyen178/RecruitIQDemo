import { Outlet, Link } from "react-router-dom";
import { Brain, CheckCircle2, ChevronRight } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row overflow-hidden font-sans">
      
      {/* Left side: Premium Branding & AI Showcase (Large Screens Only) */}
      <div className="hidden lg:flex lg:w-[55%] bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Abstract glowing backgrounds */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-20 translate-x-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none translate-y-20 -translate-x-20"></div>
        
        {/* Custom background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

        {/* Top brand logo */}
        <Link to="/" className="flex items-center gap-2 relative z-10 select-none hover:opacity-85 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00b14f] to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Recruit<span className="text-[#00b14f]">IQ</span>
          </span>
        </Link>

        {/* Middle hero contents */}
        <div className="my-auto space-y-8 relative z-10 max-w-lg">
          <h2 className="text-4xl font-extrabold tracking-tight leading-[1.15] text-white">
            Modern Recruitment & <span className="bg-gradient-to-r from-[#00b14f] to-emerald-400 bg-clip-text text-transparent">Hiring Platform</span>
          </h2>
          
          <p className="text-slate-400 text-sm leading-relaxed font-semibold">
            A streamlined platform for managing job postings, reviewing candidates, and making faster, smarter hiring decisions.
          </p>

          {/* Highlights checklist */}
          <div className="space-y-3.5 pt-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-[#00b14f]" />
              </div>
              <span className="text-xs font-bold text-slate-200">Post jobs and manage applications in one place</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-[#00b14f]" />
              </div>
              <span className="text-xs font-bold text-slate-200">Fast and modern candidate search experience</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-[#00b14f]" />
              </div>
              <span className="text-xs font-bold text-slate-200">Streamlined collaboration between HR and hiring managers</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-500 relative z-10 flex items-center justify-between font-semibold">
          <span>&copy; 2026 RecruitIQ. All rights reserved.</span>
          <span className="flex items-center gap-0.5 hover:text-white transition-colors cursor-pointer">
            Privacy Policy <ChevronRight className="w-3 h-3" />
          </span>
        </div>

      </div>

      {/* Right side: Active authentication form panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 bg-white relative">
        {/* Soft decorative blur circles on mobile background */}
        <div className="lg:hidden absolute top-10 right-10 w-72 h-72 bg-emerald-100/50 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="lg:hidden absolute bottom-10 left-10 w-72 h-72 bg-indigo-100/50 rounded-full blur-[80px] pointer-events-none"></div>
        
        {/* Brand logo for mobile screens */}
        <Link to="/" className="lg:hidden flex items-center gap-2 mb-8 select-none hover:opacity-85 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00b14f] to-emerald-400 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            Recruit<span className="text-[#00b14f]">IQ</span>
          </span>
        </Link>

        {/* Form Container */}
        <div className="w-full max-w-sm relative z-10">
          <Outlet />
        </div>
      </div>

    </div>
  );
}
