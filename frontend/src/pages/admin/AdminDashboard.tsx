import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../services/adminService";
import { profileService } from "../../services/profileService";
import type { User } from "../../services/adminService";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import {
  Users,
  Briefcase,
  FileText,
  Database,
  ArrowRight,
  RefreshCcw,
  ShieldCheck,
  Activity,
  Cpu,
  UserPlus,
  Server,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async (opts?: { silent?: boolean }) => {
    if (opts?.silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [statsData, usersData, prof] = await Promise.all([
        adminService.getGlobalStats(),
        adminService.getUsers(),
        profileService.getProfile().catch(() => null)
      ]);
      setStats(statsData);
      setUsers(usersData);
      if (prof) setProfile(prof);
    } catch (e) {
      console.error("Failed to load admin dashboard data", e);
      setError("Unable to load platform overview. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const formatRole = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrator";
      case "HR_OFFICER":
        return "HR Officer";
      case "CANDIDATE":
        return "Candidate";
      default:
        return role;
    }
  };

  const s = stats || {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalJobs: 0,
    openJobs: 0,
    closedJobs: 0,
    totalCandidates: 0,
    newCVsThisWeek: 0,
    aiSuccessCount: 0,
    aiPendingCount: 0,
    aiErrorCount: 0,
    jobsByDepartment: {},
    rolesCount: {}
  };

  // User list sorted by id/created_at to get the latest registered
  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a: any, b: any) => (b.id || 0) - (a.id || 0))
      .slice(0, 5);
  }, [users]);

  // AI Queue Success Rate
  const totalAIProcessed = s.aiSuccessCount + s.aiErrorCount + s.aiPendingCount;
  const aiHealthScore = totalAIProcessed > 0 
    ? Math.round((s.aiSuccessCount / totalAIProcessed) * 100) 
    : 100;

  // Active Users Rate
  const activeUsersRate = s.totalUsers > 0 ? Math.round((s.activeUsers / s.totalUsers) * 100) : 0;
  
  // Open Jobs Rate
  const openJobsRate = s.totalJobs > 0 ? Math.round((s.openJobs / s.totalJobs) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 text-white shadow-lg">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-300 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 backdrop-blur-md px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-indigo-300">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              System Admin
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome, {profile?.name || "Administrator"} ⚙️
            </h1>
            <p className="text-slate-300 max-w-xl text-sm md:text-base font-medium">
              Platform administration dashboard. Monitor users, active job campaigns, and AI queue processing health.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void fetchData({ silent: true })}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-slate-700/85 disabled:opacity-60 transition"
            >
              <RefreshCcw className={refreshing ? "h-4 w-4 animate-spin text-indigo-400" : "h-4 w-4 text-indigo-400"} />
              Refresh
            </button>
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700"
            >
              Manage Users
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3.5 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Users */}
        <Card className="group relative overflow-hidden border-slate-200 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <CardHeader className="relative flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Total Users</p>
              <CardTitle className="text-2xl font-black text-slate-900 mt-1">
                {loading ? "..." : s.totalUsers}
              </CardTitle>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative pt-2">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${activeUsersRate}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              {s.activeUsers} active accounts ({activeUsersRate}%)
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Jobs */}
        <Card className="group relative overflow-hidden border-slate-200 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <CardHeader className="relative flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Job Campaigns</p>
              <CardTitle className="text-2xl font-black text-slate-900 mt-1">
                {loading ? "..." : s.totalJobs}
              </CardTitle>
            </div>
            <div className="p-3 rounded-2xl bg-violet-50 text-violet-600">
              <Briefcase className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative pt-2">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-violet-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${openJobsRate}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              {s.openJobs} currently open for applications ({openJobsRate}%)
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Candidates */}
        <Card className="group relative overflow-hidden border-slate-200 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <CardHeader className="relative flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Uploaded Resumes</p>
              <CardTitle className="text-2xl font-black text-slate-900 mt-1">
                {loading ? "..." : s.totalCandidates}
              </CardTitle>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
              <FileText className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative pt-2">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-0.5 w-fit">
              <UserPlus className="h-3.5 w-3.5" /> +{s.newCVsThisWeek} new (7 days)
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Total candidate profiles created
            </p>
          </CardContent>
        </Card>

        {/* Card 4: AI Queue Status */}
        <Card className="group relative overflow-hidden border-slate-200 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <CardHeader className="relative flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">AI Health Score</p>
              <CardTitle className="text-2xl font-black text-slate-900 mt-1">
                {loading ? "..." : `${aiHealthScore}%`}
              </CardTitle>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
              <Cpu className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative pt-2">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${aiHealthScore}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium flex justify-between">
              <span>Processed: {s.aiSuccessCount} CVs</span>
              {s.aiErrorCount > 0 && <span className="text-rose-600 font-bold">Errors: {s.aiErrorCount}</span>}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Queue Health Panel */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Server className="h-5 w-5 text-indigo-600" /> AI Processing Queue Health
          </CardTitle>
          <p className="text-sm text-slate-500">Monitoring processing statuses and failures in the background AI pipeline.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {/* Stacked multi-color progress bar */}
            <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500" 
                style={{ width: `${totalAIProcessed > 0 ? (s.aiSuccessCount / totalAIProcessed) * 100 : 0}%` }}
                title={`Success: ${s.aiSuccessCount}`}
              />
              <div 
                className="bg-amber-400 h-full transition-all duration-500" 
                style={{ width: `${totalAIProcessed > 0 ? (s.aiPendingCount / totalAIProcessed) * 100 : 0}%` }}
                title={`Pending: ${s.aiPendingCount}`}
              />
              <div 
                className="bg-rose-500 h-full transition-all duration-500" 
                style={{ width: `${totalAIProcessed > 0 ? (s.aiErrorCount / totalAIProcessed) * 100 : 0}%` }}
                title={`Errors: ${s.aiErrorCount}`}
              />
            </div>

            {/* Status details */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="flex justify-center mb-1 text-emerald-600"><CheckCircle2 className="h-4.5 w-4.5" /></div>
                <p className="text-[10px] font-extrabold uppercase text-slate-500">Success</p>
                <p className="mt-1 text-lg font-black text-slate-900">{s.aiSuccessCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="flex justify-center mb-1 text-amber-500"><Activity className="h-4.5 w-4.5" /></div>
                <p className="text-[10px] font-extrabold uppercase text-slate-500">Pending</p>
                <p className="mt-1 text-lg font-black text-slate-900">{s.aiPendingCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="flex justify-center mb-1 text-rose-600"><AlertTriangle className="h-4.5 w-4.5" /></div>
                <p className="text-[10px] font-extrabold uppercase text-slate-500">Failed</p>
                <p className="mt-1 text-lg font-black text-slate-900">{s.aiErrorCount}</p>
              </div>
            </div>
          </div>

          {s.aiErrorCount > 0 && (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-xs text-rose-700 font-semibold flex items-start gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">AI Processing Errors Detected</p>
                <p className="text-rose-600/90 font-medium mt-1">There are {s.aiErrorCount} resumes that could not be processed. Please check if the uploaded documents are corrupted or unsupported.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Registered Users */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" /> New User Registrations
            </CardTitle>
            <p className="text-sm text-slate-500">Latest accounts registered on the platform.</p>
          </div>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
          >
            Manage Accounts <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recentUsers.length > 0 ? (
                  recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-900">{user.name || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold border ${
                          user.role === "ADMIN" 
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : user.role === "HR_OFFICER"
                            ? "bg-violet-50 text-violet-700 border-violet-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {formatRole(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                          user.isActive 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-amber-500"}`} />
                          {user.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to="/admin/users"
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                        >
                          Edit <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm font-semibold text-slate-400 bg-slate-50/30">
                      No user registrations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
