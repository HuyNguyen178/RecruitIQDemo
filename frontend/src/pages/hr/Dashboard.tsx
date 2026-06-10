import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { hrService } from "../../services/hrService";
import { profileService } from "../../services/profileService";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import {
  FileText,
  Activity,
  Star,
  ArrowRight,
  RefreshCcw,
  Sparkle,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  FileCheck
} from "lucide-react";

export default function HRDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchOverview = async (opts?: { silent?: boolean }) => {
    if (opts?.silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [data, prof] = await Promise.all([
        hrService.getOverview(),
        profileService.getProfile().catch(() => null)
      ]);
      setStats(data);
      if (prof) setProfile(prof);
    } catch (e) {
      console.error("Failed to load dashboard stats", e);
      setError("Unable to load recruitment statistics. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchOverview();
  }, []);

  const s = stats || {
    totalResumes: 0,
    pendingProcessing: 0,
    aiSuccessCount: 0,
    aiErrorCount: 0,
    totalJobs: 0,
    activeJobsCount: 0,
    closedJobsCount: 0,
    candidatesByStatus: {},
    candidatesByJob: [],
    recentCandidates: [],
    topTalents: [],
  };

  // Calculations for dashboard
  const shortlisted = s.candidatesByStatus?.SHORTLISTED || 0;
  const pendingReview = s.candidatesByStatus?.PENDING || 0;
  
  // Format Date Time
  const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return "";
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateTimeStr;
    }
  };

  // AI status badges helper
  const getAiStatusBadge = (status: string, errMsg?: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> AI Processed
          </span>
        );
      case "ERROR":
        return (
          <span 
            className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200 cursor-help"
            title={errMsg || "File processing failed"}
          >
            <AlertCircle className="h-3 w-3 text-rose-600" /> AI Error
          </span>
        );
      case "PENDING":
      case "PARSING":
      case "SCORING":
      case "SUMMARIZING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200 animate-pulse">
            <Clock className="h-3 w-3 text-amber-600 animate-spin" /> Processing...
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-6 md:p-8 text-white shadow-lg">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white">
              <Sparkle className="h-3.5 w-3.5 text-amber-300 fill-amber-300 animate-pulse" />
              Recruitment Center
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome back, {profile?.name || "HR Officer"} 👋
            </h1>
            <p className="text-indigo-100 max-w-xl text-sm md:text-base font-medium">
              You have <strong className="text-white underline decoration-amber-400 decoration-2">{s.pendingProcessing} resumes</strong> in the AI processing queue and <strong className="text-white underline decoration-amber-400 decoration-2">{pendingReview} candidates</strong> waiting for your manual decision.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void fetchOverview({ silent: true })}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-white/25 disabled:opacity-60"
            >
              <RefreshCcw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </button>
            <Link
              to="/hr/jobs"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-indigo-600 shadow-md transition hover:bg-indigo-50"
            >
              Manage Jobs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3.5 text-sm font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          {error}
        </div>
      )}

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Jobs Stats */}
        <Card className="group relative overflow-hidden border-slate-200/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <CardHeader className="relative flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Active Jobs</p>
              <CardTitle className="text-2xl font-black text-slate-900 mt-1">
                {loading ? "..." : `${s.activeJobsCount} / ${s.totalJobs}`}
              </CardTitle>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
              <Briefcase className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative pt-2">
            <p className="text-xs text-slate-500 font-medium">
              Open campaigns currently accepting applications
            </p>
          </CardContent>
        </Card>

        {/* Card 2: CV Pool */}
        <Card className="group relative overflow-hidden border-slate-200/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <CardHeader className="relative flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Total Resumes</p>
              <CardTitle className="text-2xl font-black text-slate-900 mt-1">
                {loading ? "..." : s.totalResumes}
              </CardTitle>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative pt-2">
            <p className="text-xs text-slate-500 font-medium">
              Total candidates uploaded in the database
            </p>
          </CardContent>
        </Card>

        {/* Card 3: AI Queue */}
        <Card className="group relative overflow-hidden border-slate-200/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <CardHeader className="relative flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">AI Queue</p>
              <CardTitle className="text-2xl font-black text-slate-900 mt-1">
                {loading ? "..." : s.pendingProcessing}
              </CardTitle>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative pt-2">
            <p className="text-xs text-slate-500 font-medium">
              Candidates currently being processed by AI
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Shortlisted */}
        <Card className="group relative overflow-hidden border-slate-200/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <CardHeader className="relative flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Shortlisted</p>
              <CardTitle className="text-2xl font-black text-slate-900 mt-1">
                {loading ? "..." : shortlisted}
              </CardTitle>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative pt-2">
            <p className="text-xs text-slate-500 font-medium">
              Candidates marked as shortlisted for hiring
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real-time AI Queue Monitor & Recent Candidates */}
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" /> Recent Applicants & AI Status
            </CardTitle>
            <p className="text-sm text-slate-500">
              Real-time processing status of the latest resumes received.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700 border border-blue-200">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" /> Real-time
          </span>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Candidate</th>
                  <th className="px-6 py-3.5">Applied Position</th>
                  <th className="px-6 py-3.5">Applied Date</th>
                  <th className="px-6 py-3.5">AI Status</th>
                  <th className="px-6 py-3.5 text-center">Match Score</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {s.recentCandidates?.length > 0 ? (
                  s.recentCandidates.map((candidate: any) => (
                    <tr key={candidate.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-extrabold text-slate-900">
                            {candidate.fullName || "Processing..."}
                          </div>
                          <div className="text-xs text-slate-400 font-medium">
                            {candidate.email || candidate.originalFilename}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {candidate.jobTitle || "—"}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-500 whitespace-nowrap">
                        {formatDateTime(candidate.uploadedAt)}
                      </td>
                      <td className="px-6 py-4">
                        {getAiStatusBadge(candidate.processingStatus, candidate.errorMessage)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {candidate.processingStatus === "COMPLETED" && candidate.totalScore != null ? (
                          <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2 py-1 text-sm font-black text-indigo-700 border border-indigo-100">
                            {candidate.totalScore.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/hr/jobs/${candidate.jobId}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                        >
                          Review <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm font-semibold text-slate-400 bg-slate-50/30">
                      No candidate profiles found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top AI Recommendations Highlight */}
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" /> Top AI Talent Picks
            </CardTitle>
            <p className="text-sm text-slate-500">
              Highest scoring candidates recommendations matched by AI.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {s.topTalents?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {s.topTalents.map((talent: any) => (
                <div 
                  key={talent.id} 
                  className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition truncate max-w-[180px]">
                          {talent.fullName || "Anonymous"}
                        </h4>
                        <p className="text-xs text-slate-500 font-semibold truncate max-w-[180px]">
                          Role: {talent.jobTitle}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="inline-flex items-center rounded-lg bg-amber-50 px-2 py-1 text-sm font-black text-amber-700 border border-amber-100">
                          {talent.totalScore?.toFixed(1) || "0.0"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold mt-0.5">MATCH SCORE</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-amber-400 to-indigo-600 h-full rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(0, talent.totalScore || 0))}%` }}
                      />
                    </div>

                    {talent.recommendation && (
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600 font-medium">
                        <div className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                          <FileCheck className="h-3.5 w-3.5 text-indigo-600" />
                          AI Fit: <span className="text-indigo-700 font-extrabold uppercase">{talent.recommendation}</span>
                        </div>
                        <p className="line-clamp-2 italic">
                          {talent.summaryText || "No review summary available."}
                        </p>
                      </div>
                    )}

                    {talent.skills && talent.skills.length > 0 && (() => {
                      const skillsArray: string[] = Array.isArray(talent.skills)
                        ? talent.skills
                        : String(talent.skills).split(",").map((s: string) => s.trim()).filter(Boolean);
                      return skillsArray.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {skillsArray.slice(0, 3).map((skill: string, i: number) => (
                            <span key={i} className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                              {skill}
                            </span>
                          ))}
                          {skillsArray.length > 3 && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-200">
                              +{skillsArray.length - 3}
                            </span>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold border ${
                      talent.decisionStatus === "SHORTLISTED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : talent.decisionStatus === "REJECTED"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : talent.decisionStatus === "ON_HOLD"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}>
                      {talent.decisionStatus || "PENDING"}
                    </span>

                    <Link
                      to={`/hr/jobs/${talent.jobId}`}
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-indigo-600 hover:underline"
                    >
                      Review Candidate <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm font-semibold text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No top recommended candidates available yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
