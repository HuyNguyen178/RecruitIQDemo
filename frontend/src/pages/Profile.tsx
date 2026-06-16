import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { profileService, type ProfileData } from '../services/profileService';
import { fileService } from '../services/fileService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  User,
  CheckCircle,
  AlertCircle,
  Mail,
  Lock,
  Shield,
  Briefcase,
  GraduationCap,
  Loader2,
  Camera,
  X,
  Pencil,
} from 'lucide-react';

type EditField = 'avatar' | 'name' | 'email' | 'password';

const ROLE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: typeof Shield }
> = {
  ADMIN: {
    label: 'System Admin',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-100',
    icon: Shield,
  },
  HR_OFFICER: {
    label: 'HR / Recruiter',
    badgeClass: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
    icon: Briefcase,
  },
  CANDIDATE: {
    label: 'Candidate',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    icon: GraduationCap,
  },
};

type Theme = {
  accent: string;
  ring: string;
  avatarRing: string;
};

function getTheme(pathname: string): Theme {
  if (pathname.startsWith('/portal')) {
    return {
      accent: 'bg-[#00b14f] hover:bg-[#009843]',
      ring: 'focus-visible:ring-[#00b14f]',
      avatarRing: 'ring-[#00b14f]/30',
    };
  }
  return {
    accent: 'bg-fuchsia-600 hover:bg-fuchsia-700',
    ring: 'focus-visible:ring-fuchsia-500',
    avatarRing: 'ring-fuchsia-500/30',
  };
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function extractError(err: any): string {
  const data = err?.response?.data;
  return (typeof data === 'string' ? data : data?.message) || 'Something went wrong. Please try again.';
}

function AccountStatusBadge({ isActive }: { isActive?: boolean }) {
  if (isActive === false) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Inactive
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  );
}

function ProfileFieldRow({
  label,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: () => void;
  icon: typeof User;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-0">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">{value}</p>
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onChange} className="shrink-0 gap-1">
        <Pencil className="h-3.5 w-3.5" />
        Change
      </Button>
    </div>
  );
}

