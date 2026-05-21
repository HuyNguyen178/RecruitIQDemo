import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { hrService } from "../../services/hrService";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { FileText, Activity, Star, Sparkles, ArrowRight } from "lucide-react";

export default function HRDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const data = await hrService.getOverview();
        setStats(data);
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;
  }

  const s = stats || {
    totalResumes: 0,
    pendingProcessing: 0,
    topTalents: [],
  };

  const cards = [
    { title: "Total Resumes", value: s.totalResumes, icon: FileText, color: "text-blue-500", bg: "bg-blue-100" },
    { title: "Pending Processing", value: s.pendingProcessing, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-100" },
    { title: "Top Talent", value: s.topTalents?.length || 0, icon: Star, color: "text-fuchsia-500", bg: "bg-fuchsia-100" },
    { title: "HR Pipeline", value: "Ready", icon: Sparkles, color: "text-amber-500", bg: "bg-amber-100" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => (
          <Card key={idx}>
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Top Talent Picks</CardTitle>
              <p className="text-sm text-slate-500">Review the highest-scoring candidates for immediate shortlist.</p>
            </div>
            <Link
              to="/hr/jobs"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              View Jobs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 bg-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Candidate</span>
                <span>Score</span>
                <span>Recommendation</span>
                <span>Status</span>
              </div>
              {s.topTalents?.length > 0 ? (
                s.topTalents.map((talent: any) => (
                  <div key={talent.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 border-t border-slate-200 px-4 py-4 text-sm text-slate-700">
                    <div className="space-y-1">
                      <div className="font-semibold">{talent.fullName || "Unknown"}</div>
                      <div className="text-xs text-slate-500">{talent.email || talent.jobTitle || "No email"}</div>
                    </div>
                    <div className="font-semibold">{talent.totalScore?.toFixed?.(1) ?? "-"}</div>
                    <div className="text-slate-600">{talent.recommendation || "N/A"}</div>
                    <div className="text-slate-600">{talent.decisionStatus || "Pending"}</div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-slate-500">No candidate scores available yet.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>HR Highlights</CardTitle>
            <p className="text-sm text-slate-500">Actions to accelerate hiring.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Fast review</p>
              <p className="text-sm text-slate-500">Focus on candidates waiting for manual processing and shortlist immediately.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Open jobs</p>
              <p className="text-sm text-slate-500">Use the HR Jobs area to add new roles or close filled positions.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Candidate insights</p>
              <p className="text-sm text-slate-500">Check top skills and summaries to make faster hiring decisions.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
