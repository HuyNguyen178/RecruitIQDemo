import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { jobService, type Job } from "../../services/jobService";
import { candidateService } from "../../services/candidateService";
import { Button } from "../../components/ui/Button";
import { 
  ArrowLeft, Upload, Download, Trash2, Users, FileText, 
  Calendar, GraduationCap, Award, Eye, Phone, Mail, 
  BookOpen, Heart, X, Briefcase, UserCircle, ChevronUp, ChevronDown
} from "lucide-react";

function formatDateTime(value?: string) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return value;
  }
}

function renderReasoning(reasoningJson?: string, candidate?: any) {
  if (!reasoningJson) {
    return <p className="text-sm text-slate-500 italic">No detailed reasoning available yet.</p>;
  }

  try {
    const parsed = JSON.parse(reasoningJson);
    const scoreEntries = [
      { key: "overall", label: "Overall", value: parsed.overall || parsed.summary || parsed.reasoning || "" },
      { key: "skills", label: "Skills", value: parsed.skills || "" },
      { key: "experience", label: "Experience", value: parsed.experience || "" },
      { key: "education", label: "Education", value: parsed.education || "" },
      { key: "certifications", label: "Certifications", value: parsed.certifications || parsed.certification || "" },
      { key: "soft_skills", label: "Soft Skills", value: parsed.soft_skills || parsed.softSkills || "" },
    ].filter((entry) => entry.value && String(entry.value).trim() !== "");

    if (scoreEntries.length === 0) {
      return <p className="text-sm text-slate-500 italic">No detailed reasoning available yet.</p>;
    }

    return (
      <div className="space-y-3">
        {scoreEntries.map((entry) => {
          const text = String(entry.value);
          const bulletPoints = text
            .split(/(?<=[.!?])\s+/)
            .map((item) => item.trim())
            .filter(Boolean);

          return (
            <div key={entry.key} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold text-slate-900">{entry.label}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {candidate?.[`${entry.key}Score`] != null ? `${candidate[`${entry.key}Score`]}%` : ""}
                </div>
              </div>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                {bulletPoints.length > 0 ? (
                  bulletPoints.map((item, index) => (
                    <li key={`${entry.key}-${index}`} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-fuchsia-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-fuchsia-500 shrink-0" />
                    <span>{text}</span>
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    );
  } catch {
    return <p className="text-sm text-slate-700 whitespace-pre-wrap">{reasoningJson}</p>;
  }
}

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const prefix = isAdmin ? "/admin" : "/hr";

  // Candidate detail states
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const parsedProfile = useMemo(() => {
    if (!selectedCandidate?.profileJson) return null;
    try {
      return JSON.parse(selectedCandidate.profileJson);
    } catch (e) {
      console.error("Failed to parse candidate profileJson", e);
      return null;
    }
  }, [selectedCandidate]);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [fetchingCandidate, setFetchingCandidate] = useState(false);
  const [decisionStatus, setDecisionStatus] = useState<string>("PENDING");
  const [hrNotes, setHrNotes] = useState<string>("");
  const [savingDecision, setSavingDecision] = useState(false);

  const fetchJobDetails = async (showLoader = true) => {
    if (!id) return;
    if (showLoader) setLoading(true);
    try {
      const [jobData, candidatesData] = await Promise.all([
        jobService.getJobById(id),
        jobService.getJobCandidateStatuses(id)
      ]);
      setJob(jobData);
      setCandidates(candidatesData);
    } catch (error) {
      console.error("Failed to load job details", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails(true);
  }, [id]);

  // Derived sorted array for table rendering
  const sortedCandidates = useMemo(() => {
    const items = [...candidates];
    items.sort((a, b) => {
      let aValue: any = a.fullName || a.name || a.filename || "";
      let bValue: any = b.fullName || b.name || b.filename || "";

      switch (sortBy) {
        case "name":
          aValue = a.fullName || a.name || a.filename || "";
          bValue = b.fullName || b.name || b.filename || "";
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        case "recommendation":
          aValue = a.recommendation || "";
          bValue = b.recommendation || "";
          break;
        case "uploadedBy":
          aValue = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
          bValue = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
          break;
        case "score":
          aValue = a.score != null ? a.score : -1;
          bValue = b.score != null ? b.score : -1;
          break;
        default:
          break;
      }

      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return items;
  }, [candidates, sortBy, sortDirection]);

  const renderCandidateSortIndicator = (field: string) => {
    if (sortBy !== field) {
      return <ChevronUp className="w-3 h-3 text-slate-400 opacity-30" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-3 h-3 text-slate-900" />
    ) : (
      <ChevronDown className="w-3 h-3 text-slate-900" />
    );
  };

  // Polling mechanism for live status updates
  useEffect(() => {
    const hasProcessingCandidates = candidates.some(
      c => c.status !== 'COMPLETED' && c.status !== 'ERROR'
    );
    
    if (hasProcessingCandidates) {
      const intervalId = setInterval(() => {
        fetchJobDetails(false); // Fetch silently without full page loader
      }, 3000); // Poll every 3 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [candidates, id]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0 || !id) return;

    setUploading(true);
    try {
      await candidateService.uploadCV(id, selectedFiles);
      await fetchJobDetails(); // Refresh list after upload
    } catch (error) {
      console.error("Failed to upload CVs", error);
      alert("Failed to upload CVs");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadCV = async (candidateId: number) => {
    try {
      const candidate = candidates.find((item) => item.id === candidateId);
      const response = await candidateService.downloadCVResponse(candidateId);
      const blob = response.data;
      const contentDisposition = response.headers['content-disposition'] || '';
      const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8''")?([^;]+)/i);
      const originalName = candidate?.originalFilename || `CV_${candidateId}`;
      const downloadName = filenameMatch?.[1]
        ? decodeURIComponent(filenameMatch[1].replace(/^"|"$/g, ''))
        : originalName;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download CV", error);
      alert("Failed to download CV");
    }
  };

  const isCandidateProcessing = (candidate: any) => {
    const status = candidate?.status || candidate?.processingStatus;
    return status === "PARSING" || status === "SCORING" || status === "SUMMARIZING" || status === "PENDING";
  };

  const handleViewCandidate = async (candidateId: number) => {
    const candidate = candidates.find((item) => item.id === candidateId);
    if (candidate && isCandidateProcessing(candidate)) {
      alert("This candidate is still being processed. Please wait until scoring is finished.");
      return;
    }

    setFetchingCandidate(true);
    try {
      const data = await candidateService.getCandidateById(candidateId);
      setSelectedCandidate(data);
      setDecisionStatus(data.decisionStatus || "PENDING");
      setHrNotes(data.hrNotes || "");
      setShowCandidateModal(true);
    } catch (error) {
      console.error("Failed to load candidate details", error);
      alert("Failed to load candidate details. Candidate CV might still be processing.");
    } finally {
      setFetchingCandidate(false);
    }
  };

  const handleSaveDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    
    setSavingDecision(true);
    try {
      await candidateService.updateDecision(selectedCandidate.id, {
        decisionStatus,
        hrNotes
      });
      setShowCandidateModal(false);
      await fetchJobDetails(); // Refresh parent candidates list
    } catch (error) {
      console.error("Failed to save decision", error);
      alert("Failed to save candidate decision status");
    } finally {
      setSavingDecision(false);
    }
  };

  const handleDeleteCandidate = async (candidateId: number) => {
    const candidate = candidates.find((item) => item.id === candidateId);
    if (candidate && isCandidateProcessing(candidate)) {
      alert("This candidate is still being processed. Please wait until scoring is finished before deleting.");
      return;
    }

    if (!window.confirm("Are you sure you want to remove this candidate? This action cannot be undone.")) return;
    
    try {
      await candidateService.deleteCandidate(candidateId);
      await fetchJobDetails(); // Refresh list
    } catch (error) {
      console.error("Failed to delete candidate", error);
      alert("Failed to delete candidate posting");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading details...</div>;
  if (!job) return <div className="p-8 text-center text-red-500">Job not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`${prefix}/jobs`} className="p-2 text-slate-400 hover:text-slate-900 bg-white rounded-full border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
            {job.logoUrl ? (
              <img src={job.logoUrl} alt={job.department || 'logo'} className="w-full h-full object-contain" />
            ) : (
              <Briefcase className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{job.title}</h1>
            <p className="text-slate-500">{job.department} • {job.location}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Details Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">Job Information</h2>
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Status</span>
              <p className="font-medium mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  job.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                }`}>
                  {job.status || 'OPEN'}
                </span>
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                <UserCircle className="w-4 h-4 text-slate-400" />
                Created by
              </span>
              <p className="font-semibold text-sm text-slate-800 mt-1">{job.createdByName || 'Unknown'}</p>
              {job.createdByEmail && (
                <p className="text-xs text-slate-500 mt-0.5">{job.createdByEmail}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">{formatDateTime(job.createdAt)}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-slate-400" />
                Experience
              </span>
              <p className="font-semibold text-sm text-slate-800 mt-1">{job.minExperienceYears !== undefined ? `${job.minExperienceYears} Year(s)` : 'No requirements'}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                Education
              </span>
              <p className="font-semibold text-sm text-slate-800 mt-1">{job.requiredEducation || 'No requirements'}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                Deadline
              </span>
              <p className="font-semibold text-sm text-slate-800 mt-1">{job.deadline || 'No deadline'}</p>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Job Description</span>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{job.jdText || 'No description provided.'}</p>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Required Skills</span>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{job.requiredSkills || 'No skills provided.'}</p>
            </div>
          </div>
        </div>

        {/* Candidates List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-fuchsia-600" />
                <h2 className="text-lg font-semibold text-slate-900">Candidates ({candidates.length})</h2>
              </div>
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf,.doc,.docx"
                  multiple
                  onChange={handleFileUpload}
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={uploading}
                  className="gap-2 bg-fuchsia-600 hover:bg-fuchsia-700"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Upload CV"}
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                  <tr>
                    <th
                      scope="col"
                      className="cursor-pointer px-6 py-3"
                      onClick={() => {
                        setSortBy("name");
                        setSortDirection(sortBy === "name" && sortDirection === "asc" ? "desc" : "asc");
                      }}
                    >
                      <div className="flex items-center gap-2">
                        Candidate Name / File
                        {renderCandidateSortIndicator("name")}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="cursor-pointer px-6 py-3"
                      onClick={() => {
                        setSortBy("status");
                        setSortDirection(sortBy === "status" && sortDirection === "asc" ? "desc" : "asc");
                      }}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        {renderCandidateSortIndicator("status")}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="cursor-pointer px-6 py-3"
                      onClick={() => {
                        setSortBy("recommendation");
                        setSortDirection(sortBy === "recommendation" && sortDirection === "asc" ? "desc" : "asc");
                      }}
                    >
                      <div className="flex items-center gap-2">
                        Match
                        {renderCandidateSortIndicator("recommendation")}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="cursor-pointer px-6 py-3"
                      onClick={() => {
                        setSortBy("uploadedBy");
                        setSortDirection(sortBy === "uploadedBy" && sortDirection === "asc" ? "desc" : "asc");
                      }}
                    >
                      <div className="flex items-center gap-2">
                        Created By
                        {renderCandidateSortIndicator("uploadedBy")}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="cursor-pointer px-6 py-3"
                      onClick={() => {
                        setSortBy("score");
                        setSortDirection(sortBy === "score" && sortDirection === "asc" ? "desc" : "asc");
                      }}
                    >
                      <div className="flex items-center gap-2">
                        Score
                        {renderCandidateSortIndicator("score")}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                    {sortedCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        No candidates yet. Upload a CV to get started!
                      </td>
                    </tr>
                  ) : (
                    sortedCandidates.map((candidate) => (
                      <tr key={candidate.id} className="bg-white border-b hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            {candidate.name || "Processing Candidate..."}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">{candidate.filename}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            candidate.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 
                            candidate.status === 'ERROR' ? 'bg-red-100 text-red-800' :
                            candidate.status === 'PARSING' ? 'bg-blue-100 text-blue-800' :
                            candidate.status === 'SCORING' ? 'bg-violet-100 text-violet-800' :
                            candidate.status === 'SUMMARIZING' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {candidate.status === 'PENDING' && '⏳ Waiting...'}
                            {candidate.status === 'PARSING' && '📄 Reading CV...'}
                            {candidate.status === 'SCORING' && '🤖 AI Scoring...'}
                            {candidate.status === 'SUMMARIZING' && '✍️ Generating Summary...'}
                            {candidate.status === 'COMPLETED' && '✅ Done'}
                            {candidate.status === 'ERROR' && '❌ Failed'}
                          </span>
                          {candidate.status === 'ERROR' && candidate.errorMessage && (
                            <div
                              className="text-xs text-red-500 mt-1 max-w-[180px] truncate cursor-help"
                              title={candidate.errorMessage}
                            >
                              ⚠️ {candidate.errorMessage}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            candidate.recommendation === 'STRONG_MATCH' ? 'bg-emerald-100 text-emerald-800' :
                            candidate.recommendation === 'POTENTIAL_MATCH' ? 'bg-blue-100 text-blue-800' :
                            candidate.recommendation === 'NOT_RECOMMENDED' ? 'bg-red-100 text-red-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {candidate.recommendation?.replace('_', ' ') || 'PROCESSING'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 space-y-1">
                            <div className="text-sm font-semibold text-slate-900">
                              {candidate.uploadedByName || "HR / Manual upload"}
                            </div>
                            {(candidate.uploadedByEmail || candidate.createdByEmail) && (
                              <div className="text-xs text-slate-500 truncate" title={candidate.uploadedByEmail || candidate.createdByEmail}>
                                {candidate.uploadedByEmail || candidate.createdByEmail}
                              </div>
                            )}
                            {(candidate.uploadedByRole || candidate.createdByRole) && (
                              <div className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                                {(candidate.uploadedByRole || candidate.createdByRole)?.replace('_', ' ')}
                              </div>
                            )}
                            <div className="text-xs text-slate-500 mt-1">Uploaded: {formatDateTime(candidate.uploadedAt)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {candidate.score !== undefined && candidate.score !== null ? `${candidate.score}%` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => handleViewCandidate(candidate.id)}
                              disabled={fetchingCandidate || isCandidateProcessing(candidate)}
                              className="p-1.5 text-slate-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-md transition-colors disabled:opacity-50"
                              title={isCandidateProcessing(candidate) ? "Processing in progress" : "View CV Details"}
                            >
                              <Eye className="w-4.5 h-4.5" />
                            </button>
                            <button 
                              onClick={() => handleDownloadCV(candidate.id)}
                              disabled={isCandidateProcessing(candidate)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                              title={isCandidateProcessing(candidate) ? "Processing in progress" : "Download CV"}
                            >
                              <Download className="w-4.5 h-4.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCandidate(candidate.id)}
                              disabled={isCandidateProcessing(candidate)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                              title={isCandidateProcessing(candidate) ? "Processing in progress" : "Delete Candidate"}
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Candidate CV Detail Modal */}
      {showCandidateModal && selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-slate-900">{selectedCandidate.fullName || selectedCandidate.originalFilename}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    selectedCandidate.recommendation === 'STRONG_MATCH' ? 'bg-emerald-100 text-emerald-800' :
                    selectedCandidate.recommendation === 'POTENTIAL_MATCH' ? 'bg-blue-100 text-blue-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {selectedCandidate.recommendation?.replace('_', ' ') || 'PROCESSING'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  Source: {selectedCandidate.originalFilename}
                </p>
              </div>
              <button 
                onClick={() => setShowCandidateModal(false)}
                className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
              {/* Contact Info & Experience Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Email</span>
                    <p className="text-sm font-semibold text-slate-800">{selectedCandidate.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Phone</span>
                    <p className="text-sm font-semibold text-slate-800">{selectedCandidate.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Award className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Experience</span>
                    <p className="text-sm font-semibold text-slate-800">
                      {selectedCandidate.yearsExperience !== null && selectedCandidate.yearsExperience !== undefined
                        ? `${selectedCandidate.yearsExperience} Year(s)`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills Section */}
              <div className="space-y-2">
                <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  Parsed Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.skills ? (
                    selectedCandidate.skills.split(',').map((skill: string, index: number) => (
                      <span key={index} className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md text-xs font-semibold border border-slate-200">
                        {skill.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500 italic">No skills extracted.</span>
                  )}
                </div>
              </div>

              {/* Work Experience Timeline */}
              {parsedProfile?.work_experience && parsedProfile.work_experience.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    Work Experience
                  </span>
                  <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-4">
                    {parsedProfile.work_experience.map((work: any, idx: number) => (
                      <div key={idx} className="relative">
                        {/* Dot indicator */}
                        <div className="absolute -left-[22px] mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-slate-300 ring-2 ring-slate-100" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{work.title}</h4>
                          <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 font-medium">
                            <span className="text-slate-700 font-semibold">{work.company}</span>
                            <span>•</span>
                            <span>{work.start_date || 'N/A'} - {work.end_date || 'Present'}</span>
                          </div>
                          {work.description && (
                            <p className="mt-1 text-xs text-slate-650 leading-relaxed text-slate-600 whitespace-pre-wrap">{work.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education Timeline */}
              {parsedProfile?.education_history && parsedProfile.education_history.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    Education History
                  </span>
                  <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-4">
                    {parsedProfile.education_history.map((edu: any, idx: number) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[22px] mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-slate-300 ring-2 ring-slate-100" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{edu.degree || 'Degree'} {edu.field ? `in ${edu.field}` : ''}</h4>
                          <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 font-medium">
                            <span className="text-slate-700 font-semibold">{edu.institution || 'Institution'}</span>
                            {edu.year && (
                              <>
                                <span>•</span>
                                <span>Class of {edu.year}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications and Languages Grid */}
              {((parsedProfile?.languages && parsedProfile.languages.length > 0) || 
                (parsedProfile?.certifications && parsedProfile.certifications.length > 0)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parsedProfile?.certifications && parsedProfile.certifications.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-slate-400" />
                        Certifications
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedProfile.certifications.map((cert: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold border border-indigo-100">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {parsedProfile?.languages && parsedProfile.languages.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                        <UserCircle className="w-4 h-4 text-slate-400" />
                        Languages
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedProfile.languages.map((lang: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-xs font-semibold border border-emerald-100">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Scores with Progress Bars */}
              <div className="space-y-3 bg-fuchsia-50/50 p-5 rounded-xl border border-fuchsia-100">
                <span className="text-xs text-fuchsia-700 uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-fuchsia-500" />
                  AI Matching Evaluation
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {/* Total Score */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Total Match Score</span>
                      <span className="text-fuchsia-600 font-bold">{selectedCandidate.totalScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-fuchsia-600 h-2 rounded-full" style={{ width: `${selectedCandidate.totalScore || 0}%` }}></div>
                    </div>
                  </div>

                  {/* Skills Score */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Skills Match</span>
                      <span className="text-blue-600 font-bold">{selectedCandidate.skillsScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${selectedCandidate.skillsScore || 0}%` }}></div>
                    </div>
                  </div>

                  {/* Experience Score */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Experience Match</span>
                      <span className="text-emerald-600 font-bold">{selectedCandidate.experienceScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${selectedCandidate.experienceScore || 0}%` }}></div>
                    </div>
                  </div>

                  {/* Education Score */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Education Match</span>
                      <span className="text-amber-600 font-bold">{selectedCandidate.educationScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${selectedCandidate.educationScore || 0}%` }}></div>
                    </div>
                  </div>

                  {/* Certification Score */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Cert Match</span>
                      <span className="text-indigo-600 font-bold">{selectedCandidate.certScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${selectedCandidate.certScore || 0}%` }}></div>
                    </div>
                  </div>

                  {/* Soft Skills Score */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Soft Skills Match</span>
                      <span className="text-rose-600 font-bold">{selectedCandidate.softSkillsScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${selectedCandidate.softSkillsScore || 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Score Reasoning */}
              <div className="space-y-2">
                <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Why this score?</span>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  {renderReasoning(selectedCandidate.reasoningJson, selectedCandidate)}
                </div>
              </div>

              {/* AI Summary / Feedback */}
              <div className="space-y-2">
                <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">AI CV Summary & Feedback</span>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {selectedCandidate.summaryText || 'No AI feedback generated.'}
                </div>
              </div>

              {/* Decision Making & HR Notes Form */}
              <form onSubmit={handleSaveDecision} className="border-t border-slate-100 pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700" htmlFor="decision-select">
                      Application Decision
                    </label>
                    <select
                      id="decision-select"
                      value={decisionStatus}
                      onChange={(e) => setDecisionStatus(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2"
                    >
                      <option value="PENDING">PENDING (Reviewing)</option>
                      <option value="SHORTLISTED">SHORTLISTED (Pass to Interview)</option>
                      <option value="ON_HOLD">ON HOLD (Reserve Pool)</option>
                      <option value="REJECTED">REJECTED (Not Matched)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="hr-notes-textarea">
                    HR Internal Evaluation Notes
                  </label>
                  <textarea
                    id="hr-notes-textarea"
                    rows={3}
                    placeholder="Write private feedback or comments about this candidate's interview status..."
                    value={hrNotes}
                    onChange={(e) => setHrNotes(e.target.value)}
                    className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2 min-h-[60px]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowCandidateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={savingDecision}
                    className="bg-fuchsia-600 hover:bg-fuchsia-700"
                  >
                    {savingDecision ? "Saving..." : "Save Selection Decision"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
