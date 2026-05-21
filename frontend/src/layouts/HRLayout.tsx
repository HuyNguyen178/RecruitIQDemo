import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Briefcase } from "lucide-react";

export default function HRLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: "Dashboard", href: "/hr", icon: LayoutDashboard },
    { name: "Jobs", href: "/hr/jobs", icon: Briefcase },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/auth/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex min-h-screen flex-col justify-between">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <h1 className="text-xl font-bold text-white tracking-tight">RecruitIQ <span className="text-fuchsia-400">HR</span></h1>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== "/hr" && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? "bg-fuchsia-500/10 text-fuchsia-400"
                    : "hover:bg-slate-900 hover:text-slate-50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-lg font-semibold text-slate-800">
            {navigation.find(n => location.pathname === n.href || (n.href !== "/hr" && location.pathname.startsWith(n.href)))?.name || "Dashboard"}
          </h2>
          <div className="flex items-center gap-3">
            <Link
              to="/hr/profile"
              className="rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              Logout
            </button>
            <div className="w-8 h-8 rounded-full bg-fuchsia-100 flex items-center justify-center text-fuchsia-600 font-bold border border-fuchsia-200">
              HR
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8 bg-slate-50/50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
