import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Shield, Briefcase } from "lucide-react";
import UserMenuDropdown from "../components/UserMenuDropdown";

export default function AdminLayout() {
  const location = useLocation();

  const navigation = [
    { name: "Global Stats", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Jobs", href: "/admin/jobs", icon: Briefcase }
  ];

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      <aside className="w-64 bg-slate-900 text-slate-300 flex h-screen flex-col border-r border-slate-800 flex-shrink-0 overflow-y-auto">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
            <Shield className="w-5 h-5 text-fuchsia-500 mr-2" />
            <Link to="/" className="text-lg font-bold text-white tracking-tight hover:opacity-85 transition-opacity">
              System <span className="text-fuchsia-400">Admin</span>
            </Link>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== "/admin" && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? "bg-fuchsia-500 text-white shadow-sm"
                    : "hover:bg-slate-800 hover:text-slate-50"
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

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-lg font-semibold text-slate-800">
            {navigation.find(n => location.pathname === n.href || (n.href !== "/admin" && location.pathname.startsWith(n.href)))?.name || "Dashboard"}
          </h2>
          <UserMenuDropdown profilePath="/admin/profile" />
        </header>
        <div className="flex-1 overflow-auto p-8 bg-slate-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
