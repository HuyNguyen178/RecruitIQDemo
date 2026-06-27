import { Outlet, Link, useLocation } from "react-router-dom";
import UserMenuDropdown from "../components/UserMenuDropdown";

export default function PortalLayout() {
  const location = useLocation();
  const token = localStorage.getItem("token");

  const navigation = [
    { name: "Jobs", href: "/portal/jobs" },
    { name: "My Applications", href: "/portal/my-applications" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-slate-900 tracking-tight hover:opacity-85 transition-opacity">
              RecruitIQ
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                if (!token && item.name === 'My Applications') return null;
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {token ? (
              <UserMenuDropdown profilePath="/portal/profile" />
            ) : (
              <Link to="/auth/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="py-6 text-center border-t border-slate-200 bg-white text-slate-500 text-sm">
        <p>&copy; 2026 RecruitIQ. All rights reserved.</p>
      </footer>
    </div>
  );
}
