import { useEffect, useRef, useState, type FormEvent } from 'react';
import { profileService, type ProfileData } from '../services/profileService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, CheckCircle, AlertCircle, Download, Mail, Lock, Shield, Briefcase, GraduationCap, Loader2, Camera, Save, X } from 'lucide-react';
import { portalService } from '../services/portalService';
import { Link } from 'react-router-dom';

const ROLE_CONFIG: Record<string, { label: string; gradient: string; textColor: string; icon: typeof Shield }> = {
  ADMIN: {
    label: 'System Admin',
    gradient: 'bg-gradient-to-r from-rose-500 to-fuchsia-600',
    textColor: 'text-white',
    icon: Shield,
  },
  HR_OFFICER: {
    label: 'HR Recruiter',
    gradient: 'bg-gradient-to-r from-fuchsia-500 to-indigo-600',
    textColor: 'text-white',
    icon: Briefcase,
  },
  CANDIDATE: {
    label: 'Candidate',
    gradient: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    textColor: 'text-white',
    icon: GraduationCap,
  },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const [error, setError] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

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

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await profileService.getProfile();
      setProfile(data);
      setName(data.name || '');
      setEmail(data.email || '');
      setAvatarUrl(data.avatarUrl || null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
    void (async () => {
      try {
        const apps = await portalService.getMyApplications();
        setApplications(Array.isArray(apps) ? apps : []);
      } catch (e) {
        // ignore if user not candidate or not logged in
      }
    })();
  }, []);

  const handleAvatarFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG, or GIF).');
      event.target.value = '';
      return;
    }

    try {
      const avatarDataUrl = await readFileAsDataUrl(file);
      setAvatarUrl(avatarDataUrl);
    } catch (err) {
      console.error('Unable to read selected profile image', err);
      setError('Please select a valid image file for the profile picture.');
    }
    event.target.value = '';
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const updated = await profileService.updateProfile({
        name,
        email,
        password: password.trim() || undefined,
        avatarUrl: avatarUrl || ""
      });
      setProfile(updated);
      setAvatarUrl(updated.avatarUrl || null);
      setMessage('Profile updated successfully.');
      setPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="rounded-2xl bg-red-50 border border-red-100 px-6 py-4 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Profile data not available.
        </div>
      </div>
    );
  }

  const roleKey = profile.role || 'CANDIDATE';
  const roleCfg = ROLE_CONFIG[roleKey] || ROLE_CONFIG.CANDIDATE;
  const RoleIcon = roleCfg.icon;
  const isCandidate = roleKey === 'CANDIDATE';
  const initials = getInitials(profile.name || 'U');

  /* ── Profile Banner ── */
  const profileBanner = (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Gradient strip at the top */}
      <div className={`h-28 ${roleCfg.gradient}`} />

      {/* Hidden file input for avatar */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileSelect}
      />

      <div className="px-8 pb-8">
        {/* Avatar overlapping the gradient */}
        <div className="-mt-14 flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-5">
            <div className="relative group">
              {/* Clickable avatar area */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 transition-transform hover:scale-105"
                title="Click to change profile picture"
              >
                {avatarUrl ? (
                  <div className="relative">
                    <img
                      src={avatarUrl}
                      alt={profile.name}
                      className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-lg ring-1 ring-slate-200"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center border-4 border-transparent">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className={`h-24 w-24 rounded-2xl border-4 border-white shadow-lg ring-1 ring-slate-200 flex items-center justify-center ${roleCfg.gradient} text-white text-2xl font-extrabold relative`}>
                    {initials}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 rounded-2xl bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center border-4 border-transparent">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                  </div>
                )}
              </button>

              {/* Camera badge */}
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-lg bg-white shadow-md ring-1 ring-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <Camera className="h-3.5 w-3.5 text-slate-500" />
              </div>

              {/* Remove button (only when avatar exists) */}
              {avatarUrl && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemoveAvatar(); }}
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 shadow-md flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove profile picture"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              )}
            </div>

            <div className="pb-1">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{profile.name}</h1>
              <p className="mt-0.5 text-sm text-slate-500">{profile.email}</p>
              <p className="mt-1 text-xs text-slate-400">Click avatar to change profile picture</p>
            </div>
          </div>

          {/* Role badge */}
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold shadow-sm ${roleCfg.gradient} ${roleCfg.textColor}`}>
            <RoleIcon className="h-3.5 w-3.5" />
            {roleCfg.label}
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Alerts ── */
  const alerts = (
    <>
      {message && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle className="h-4 w-4 shrink-0" />{message}
        </div>
      )}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}
    </>
  );

  /* ── Form Section ── */
  const formSection = (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex items-center gap-3 text-slate-900">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-700">
          <User className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">Personal Information</p>
          <p className="text-sm text-slate-500">Update your name, email and password.</p>
        </div>
      </div>

      {alerts}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name + Email row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label htmlFor="profile-name" className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Full name
            </label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your full name"
              className="h-11 rounded-xl border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-900 font-medium transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-email" className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Email address
            </label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="h-11 rounded-xl border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-900 font-medium transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="profile-password" className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            New password
          </label>
          <Input
            id="profile-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
            className="h-11 rounded-xl border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-900 font-medium transition-colors max-w-md"
          />
          <p className="text-xs text-slate-400">Minimum 6 characters recommended for security.</p>
        </div>



        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button
            type="submit"
            disabled={saving}
            className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold text-sm h-11 px-6 rounded-xl shadow-md shadow-fuchsia-600/10 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save profile
              </>
            )}
          </Button>
        </div>
      </form>
    </section>
  );

  /* ── CV Sidebar (Candidate only) ── */
  const cvSidebar = (
    <aside className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <Download className="h-4 w-4" />
          </div>
          <p className="text-sm font-bold text-slate-900">My CV</p>
        </div>

        <div className="text-sm text-slate-600 space-y-3">
          {applications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <Download className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-500">No uploaded CVs yet</p>
              <p className="text-xs text-slate-400 mt-1">Submit your CV when applying to a job.</p>
            </div>
          ) : (
            (() => {
              const latest = [...applications].sort((a, b) => (new Date(b.uploadedAt || 0).getTime()) - (new Date(a.uploadedAt || 0).getTime()))[0];
              return (
                <div className="space-y-3">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <div className="font-semibold text-slate-900 truncate">{latest.originalFilename || 'CV.pdf'}</div>
                    <div className="text-xs text-slate-500 mt-1">Uploaded: {latest.uploadedAt ? new Date(latest.uploadedAt).toLocaleString() : 'Unknown'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => portalService.downloadCv(latest.id, latest.originalFilename || 'cv.pdf')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors flex-1 justify-center"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                    <Link
                      to="/portal/my-applications"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors flex-1 justify-center"
                    >
                      View all
                    </Link>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* Quick Info Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Account Info</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Role</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${roleCfg.gradient} ${roleCfg.textColor}`}>
              <RoleIcon className="h-3 w-3" />
              {roleCfg.label}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Status</span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          </div>
        </div>
      </div>
    </aside>
  );

  /* ── Non-candidate Sidebar: Quick Info ── */
  const quickInfoSidebar = (
    <aside className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Account Info</p>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Role</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${roleCfg.gradient} ${roleCfg.textColor}`}>
              <RoleIcon className="h-3 w-3" />
              {roleCfg.label}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Status</span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Email</span>
            <span className="text-sm font-medium text-slate-700 truncate max-w-[180px]">{profile.email}</span>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="space-y-6">
      {profileBanner}

      <div className={`grid gap-6 ${isCandidate ? 'lg:grid-cols-[1fr_340px]' : 'lg:grid-cols-[1fr_300px]'}`}>
        {formSection}
        {isCandidate ? cvSidebar : quickInfoSidebar}
      </div>
    </div>
  );
}