export default function Profile() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = getTheme(location.pathname);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [editingField, setEditingField] = useState<EditField | null>(null);
  const [modalError, setModalError] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftAvatar, setDraftAvatar] = useState<string | null>(null);
  const [draftAvatarFile, setDraftAvatarFile] = useState<File | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('Unable to read image file'));
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
    } catch (err: any) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const closeModal = () => {
    setEditingField(null);
    setModalError('');
    setVerifyPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setDraftAvatarFile(null);
  };

  const openEdit = (field: EditField) => {
    if (!profile) return;
    setModalError('');
    setVerifyPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setDraftName(profile.name || '');
    setDraftEmail(profile.email || '');
    setDraftAvatar(profile.avatarUrl || null);
    setDraftAvatarFile(null);
    setEditingField(field);
  };

  const handleAvatarFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setDraftAvatarFile(null);
      setDraftAvatar(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setModalError('Please select a valid image file (PNG, JPG, JPEG, or GIF).');
      event.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setModalError('Profile picture must not exceed 2MB.');
      event.target.value = '';
      return;
    }

    try {
      setDraftAvatarFile(file);
      setDraftAvatar(await readFileAsDataUrl(file));
      setModalError('');
    } catch {
      setModalError('Unable to read image file. Please try again.');
    }
    event.target.value = '';
  };

  const applyUpdate = async (
    payload: Parameters<typeof profileService.updateProfile>[0],
    options?: { emailChanged?: boolean; successMessage?: string }
  ) => {
    if (!profile) return;
    setSaving(true);
    setModalError('');
    setError('');
    try {
      const updated = await profileService.updateProfile({
        name: profile.name,
        email: profile.email,
        ...payload,
      });
      setProfile(updated);
      setMessage(options?.successMessage || 'Updated successfully.');
      window.dispatchEvent(new Event('profile-updated'));

      if (options?.emailChanged) {
        closeModal();
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setTimeout(() => navigate('/auth/login'), 2000);
        setMessage('Email updated. Please sign in again with your new email.');
        return;
      }

      closeModal();
    } catch (err: any) {
      setModalError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleModalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile || !editingField) return;

    const password = verifyPassword.trim();
    if (!password) {
      setModalError('Please enter your current password to confirm this change.');
      return;
    }

    if (editingField === 'name') {
      if (!draftName.trim()) {
        setModalError('Name cannot be empty.');
        return;
      }
      if (draftName.trim() === profile.name) {
        setModalError('Enter a different name or cancel.');
        return;
      }
      await applyUpdate(
        { name: draftName.trim(), currentPassword: password },
        { successMessage: 'Name updated successfully.' }
      );
      return;
    }

    if (editingField === 'email') {
      if (!draftEmail.trim()) {
        setModalError('Email cannot be empty.');
        return;
      }
      if (draftEmail.trim().toLowerCase() === profile.email?.toLowerCase()) {
        setModalError('Enter a different email or cancel.');
        return;
      }
      await applyUpdate(
        { email: draftEmail.trim(), currentPassword: password },
        { emailChanged: true }
      );
      return;
    }

    if (editingField === 'avatar') {
      const current = profile.avatarUrl || null;
      if (draftAvatar === current && !draftAvatarFile) {
        setModalError('Choose a new photo or remove the current one.');
        return;
      }

      let avatarUrl = draftAvatar || '';
      if (draftAvatarFile) {
        avatarUrl = await fileService.uploadImage(draftAvatarFile);
      }

      await applyUpdate(
        { avatarUrl, currentPassword: password },
        { successMessage: 'Profile photo updated successfully.' }
      );
      return;
    }

    if (editingField === 'password') {
      const next = newPassword.trim();
      const confirm = confirmPassword.trim();
      if (!next) {
        setModalError('Please enter a new password.');
        return;
      }
      if (next.length < 6) {
        setModalError('New password must be at least 6 characters.');
        return;
      }
      if (next !== confirm) {
        setModalError('New passwords do not match.');
        return;
      }
      await applyUpdate(
        { password: next, currentPassword: password },
        { successMessage: 'Password updated successfully.' }
      );
    }
  };

  const modalTitle: Record<EditField, string> = {
    avatar: 'Change profile photo',
    name: 'Change full name',
    email: 'Change email',
    password: 'Change password',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Profile data not available.
        </div>
      </div>
    );
  }

  const roleKey = profile.role || 'CANDIDATE';
  const roleCfg = ROLE_CONFIG[roleKey] || ROLE_CONFIG.CANDIDATE;
  const RoleIcon = roleCfg.icon;
  const initials = getInitials(profile.name || 'U');
  const displayAvatar = profile.avatarUrl;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Each setting is changed separately. You will be asked for your current password to confirm.
        </p>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {message}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Summary card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
          <div className={`relative shrink-0 ring-4 ${theme.avatarRing} rounded-2xl`}>
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={profile.name}
                className="h-24 w-24 rounded-2xl border-2 border-white object-cover shadow-md"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-3xl font-bold text-white shadow-md">
                {initials}
              </div>
            )}
          </div>
          <div className="mt-4 min-w-0 flex-1 sm:mt-0">
            <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
            <p className="text-sm text-slate-500">{profile.email}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${roleCfg.badgeClass}`}
              >
                <RoleIcon className="h-3.5 w-3.5" />
                {roleCfg.label}
              </span>
              <AccountStatusBadge isActive={profile.isActive} />
            </div>
          </div>
        </div>
      </div>

      {/* Settings list */}
      <div className="rounded-2xl border border-slate-200 bg-white px-6 shadow-sm">
        <div className="border-b border-slate-100 py-4">
          <h3 className="text-base font-bold text-slate-900">Account settings</h3>
          <p className="text-sm text-slate-500">Click Change to update a single field.</p>
        </div>

        <ProfileFieldRow
          label="Profile photo"
          value={displayAvatar ? 'Custom photo' : 'Initials avatar'}
          icon={Camera}
          onChange={() => openEdit('avatar')}
        />
        <ProfileFieldRow
          label="Full name"
          value={profile.name || '—'}
          icon={User}
          onChange={() => openEdit('name')}
        />
        <ProfileFieldRow
          label="Email"
          value={profile.email || '—'}
          icon={Mail}
          onChange={() => openEdit('email')}
        />
        <ProfileFieldRow
          label="Password"
          value="••••••••"
          icon={Lock}
          onChange={() => openEdit('password')}
        />
      </div>

      {/* Edit modal */}
      {editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">{modalTitle[editingField]}</h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4 p-6">
              {modalError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {modalError}
                </div>
              )}

              {editingField === 'avatar' && (
                <div className="space-y-4">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileSelect}
                  />
                  <div className="flex flex-col items-center gap-3">
                    {draftAvatar ? (
                      <img
                        src={draftAvatar}
                        alt="Preview"
                        className="h-24 w-24 rounded-2xl object-cover ring-2 ring-slate-200"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-bold text-slate-500">
                        {initials}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        <Camera className="h-4 w-4" />
                        Upload photo
                      </Button>
                      {draftAvatar && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setDraftAvatar(null)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">PNG or JPG, max 2MB</p>
                  </div>
                </div>
              )}

              {editingField === 'name' && (
                <div className="space-y-1.5">
                  <label htmlFor="draft-name" className="text-xs font-semibold text-slate-600">
                    New full name
                  </label>
                  <Input
                    id="draft-name"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    required
                    className={`h-10 rounded-lg ${theme.ring}`}
                  />
                </div>
              )}

              {editingField === 'email' && (
                <div className="space-y-1.5">
                  <label htmlFor="draft-email" className="text-xs font-semibold text-slate-600">
                    New email address
                  </label>
                  <Input
                    id="draft-email"
                    type="email"
                    value={draftEmail}
                    onChange={(e) => setDraftEmail(e.target.value)}
                    required
                    className={`h-10 rounded-lg ${theme.ring}`}
                  />
                  <p className="text-xs text-amber-600">
                    You will need to sign in again after changing your email.
                  </p>
                </div>
              )}

              {editingField === 'password' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="new-password" className="text-xs font-semibold text-slate-600">
                      New password
                    </label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      className={`h-10 rounded-lg ${theme.ring}`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="confirm-password" className="text-xs font-semibold text-slate-600">
                      Confirm new password
                    </label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      className={`h-10 rounded-lg ${theme.ring}`}
                    />
                    <p className="text-xs text-slate-400">At least 6 characters.</p>
                  </div>
                </div>
              )}

              {editingField !== 'password' && (
                <div className="space-y-1.5 border-t border-slate-100 pt-4">
                  <label htmlFor="verify-password" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Lock className="h-3.5 w-3.5" />
                    Current password
                  </label>
                  <Input
                    id="verify-password"
                    type="password"
                    value={verifyPassword}
                    onChange={(e) => setVerifyPassword(e.target.value)}
                    placeholder="Enter password to confirm"
                    autoComplete="current-password"
                    required
                    className={`h-10 rounded-lg ${theme.ring}`}
                  />
                </div>
              )}

              {editingField === 'password' && (
                <div className="space-y-1.5 border-t border-slate-100 pt-4">
                  <label htmlFor="verify-password-pw" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Lock className="h-3.5 w-3.5" />
                    Current password
                  </label>
                  <Input
                    id="verify-password-pw"
                    type="password"
                    value={verifyPassword}
                    onChange={(e) => setVerifyPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className={`h-10 rounded-lg ${theme.ring}`}
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <Button type="button" variant="outline" onClick={closeModal} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className={`text-white ${theme.accent}`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
