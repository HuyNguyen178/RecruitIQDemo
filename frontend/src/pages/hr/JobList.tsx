import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { jobService, type Job } from "../../services/jobService";
import { Button } from "../../components/ui/Button";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Input } from "../../components/ui/Input";
import { Plus, Search, Eye, Pencil, Trash2, X, Briefcase, MapPin, Building, Calendar, GraduationCap, Award, Users } from "lucide-react";

export default function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  // Form state (Matching precisely Java com.recruitiq.dto.JobRequest DTO)
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    jdText: "",
    requiredSkills: "",
    logoUrl: "",
    salary: "",
    minExperienceYears: 1,
    requiredEducation: "BACHELOR" as 'HIGH_SCHOOL' | 'BACHELOR' | 'MASTER' | 'PHD',
    deadline: "",
    status: "OPEN" as 'OPEN' | 'CLOSED'
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const prefix = isAdmin ? "/admin" : "/hr";

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const data = await jobService.getAllJobs();
      setJobs(data);
    } catch (error) {
      console.error("Failed to load jobs", error);
    } finally {
      setLoading(false);
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Unable to read image file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const handleLogoFileChange = async (file: File | null) => {
    if (!file) {
      return;
    }

    try {
      const logoDataUrl = await readFileAsDataUrl(file);
      setFormData((prev) => ({ ...prev, logoUrl: logoDataUrl }));
    } catch (error) {
      console.error("Unable to read selected logo image", error);
      setFormError("Please select a valid image file for the company logo.");
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedJobId(null);
    setFormData({
      title: "",
      department: "",
      location: "",
      jdText: "",
      requiredSkills: "",
      logoUrl: "",
      salary: "",
      minExperienceYears: 1,
      requiredEducation: "BACHELOR",
      deadline: new Date().toISOString().split('T')[0], // default to today
      status: "OPEN"
    });
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (job: Job) => {
    if (!job.id) return;
    setModalMode('edit');
    setSelectedJobId(job.id);
    setFormData({
      title: job.title || "",
      department: job.department || "",
      location: job.location || "",
      jdText: job.jdText || "",
      requiredSkills: job.requiredSkills || "",
      logoUrl: job.logoUrl || "",
      salary: job.salary || "",
      minExperienceYears: job.minExperienceYears || 0,
      requiredEducation: job.requiredEducation || "BACHELOR",
      deadline: job.deadline || "",
      status: job.status || "OPEN"
    });
    setFormError("");
    setShowModal(true);
  };

  const handleDeleteJob = async (id: number | undefined) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this job posting? This action cannot be undone.")) return;

    try {
      await jobService.deleteJob(id);
      await fetchJobs(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete job", error);
      alert("Failed to delete job posting. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      if (modalMode === 'create') {
        await jobService.createJob(formData);
      } else if (modalMode === 'edit' && selectedJobId) {
        await jobService.updateJob(selectedJobId, formData);
      }
      setShowModal(false);
      await fetchJobs(); // Refresh list
    } catch (error: any) {
      console.error("Failed to save job details", error);
      if (error.response?.status === 403) {
        setFormError("You are not authorized to create or update jobs. Please login as an HR officer or admin.");
      } else {
        setFormError(error.response?.data?.message || "Failed to save job. Please check all required fields.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Jobs</h1>
          <p className="text-slate-500">Manage all job postings, requirements, and statuses.</p>
        </div>
        <Button 
          onClick={openCreateModal}
          className="gap-2 bg-fuchsia-600 hover:bg-fuchsia-700"
        >
          <Plus className="w-4 h-4" />
          Create Job
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search jobs by title, department..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3">Job Details</th>
                <th scope="col" className="px-6 py-3">Requirements</th>
                <th scope="col" className="px-6 py-3">Deadline</th>
                <th scope="col" className="px-6 py-3">Applicants</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">Loading jobs...</td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No jobs found matching your search.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="bg-white border-b hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
                          {job.logoUrl ? (
                            <img src={job.logoUrl} alt={job.department || 'logo'} className="w-full h-full object-contain" />
                          ) : (
                            <Briefcase className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{job.title}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            {job.department}
                            <span className="text-slate-300">•</span>
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {job.location}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-800">
                        {job.minExperienceYears !== undefined && job.minExperienceYears !== null
                          ? `${job.minExperienceYears} Year(s)`
                          : 'No exp'}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {job.requiredEducation || 'No edu req'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-700 font-semibold">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {job.deadline}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
                        <Users className="w-3 h-3 text-blue-600" />
                        {job.candidateCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        job.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {job.status || 'OPEN'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`${prefix}/jobs/${job.id}`} 
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View job applications"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </Link>
                        <button 
                          onClick={() => openEditModal(job)}
                          className="p-1.5 text-slate-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-md transition-colors"
                          title="Edit job details"
                        >
                          <Pencil className="w-4.5 h-4.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteJob(job.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete job posting"
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

      {/* Unified Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {modalMode === 'create' ? 'Create New Job Posting' : 'Edit Job Details'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                  {formError}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5" htmlFor="job-title">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    Job Title
                  </label>
                  <Input 
                    id="job-title"
                    placeholder="e.g. Senior Software Engineer"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="text-slate-900"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5" htmlFor="job-department">
                    <Building className="w-4 h-4 text-slate-400" />
                    Department
                  </label>
                  <Input 
                    id="job-department"
                    placeholder="e.g. Engineering"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5" htmlFor="job-location">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    Location
                  </label>
                  <Input 
                    id="job-location"
                    placeholder="e.g. Hanoi, Vietnam (Hybrid)"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="text-slate-900"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5" htmlFor="job-status">
                    Status
                  </label>
                  <select
                    id="job-status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2"
                  >
                    <option value="OPEN">OPEN (Accepting Applications)</option>
                    <option value="CLOSED">CLOSED (Stopped)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5" htmlFor="job-experience">
                    <Award className="w-4 h-4 text-slate-400" />
                    Experience (Years)
                  </label>
                  <Input 
                    id="job-experience"
                    type="number"
                    min={0}
                    value={formData.minExperienceYears}
                    onChange={(e) => setFormData({ ...formData, minExperienceYears: parseInt(e.target.value) || 0 })}
                    className="text-slate-900"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5" htmlFor="job-education">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    Required Education
                  </label>
                  <select
                    id="job-education"
                    value={formData.requiredEducation}
                    onChange={(e) => setFormData({ ...formData, requiredEducation: e.target.value as any })}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2"
                  >
                    <option value="HIGH_SCHOOL">High School</option>
                    <option value="BACHELOR">Bachelor's Degree</option>
                    <option value="MASTER">Master's Degree</option>
                    <option value="PHD">PhD</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5" htmlFor="job-deadline">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    Application Deadline
                  </label>
                  <Input 
                    id="job-deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="job-logoUrl">Company Logo</label>
                  <ImageUpload
                    label="Job logo"
                    helperText="Upload an image file or enter a logo URL below."
                    currentImageUrl={formData.logoUrl || undefined}
                    onFileChange={handleLogoFileChange}
                  />
                  <Input
                    id="job-logoUrl"
                    placeholder="https://.../logo.png"
                    value={formData.logoUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, logoUrl: e.target.value });
                    }}
                    className="text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="job-salary">Salary</label>
                  <Input
                    id="job-salary"
                    placeholder="e.g. 15,000,000 VND - 25,000,000 VND"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="job-jdText">
                  Job Description (JD Text)
                </label>
                <textarea
                  id="job-jdText"
                  rows={4}
                  placeholder="Describe the role and general responsibilities..."
                  value={formData.jdText}
                  onChange={(e) => setFormData({ ...formData, jdText: e.target.value })}
                  className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2 min-h-[80px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="job-requiredSkills">
                  Required Skills & Experience
                </label>
                <textarea
                  id="job-requiredSkills"
                  rows={4}
                  placeholder="Detail the technical requirements and key skills..."
                  value={formData.requiredSkills}
                  onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                  className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2 min-h-[80px]"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-fuchsia-600 hover:bg-fuchsia-700"
                >
                  {submitting ? "Processing..." : modalMode === 'create' ? "Create Job" : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
