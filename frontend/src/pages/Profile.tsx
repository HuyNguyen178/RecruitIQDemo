import { useEffect, useState, type FormEvent } from 'react';
import { profileService, type ProfileData } from '../services/profileService';
import { Button } from '../components/ui/Button';
import { ImageUpload } from '../components/ui/ImageUpload';
import { Input } from '../components/ui/Input';
import { User, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { portalService } from '../services/portalService';
import { Link } from 'react-router-dom';

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const [error, setError] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await profileService.getProfile();
      setProfile(data);
      setName(data.name || '');
      setEmail(data.email || '');
      setProfileImageUrl(data.profileImageUrl || null);
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

  const handleImageChange = (file: File | null) => {
    setProfileImage(file);
    if (!file) {
      setProfileImageUrl(profile?.profileImageUrl || null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const updated = await profileService.updateProfile({ name, email, password: password.trim() || undefined });
      setProfile(updated);
      setMessage(`Profile updated successfully.${profileImage ? ' Profile image selected for upload.' : ''}`);
      setPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="p-8 text-center text-red-500">Profile data not available.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Account</p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Your profile</h1>
            <p className="mt-2 text-sm text-slate-500 max-w-2xl">
              Update your personal details and password. Role and account status are managed by the system.
            </p>
          </div>
          {/* Role/status intentionally hidden: inactive users cannot log in */}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 text-slate-900">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-700">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Personal Information</p>
              <p className="text-sm text-slate-500">Name, email and password.</p>
            </div>
          </div>

          {message && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle className="inline h-4 w-4 mr-2 align-middle" />{message}
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="inline h-4 w-4 mr-2 align-middle" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="text-sm font-semibold text-slate-700">Full name</label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email address</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-semibold text-slate-700">New password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
              />
            </div>

            <div>
              <ImageUpload
                label="Profile picture"
                helperText="Upload a profile image for your account. Accepted formats: PNG, JPG, JPEG, GIF."
                currentImageUrl={profileImageUrl || undefined}
                onFileChange={handleImageChange}
              />
            </div>

            <div className="flex flex-wrap gap-3 justify-end">
              <Button type="submit" disabled={saving} className="bg-fuchsia-600 hover:bg-fuchsia-700">
                {saving ? 'Saving...' : 'Save profile'}
              </Button>
            </div>
          </form>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">My CV</p>
          <div className="mt-4 text-sm text-slate-600 space-y-3">
            {applications.length === 0 ? (
              <div className="text-sm text-slate-500">No uploaded CVs yet. Submit your CV when applying to a job.</div>
            ) : (
              (() => {
                const latest = [...applications].sort((a,b) => (new Date(b.uploadedAt || 0).getTime()) - (new Date(a.uploadedAt || 0).getTime()))[0];
                return (
                  <div>
                    <div className="font-semibold text-slate-900">{latest.originalFilename || 'CV.pdf'}</div>
                    <div className="text-xs text-slate-500">Uploaded: {latest.uploadedAt ? new Date(latest.uploadedAt).toLocaleString() : 'Unknown'}</div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => portalService.downloadCv(latest.id, latest.originalFilename || 'cv.pdf')}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-md text-sm"
                      >
                        <Download className="w-4 h-4" /> Download
                      </button>
                      <Link to="/portal/my-applications" className="inline-flex items-center gap-2 px-3 py-2 bg-[#00b14f] text-white rounded-md text-sm">
                        View all
                      </Link>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
