import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { portalService } from "../../services/portalService";
import { type Job } from "../../services/jobService";
import { Button } from "../../components/ui/Button";
import { 
  ArrowLeft, Briefcase, Calendar, GraduationCap, Award, BookOpen, FileText,
  CheckCircle2, ShieldAlert, Upload, MapPin, DollarSign
} from "lucide-react";

export default function JobDetailPortal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      try {
        const data = await portalService.getJobById(id);
        setJob(data);
      } catch (error: any) {
        console.error("Failed to load job detail", error);
        if (error.response?.status === 404) {
          setErrorDetails("This job is not available. It may have been closed or removed.");
        } else if (error.response?.status === 403) {
          setErrorDetails("Error 403: Access Denied. Please check your account permissions.");
        } else {
          setErrorDetails("Server connection error: " + (error.response?.data?.message || error.message));
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchApplied = async () => {
      if (!id) return;
      try {
        const apps = await portalService.getMyApplications();
        if (Array.isArray(apps)) {
          const already = apps.some((app: any) => app.jobId === Number(id) || app.jobId === id);
          setHasApplied(already);
        }
      } catch (e) {
        console.log("Guest or not logged in candidate", e);
      }
    };

    fetchJob();
    fetchApplied();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isLoggedIn) return;
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    if (!isLoggedIn) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isLoggedIn) return;
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !job || job.id === undefined) return;

    setUploading(true);
    try {
      await portalService.applyForJob(job.id, selectedFile);
      alert("Your application has been submitted successfully! The recruiter will be in touch with you shortly.");
      navigate("/portal/my-applications");
    } catch (error: any) {
      console.error("Failed to apply", error);
      const errorMsg = error.response?.data?.message || error.response?.data || "Application failed. Make sure you are logged in as a CANDIDATE.";
      alert(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center text-slate-500 font-medium">
        <div className="animate-pulse flex flex-col justify-center items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00b14f] animate-bounce"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00b14f] animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00b14f] animate-bounce [animation-delay:0.4s]"></span>
          </div>
          <span className="text-sm">Loading job details...</span>
        </div>
      </div>
    );
  }
  
  if (errorDetails) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white border border-red-200 rounded-2xl shadow-sm text-center space-y-4 my-12">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Job Information Not Found</h2>
        <p className="text-sm font-medium text-slate-600 leading-relaxed">{errorDetails}</p>
        <div className="pt-2">
          <Link to="/portal/jobs" className="inline-flex items-center gap-2 text-xs font-bold text-white bg-slate-900 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Job List
          </Link>
        </div>
      </div>
    );
  }

  if (!job) return <div className="p-12 text-center text-red-500 font-medium">Job recruitment information not found.</div>;

  const isClosed = job.status === 'CLOSED';

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 md:px-0 pb-12">
      {/* Back Button Link bar */}
      <div>
        <Link to="/portal/jobs" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#00b14f] transition-all duration-150 bg-white px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Job List
        </Link>
      </div>

      {/* Main Premium Job Banner */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute left-0 top-0 w-2.5 h-full bg-[#00b14f]"></div>
        
        <div className="flex items-center gap-5 w-full flex-1 min-w-0">
          {/* Logo container */}
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-slate-100 p-1.5 flex items-center justify-center flex-shrink-0 shadow-sm">
            {job.logoUrl ? (
              <img src={job.logoUrl} alt={job.department || 'logo'} className="w-full h-full object-contain" />
            ) : (
              <Briefcase className="w-8 h-8 text-slate-300" />
            )}
          </div>
          
          {/* Main heading texts details */}
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center flex-wrap gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm tracking-wider ${job.status === 'OPEN' ? 'bg-[#e6f7ec] text-[#00b14f]' : 'bg-slate-100 text-slate-600'}`}>
                {job.status || 'OPEN'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-[#212529] tracking-tight line-clamp-2 md:line-clamp-1 pr-4">
              {job.title}
            </h1>
            <div className="text-sm font-medium text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-slate-800 font-semibold">{job.department || 'RecruitIQ Enterprise'}</span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1 text-slate-600 font-medium bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-xs shrink-0">
                <MapPin className="w-3.5 h-3.5 text-[#00b14f] shrink-0" />
                {job.location || 'Remote'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Salary Widget Box Right Side */}
        <div className="shrink-0 w-full md:w-auto bg-[#f8fff9] px-6 py-4 rounded-xl border border-[#00b14f]/10 text-left md:text-right flex flex-row md:flex-col justify-between items-center md:items-end gap-2">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Offered Salary</span>
            <span className="text-xl font-extrabold text-[#00b14f] flex items-center gap-0.5">
              <DollarSign className="w-5 h-5 shrink-0" /> {job.salary || 'Negotiable'}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Structural Layout Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Columns Container Details specifications */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6">
            
            {/* Upper Metadata Information Highlights Quick grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/60 p-4 rounded-xl border border-slate-100 text-slate-800">
              <div className="flex items-start gap-3 p-1">
                <Award className="w-5 h-5 text-[#00b14f] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Experience</span>
                  <span className="text-sm font-bold text-slate-900">
                    {job.minExperienceYears !== undefined ? `${job.minExperienceYears} year${job.minExperienceYears > 1 ? 's' : ''}` : 'No Exp Required'}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-1 border-t sm:border-t-0 sm:border-x border-slate-200/60 sm:px-4">
                <GraduationCap className="w-5 h-5 text-[#00b14f] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Education</span>
                  <span className="text-sm font-bold text-slate-900 truncate max-w-[150px] block" title={job.requiredEducation}>
                    {job.requiredEducation || 'Not Specified'}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-1 border-t sm:border-t-0 sm:px-2">
                <Calendar className="w-5 h-5 text-[#00b14f] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Deadline</span>
                  <span className="text-sm font-bold text-slate-900">{job.deadline || 'No deadline'}</span>
                </div>
              </div>
            </div>

            {/* Required Target Core Technical Skills */}
            <div className="space-y-3">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <BookOpen className="w-4 h-4 text-[#00b14f]" /> Required Skills
              </h2>
              <div className="flex flex-wrap gap-2 pt-1">
                {job.requiredSkills ? (
                  job.requiredSkills.split(',').map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-md text-xs font-semibold border border-slate-200/70 hover:border-[#00b14f]/30 transition-colors">
                      {skill.trim()}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 font-medium italic">No specific professional framework skills demanded.</span>
                )}
              </div>
            </div>

            {/* Job Description Full Details Box */}
            <div className="space-y-3 pt-2">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileText className="w-4 h-4 text-[#00b14f]" /> Job Specification Requirements
              </h2>
              <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-normal bg-white p-2 rounded-xl">
                {job.jdText ? (
                  <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-7">
                    {job.jdText}
                  </div>
                ) : (
                  <p className="text-slate-400 font-medium italic text-xs">Job details documentation has not been populated by the provider yet.</p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Right Sidebar Columns Container Sticky Form widgets */}
        <div className="lg:col-span-1 lg:sticky lg:top-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6">
            
            <div className="border-b border-slate-100 pb-3.5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#00b14f]" />
              <h2 className="text-base font-bold text-slate-900">Apply for this position</h2>
            </div>

            {hasApplied ? (
              <div className="text-center py-6 px-4 bg-[#f8fff9] rounded-xl border border-[#00b14f]/20 flex flex-col items-center justify-center space-y-4">
                {isClosed && (
                  <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 w-full">
                    This position is closed. You can review the job details below, but new applications are no longer accepted.
                  </p>
                )}
                <div className="p-3 bg-[#e6f7ec] text-[#00b14f] rounded-full shadow-inner">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">Application Registered</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed px-1">
                    Your CV packet was pushed to the enterprise managers pipeline. Processing results will refresh on portal board.
                  </p>
                </div>
                <div className="pt-2 w-full">
                  <Button 
                    onClick={() => navigate("/portal/my-applications")}
                    className="w-full bg-[#00b14f] hover:bg-[#009843] text-white font-bold text-xs h-10 rounded-lg shadow-none border-0 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    View Status History Tracker
                  </Button>
                </div>
              </div>
            ) : isClosed ? (
              <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900">Position Closed</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This job is no longer accepting applications.
                </p>
                <Link
                  to="/portal/jobs"
                  className="inline-block text-xs font-bold text-[#00b14f] hover:underline"
                >
                  Browse open positions
                </Link>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                {/* Drag and Drop File Upload Node Box Frame structure */}
                <div 
                  onDragEnter={isLoggedIn ? handleDrag : undefined}
                  onDragOver={isLoggedIn ? handleDrag : undefined}
                  onDragLeave={isLoggedIn ? handleDrag : undefined}
                  onDrop={isLoggedIn ? handleDrop : undefined}
                  onClick={isLoggedIn ? () => fileInputRef.current?.click() : undefined}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all duration-200 flex flex-col items-center justify-center min-h-[170px] ${
                    !isLoggedIn
                      ? "border-slate-200 bg-slate-50/80 cursor-not-allowed opacity-80"
                      : dragActive 
                        ? "border-[#00b14f] bg-[#f8fff9] scale-[1.01] cursor-pointer" 
                        : selectedFile 
                          ? "border-[#00b14f]/40 bg-[#f8fff9]/20 cursor-pointer" 
                          : "border-slate-300 hover:border-[#00b14f] hover:bg-slate-50/50 cursor-pointer"
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                    disabled={!isLoggedIn}
                    className="hidden" 
                  />
                  
                  {!isLoggedIn ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-slate-100 text-slate-400 rounded-full mx-auto w-fit border border-slate-200">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-600">
                        Sign in to select a CV
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium px-2 leading-normal">
                        You must sign in with a candidate account before uploading your application.
                      </p>
                    </div>
                  ) : selectedFile ? (
                    <div className="space-y-2 w-full">
                      <div className="p-2.5 bg-[#e6f7ec] text-[#00b14f] rounded-full mx-auto w-fit">
                        <FileText className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-800 truncate px-4" title={selectedFile.name}>
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change file
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-3 bg-slate-50 text-slate-400 rounded-full mx-auto w-fit border border-slate-100">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        Upload curriculum vitae dossier
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium px-2 leading-normal">
                        Drag & drop structural file document here or click window to browse system (PDF, DOCX)
                      </p>
                    </div>
                  )}
                </div>

                {/* Info hint bar */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00b14f] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                    Your CV will be submitted directly to the hiring team. Only PDF, DOC, and DOCX files are accepted.
                  </p>
                </div>

                {/* Submitting Operations Triggers Actions Bar */}
                {!isLoggedIn ? (
                  <Button 
                    type="button"
                    onClick={() => navigate('/auth/login')}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-11 rounded-lg shadow-none transition-colors flex items-center justify-center gap-2"
                  >
                    Sign in to apply
                  </Button>
                ) : (
                  <Button 
                    type="submit"
                    disabled={!selectedFile || uploading}
                    className="w-full bg-[#00b14f] hover:bg-[#009843] disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 text-white font-bold text-xs h-11 rounded-lg shadow-none transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? "Sending profile application..." : "Apply Job Opportunity"}
                  </Button>
                )}
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}