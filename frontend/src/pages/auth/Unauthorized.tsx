import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

const ROLE_TO_ROUTE: Record<string, string> = {
  ADMIN: "/admin",
  HR_OFFICER: "/hr",
  HR: "/hr",
  CANDIDATE: "/portal/jobs",
};

export default function Unauthorized() {
  const role = localStorage.getItem("role") || "";
  const backRoute = ROLE_TO_ROUTE[role] || "/auth/login";
  const buttonLabel = backRoute === "/auth/login" ? "Đăng nhập lại" : "Quay về trang của tôi";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-lg w-full rounded-3xl border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/30 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Unauthorized</h1>
        <p className="text-sm leading-6 text-slate-600 mb-6">
          Bạn không có quyền truy cập trang này. Vui lòng quay lại trang phù hợp với quyền của bạn hoặc liên hệ quản trị viên nếu cần.
        </p>
        <Link
          to={backRoute}
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          {buttonLabel}
        </Link>
      </div>
    </div>
  );
}
