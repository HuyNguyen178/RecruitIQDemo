import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { portalService } from "../../services/portalService";
import { type Job } from "../../services/jobService";
import { cityService, type City } from "../../services/cityService";
import { Button } from "../../components/ui/Button";
import {
  Search, MapPin, Award, Briefcase, DollarSign, Calendar
} from "lucide-react";

export default function PortalJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Filter States
  const [selectedLocation, setSelectedLocation] = useState<string>("All");
  const [selectedExperience, setSelectedExperience] = useState<string>("All");

  const getJobLocation = (job: Job) => job.cityName || job.location || "";

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const [jobsData, citiesData] = await Promise.all([
          portalService.getOpenJobs(),
          cityService.getActiveCities(),
        ]);
        setJobs(jobsData);
        setCities(citiesData);
      } catch (error) {
        console.error("Failed to load portal jobs", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchApplied = async () => {
      if (!token) {
        // Not logged in, skip fetching applications
        setAppliedJobIds([]);
        return;
      }
      try {
        const apps = await portalService.getMyApplications();
        if (Array.isArray(apps)) {
          setAppliedJobIds(apps.map((app: any) => app.jobId));
        }
      } catch (e) {
        console.log("Guest or not logged in candidate", e);
      }
    };

    void fetchJobs();
    void fetchApplied();
  }, []);

  const handleApplyClick = (jobId: number | undefined, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click trigger
    if (!token) {
      alert("Please log in to apply for a job.");
      return;
    }
    if (!jobId) {
      alert("Invalid job selected.");
      return;
    }
    setSelectedJobId(jobId);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || selectedJobId === null) return;

    setUploading(true);
    try {
      await portalService.applyForJob(selectedJobId, file);
      alert("Your application has been submitted successfully! The recruiter will review it shortly.");
      navigate("/portal/my-applications");
    } catch (error: any) {
      console.error("Failed to apply", error);
      const errorMsg = error.response?.data?.message || error.response?.data || "Application failed. Make sure you are logged in as a CANDIDATE.";
      alert(errorMsg);
    } finally {
      setUploading(false);
      setSelectedJobId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCardClick = (jobId: number) => {
    navigate(`/portal/jobs/${jobId}`);
  };

  // Client-side search and filtering
  const filteredJobs = jobs.filter((job) => {
    const jobLocation = getJobLocation(job);

    // 1. Search Query Match
    const searchString = `${job.title || ""} ${job.department || ""} ${jobLocation} ${job.jdText || ""} ${job.requiredSkills || ""}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());

    // 2. Location Match (city from master list)
    const matchesLocation = selectedLocation === "All" || jobLocation === selectedLocation;

    // 3. Experience Match
    let matchesExperience = true;
    if (selectedExperience === "0") {
      matchesExperience = job.minExperienceYears === 0 || job.minExperienceYears === undefined;
    } else if (selectedExperience === "1-2") {
      matchesExperience = job.minExperienceYears !== undefined && job.minExperienceYears >= 1 && job.minExperienceYears <= 2;
    } else if (selectedExperience === "3+") {
      matchesExperience = job.minExperienceYears !== undefined && job.minExperienceYears >= 3;
    }

    return matchesSearch && matchesLocation && matchesExperience;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,.doc,.docx"
        onChange={handleFileUpload}
      />

      {/* TopCV Style Hero Banner with Glassmorphism */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-100 via-emerald-200 to-emerald-300 text-slate-900 p-8 md:p-12 shadow-sm border border-emerald-200/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/60 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-100/60 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-3xl relative z-10 space-y-6">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Find your dream job at <span className="text-emerald-700 relative inline-block">RecruitIQ<span className="absolute bottom-0 left-0 w-full h-1.5 bg-emerald-700/20 rounded-full"></span></span>
          </h1>
          <p className="text-lg text-slate-700 max-w-xl leading-relaxed font-medium">
            Browse open positions and submit your CV directly to the hiring team.
          </p>

          {/* Elite SaaS Search & Filter Box */}
          <div className="pt-2 max-w-5xl">
            <div className="bg-white rounded-2xl p-2.5 flex flex-col lg:flex-row items-center gap-3 shadow-2xl border border-emerald-600/10 w-full">

              {/* Segment 1: Keywords */}
              <div className="flex items-center flex-1 w-full border-b lg:border-b-0 lg:border-r border-slate-100 pb-2.5 lg:pb-0">
                <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Job title, position, skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none px-3 py-2 text-slate-900 placeholder:text-slate-400 font-bold text-sm"
                />
              </div>

              {/* Segment 2: Location Dropdown */}
              <div className="flex items-center w-full lg:w-56 border-b lg:border-b-0 lg:border-r border-slate-100 pb-2.5 lg:pb-0 shrink-0">
                <MapPin className="w-5 h-5 text-[#00b14f] ml-3 shrink-0" />
                <div className="relative flex-1">
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full bg-transparent border-none focus:outline-none px-3 py-2 text-slate-700 font-bold text-sm appearance-none cursor-pointer pr-8"
                  >
                    <option value="All" className="text-slate-900 font-bold bg-white">All Locations</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.name} className="text-slate-900 font-bold bg-white">
                        {city.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                  </div>
                </div>
              </div>

              {/* Segment 3: Experience Dropdown */}
              <div className="flex items-center w-full lg:w-56 pb-2.5 lg:pb-0 shrink-0">
                <Award className="w-5 h-5 text-[#00b14f] ml-3 shrink-0" />
                <div className="relative flex-1">
                  <select
                    value={selectedExperience}
                    onChange={(e) => setSelectedExperience(e.target.value)}
                    className="w-full bg-transparent border-none focus:outline-none px-3 py-2 text-slate-700 font-bold text-sm appearance-none cursor-pointer pr-8"
                  >
                    <option value="All" className="text-slate-900 font-bold bg-white">All Experience Levels</option>
                    <option value="0" className="text-slate-900 font-bold bg-white">Fresh Graduate / 0 years</option>
                    <option value="1-2" className="text-slate-900 font-bold bg-white">1 - 2 years experience</option>
                    <option value="3+" className="text-slate-900 font-bold bg-white">3+ years experience</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                  </div>
                </div>
              </div>

              {/* Reset filter button */}
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedLocation("All");
                  setSelectedExperience("All");
                }}
                className="w-full lg:w-auto rounded-xl px-6 bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-sm h-12 shadow-sm transition-all shrink-0"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Quick Statistics Banner removed per design request */}
        </div>
      </div>

      {/* Job Listings */}
      <div className="grid grid-cols-1 gap-8">

        {/* Job Listings */}
        <div className="space-y-6">



          {/* Job Section Header */}
          <div className="flex items-center justify-between border-l-4 border-[#00b14f] pl-3">
            <h2 className="text-xl font-extrabold text-slate-900">Best Matching Jobs</h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              Found {filteredJobs.length} opportunities
            </span>
          </div>

          {/* Jobs Listing Card List */}
          {/* Jobs Listing Card List */}
          <div className="space-y-3">
            {loading ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 font-medium">
                <div className="animate-pulse flex justify-center items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00b14f] animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-[#00b14f] animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#00b14f] animate-bounce [animation-delay:0.4s]"></span>
                  Loading job list...
                </div>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 font-medium shadow-sm">
                No matching job opportunities found.
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => job.id && handleCardClick(job.id)}
                    className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-[#00b14f]/40 hover:shadow-md hover:bg-[#f8fff9]/30 transition-all duration-200 cursor-pointer relative"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') job.id && handleCardClick(job.id); }}
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">

                      {/* Left + Middle Layout Cluster */}
                      <div className="flex items-start gap-4 flex-1 min-w-0 w-full">

                        {/* Left Side: Company Logo */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-100 p-1 flex items-center justify-center shadow-sm">
                          {job.logoUrl ? (
                            <img src={job.logoUrl} alt={job.department || 'logo'} className="w-full h-full object-contain" />
                          ) : (
                            <Briefcase className="w-7 h-7 text-slate-300" />
                          )}
                        </div>

                        {/* Middle Side: Core Job Info */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center flex-wrap gap-2">
                            <h3 className="text-base font-bold text-[#212529] group-hover:text-[#00b14f] transition-colors line-clamp-1 pr-2">
                              {job.title}
                            </h3>
                            {job.status === 'OPEN'}
                          </div>

                          {/* Company & Location Row (Exactly where it stands out) */}
                          <div className="text-sm font-medium text-slate-500 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <span className="hover:text-slate-800 transition-colors truncate">
                              {job.department || 'RecruitIQ Group'}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="inline-flex items-center gap-1 text-slate-600 font-semibold bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-xs shrink-0">
                              <MapPin className="w-3.5 h-3.5 text-[#00b14f] shrink-0" />
                              {getJobLocation(job) || 'Remote'}
                            </span>
                          </div>

                          {/* TopCV Horizontal Quick Badges */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                            {/* Salary Badge */}
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 font-semibold rounded">
                              <DollarSign className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              {job.salary || 'Negotiable'}
                            </span>

                            {/* Experience Badge */}
                            {job.minExperienceYears !== undefined && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded">
                                <Award className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                {job.minExperienceYears === 0 ? 'No Exp Required' : `${job.minExperienceYears} yr${job.minExperienceYears > 1 ? 's' : ''} Exp`}
                              </span>
                            )}

                            {/* Education Badge */}
                            {job.requiredEducation && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded">
                                {job.requiredEducation}
                              </span>
                            )}
                          </div>

                          {/* Short Job Description Snippet */}
                          {job.jdText && (
                            <p className="text-xs text-slate-400 font-normal line-clamp-1 pt-0.5 hidden sm:block">
                              {job.jdText}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Action Buttons & Due Date */}
                      <div className="flex md:flex-col justify-between md:justify-center items-center md:items-end w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 shrink-0 gap-3">

                        {/* Button block */}
                        <div className="order-2 md:order-1">
                          {job.id && appliedJobIds.includes(job.id) ? (
                            <span className="inline-flex items-center text-xs font-bold bg-slate-100 text-slate-400 px-5 py-2 rounded-md border border-slate-200">
                              Applied
                            </span>
                          ) : !token ? (
                            <Button
                              onClick={(e) => { e.stopPropagation(); navigate('/auth/login'); }}
                              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-md px-4 py-2 transition-colors shadow-none"
                            >
                              Login
                            </Button>
                          ) : (
                            <Button
                              onClick={(e) => handleApplyClick(job.id, e)}
                              disabled={uploading && selectedJobId === job.id}
                              className="bg-[#00b14f] hover:bg-[#009843] text-white text-xs font-bold rounded-md px-5 py-2 shadow-none transition-all duration-150 active:scale-98"
                            >
                              {uploading && selectedJobId === job.id ? 'Sending...' : 'Apply Now'}
                            </Button>
                          )}
                        </div>

                        {/* Deadline tracking */}
                        <div className="order-1 md:order-2 text-xs text-slate-400 flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>Due: {job.deadline || 'No deadline'}</span>
                        </div>

                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
