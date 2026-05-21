import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../services/adminService";
import type { User } from "../../services/adminService";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Users, Briefcase, FileText, Database, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, usersData] = await Promise.all([
          adminService.getGlobalStats(),
          adminService.getUsers(),
        ]);
        setStats(statsData);
        setUsers(usersData);
      } catch (error) {
        console.error("Failed to load admin dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const roleDistribution = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        const role = user.role || "CANDIDATE";
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [users]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading system statistics...</div>;

  const s = stats || { totalUsers: 0, totalJobs: 0, totalCandidates: 0, newCVsThisWeek: 0 };

  const cards = [
    { title: "Total Users", value: s.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-100" },
    { title: "Total Jobs", value: s.totalJobs, icon: Briefcase, color: "text-fuchsia-500", bg: "bg-fuchsia-100" },
    { title: "Total Candidates", value: s.totalCandidates, icon: FileText, color: "text-amber-500", bg: "bg-amber-100" },
    { title: "New CVs This Week", value: s.newCVsThisWeek, icon: Database, color: "text-emerald-500", bg: "bg-emerald-100" },
  ];

  const recentUsers = users.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => (
          <Card key={idx} className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{card.title}</CardTitle>
              <div className={`p-2 rounded-full ${card.bg}`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Role Distribution</CardTitle>
              <p className="text-sm text-slate-500">Track the number of users by role and manage access effectively.</p>
            </div>
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Manage Users
              <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(roleDistribution).map(([role, count]) => (
                <div
                  key={role}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{role.replace("HR_OFFICER", "HR")}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
            <p className="text-sm text-slate-500">Quick links for common administration tasks.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Review users</p>
              <p className="text-sm text-slate-500">Enable, disable, or update users directly from the User Management section.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Monitor new CVs</p>
              <p className="text-sm text-slate-500">See the latest resume uploads and validate system activity.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Maintain jobs</p>
              <p className="text-sm text-slate-500">Use the Jobs page to manage open positions and close filled roles.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <p className="text-sm text-slate-500">Latest accounts created or modified in the system.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <div className="grid grid-cols-[1fr_1fr_1fr_0.8fr] gap-4 bg-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
            </div>
            {recentUsers.length > 0 ? (
              recentUsers.map((user) => (
                <div key={user.id} className="grid grid-cols-[1fr_1fr_1fr_0.8fr] gap-4 border-t border-slate-200 px-4 py-4 text-sm text-slate-700">
                  <span>{user.name || "Unknown"}</span>
                  <span>{user.email}</span>
                  <span>{user.role.replace("HR_OFFICER", "HR")}</span>
                  <span className={user.isActive ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-slate-500">No user records found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
