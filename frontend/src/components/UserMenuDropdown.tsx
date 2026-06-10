import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { profileService, type ProfileData } from '../services/profileService';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

type UserMenuDropdownProps = {
  profilePath: string;
};

export default function UserMenuDropdown({ profilePath }: UserMenuDropdownProps) {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const loadProfile = () => {
    void profileService.getProfile().then(setProfile).catch(() => setProfile(null));
  };

  useEffect(() => {
    loadProfile();
    const onProfileUpdated = () => loadProfile();
    window.addEventListener('profile-updated', onProfileUpdated);
    return () => window.removeEventListener('profile-updated', onProfileUpdated);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/auth/login');
  };

  const initials = getInitials(profile?.name || 'U');

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => {
          if (!open) loadProfile();
          setOpen((prev) => !prev);
        }}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {profile?.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.name || 'User'}
            className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
            {initials}
          </div>
        )}
        <span className="hidden max-w-[120px] truncate text-sm font-semibold sm:block">
          {profile?.name || 'Account'}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {profile?.email && (
            <div className="border-b border-slate-100 px-4 py-2.5">
              <p className="truncate text-sm font-semibold text-slate-900">{profile.name}</p>
              <p className="truncate text-xs text-slate-500">{profile.email}</p>
            </div>
          )}
          <Link
            to={profilePath}
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <User className="h-4 w-4 text-slate-500" />
            Profile
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
