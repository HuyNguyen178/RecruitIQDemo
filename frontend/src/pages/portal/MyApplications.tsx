import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { portalService } from "../../services/portalService";
import { 
  Briefcase, ArrowRight, Clock, CheckCircle2, 
  XCircle, AlertCircle, Sparkles, 
  ChevronRight, Calendar, FileText,
  BookmarkCheck
} from "lucide-react";

export default function MyApplications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const underReviewCount = useMemo(
    () => applications.filter((app) => !['SHORTLISTED', 'REJECTED', 'ON_HOLD'].includes(app.decisionStatus)).length,
    [applications]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsData, statsData] = await Promise.all([
          portalService.getMyApplications(),
          portalService.getDashboardStats()
        ]);
        setApplications(appsData);
        setStats(statsData);
      } catch (error) {
        console.error("Failed to load applications", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SHORTLISTED': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'REJECTED': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'SHORTLISTED':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-[#00b14f] border border-emerald-100 flex items-center gap-1">🎉 Shortlisted / Interview</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-100">Rejected</span>;
      case 'ON_HOLD':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">On Hold</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-50 text-slate-500 border border-slate-200">Under Review</span>;
    }
  };

  const handleDownload = async (appId: number, filename: string) => {
    try {
      await portalService.downloadCv(appId, filename);
    } catch (error) {
      console.error("Failed to download CV", error);
      alert("Failed to download CV. Please check access rights or try again later.");
    }
  };

  const handleWithdraw = async (appId: number) => {
    if (window.confirm("Are you sure you want to withdraw this application? This action will remove your CV from this job and delete all AI analysis data.")) {
      try {
        await portalService.withdrawApplication(appId);
        setApplications(prev => prev.filter(app => app.id !== appId));
        // Reload stats
        const statsData = await portalService.getDashboardStats();
        setStats(statsData);
      } catch (error) {
        console.error("Failed to withdraw application", error);
        alert("Failed to withdraw application. Please try again later.");
      }
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header and banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-[#00b14f] pl-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">My Application History</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Track your CV status and application history.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Applications</span>
              <span className="text-3xl font-extrabold text-slate-900">{stats.totalApplied || 0}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Shortlisted</span>
              <span className="text-3xl font-extrabold text-[#00b14f]">{stats.shortlistedCount || 0}</span>
            </div>
            <div className="p-3 bg-emerald-50 text-[#00b14f] rounded-xl">
              <BookmarkCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Under Review</span>
              <span className="text-3xl font-extrabold text-slate-900">{underReviewCount}</span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">Application List</h2>
          <span className="text-xs font-bold text-[#00b14f] bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">Strictly Confidential</span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading application history...</div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No application history yet</h3>
              <p className="text-xs text-slate-400 font-semibold text-center mb-6 leading-relaxed">
                You haven't submitted your CV for any job yet. Discover exciting job opportunities today!
              </p>
              <Link to="/portal/jobs" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00b14f] hover:bg-[#009440] text-white rounded-xl text-xs font-bold transition-all shadow-sm">
                Search for Jobs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1 shrink-0">
                    {getStatusIcon(app.decisionStatus)}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-900 text-lg leading-tight">{app.jobTitle}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Applied on: {new Date(app.uploadedAt || Date.now()).toLocaleDateString('vi-VN')}</span>
                      <span>•</span>
                      <button 
                        onClick={() => handleDownload(app.id, app.originalFilename)}
                        className="flex items-center gap-1 hover:text-[#00b14f] text-slate-500 transition-colors font-bold group/btn"
                        title="Download Original CV"
                      >
                        <FileText className="w-3.5 h-3.5 group-hover/btn:text-[#00b14f] text-slate-400" /> CV File: <span className="underline decoration-dotted group-hover/btn:decoration-solid">{app.originalFilename}</span>
                      </button>
                    </div>
                    
                    {app.processingStatus === 'ERROR' && (
                      <div className="flex items-start gap-1.5 mt-2 text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
                        <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
                        <span>{app.errorMessage || "A technical error occurred while analyzing your CV. Please try again."}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side status column */}
                <div className="flex items-center md:items-end justify-between md:justify-center md:flex-col gap-3 shrink-0">
                  <div className="flex flex-col md:items-end gap-1.5">
                    {getDecisionBadge(app.decisionStatus)}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/portal/jobs/${app.jobId}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition-all shadow-sm"
                    >
                      <ChevronRight className="w-3.5 h-3.5" /> View Job
                    </Link>
                    <button
                      onClick={() => handleWithdraw(app.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-all shadow-sm group/del"
                      title="Withdraw this application"
                    >
                      <XCircle className="w-3.5 h-3.5 group-hover/del:scale-110 transition-transform" /> Withdraw
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
